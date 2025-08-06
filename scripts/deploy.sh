#!/bin/bash
# Enterprise Deployment Script (Block 1: Convert Groovy helpers to Bash)
# Replaces Jenkins corp-shared-lib functionality

set -euo pipefail

ENVIRONMENT=${1:-"staging"}
NAMESPACE=${2:-"default"}

echo "🚀 Starting deployment to $ENVIRONMENT environment"
echo "📋 Environment: $ENVIRONMENT"
echo "🏷️  Namespace: $NAMESPACE" 
echo "📦 Image: $DOCKER_IMAGE_TAG"
echo "🔧 Pipeline ID: $CI_PIPELINE_ID"

# Validate required environment variables
if [[ -z "${DOCKER_IMAGE_TAG:-}" ]]; then
    echo "❌ ERROR: DOCKER_IMAGE_TAG is not set"
    exit 1
fi

# Function: Setup kubectl context
setup_kubectl() {
    echo "🔧 Setting up kubectl context for $ENVIRONMENT"
    
    case $ENVIRONMENT in
        "staging")
            export KUBECONFIG="$STAGING_KUBECONFIG"
            ;;
        "production")
            export KUBECONFIG="$PRODUCTION_KUBECONFIG"
            ;;
        "review")
            export KUBECONFIG="$REVIEW_KUBECONFIG"
            # Create namespace if it doesn't exist
            kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
            ;;
        *)
            echo "❌ ERROR: Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # Test kubectl connectivity
    kubectl cluster-info --request-timeout=10s || {
        echo "❌ ERROR: Cannot connect to Kubernetes cluster"
        exit 1
    }
}

# Function: Update deployment manifests
update_manifests() {
    echo "📝 Updating Kubernetes manifests"
    
    # Replace placeholders in manifests
    find "k8s/$ENVIRONMENT" -name "*.yml" -o -name "*.yaml" | while read -r file; do
        sed -i.bak \
            -e "s|__IMAGE_TAG__|$DOCKER_IMAGE_TAG|g" \
            -e "s|__NAMESPACE__|$NAMESPACE|g" \
            -e "s|__ENVIRONMENT__|$ENVIRONMENT|g" \
            -e "s|__BUILD_ID__|$CI_PIPELINE_ID|g" \
            "$file"
        
        # Validate YAML syntax
        kubectl apply --dry-run=client -f "$file" > /dev/null || {
            echo "❌ ERROR: Invalid YAML in $file"
            exit 1
        }
    done
}

# Function: Deploy with health checks
deploy_and_verify() {
    echo "🚀 Deploying to Kubernetes"
    
    # Apply manifests with timeout
    timeout 300s kubectl apply -f "k8s/$ENVIRONMENT/" --record || {
        echo "❌ ERROR: Deployment failed"
        exit 1
    }
    
    # Wait for rollout to complete
    echo "⏳ Waiting for deployment rollout..."
    kubectl rollout status deployment/jenkins-scanner -n "$NAMESPACE" --timeout=300s || {
        echo "❌ ERROR: Deployment rollout failed"
        kubectl rollout undo deployment/jenkins-scanner -n "$NAMESPACE"
        exit 1
    }
    
    # Health check
    echo "🔍 Performing health check"
    HEALTH_URL="https://${ENVIRONMENT}.jenkins-scanner.example.com/health"
    if [[ "$ENVIRONMENT" == "review" ]]; then
        HEALTH_URL="https://pr-${CI_MERGE_REQUEST_IID}.jenkins-scanner-review.example.com/health"
    fi
    
    for i in {1..10}; do
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            echo "✅ Health check passed"
            break
        fi
        echo "⏳ Health check attempt $i/10..."
        sleep 30
    done
}

# Function: Cleanup old resources
cleanup_old_resources() {
    echo "🧹 Cleaning up old resources"
    
    # Keep only last 3 ReplicaSets
    kubectl get rs -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.metadata.creationTimestamp}{"\n"}{end}' \
        | sort -k2 -r \
        | tail -n +4 \
        | awk '{print $1}' \
        | xargs -r kubectl delete rs -n "$NAMESPACE" --ignore-not-found
}

# Function: Send deployment notification
send_notification() {
    local status=$1
    local message="🚀 Deployment to $ENVIRONMENT: $status\n📦 Image: $DOCKER_IMAGE_TAG\n🔧 Pipeline: $CI_PIPELINE_URL"
    
    echo "📢 Deployment $status"
    # GitLab built-in notifications handle Slack integration
    # Configure in Project Settings > Integrations > Slack
}

# Main deployment flow
main() {
    echo "🎬 Starting deployment process..."
    
    setup_kubectl
    update_manifests
    deploy_and_verify
    cleanup_old_resources
    
    send_notification "SUCCESS ✅"
    echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
}

# Error handling
trap 'send_notification "FAILED ❌"; echo "❌ Deployment failed with error"; exit 1' ERR

# Execute main function
main "$@"
