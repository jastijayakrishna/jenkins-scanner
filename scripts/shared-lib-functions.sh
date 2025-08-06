#!/bin/bash
# FIX #5: Shared library functions ported from Jenkins Groovy to Bash
# Replaces @Library functions that were detected in the original Jenkinsfile

set -euo pipefail

# Function: getBuildDisplayName (from shared library)
get_build_display_name() {
    local commit_hash="${1:-$CI_COMMIT_SHORT_SHA}"
    local build_id="${2:-$CI_PIPELINE_ID}"
    echo "#${build_id} ${commit_hash}"
}

# Function: notifySlack (from shared library)
notify_slack() {
    local status="$1"
    local message="$2"
    local channel="${3:-#ci-results}"
    
    echo "📢 Slack notification: $status - $message"
    # GitLab native Slack integration handles this
    # Configure in Project Settings > Integrations > Slack
}

# Function: deployToK8s (from shared library)
deploy_to_k8s() {
    local env="$1"
    local image_tag="$2"
    local namespace="${3:-$env}"
    
    echo "🚀 Deploying to K8s environment: $env"
    echo "📦 Image: $image_tag"
    echo "🏷️ Namespace: $namespace"
    
    kubectl set image deployment/jenkins-scanner jenkins-scanner="$image_tag" -n "$namespace"
    kubectl rollout status deployment/jenkins-scanner -n "$namespace"
}

# Function: publishToArtifactory (from shared library)
publish_to_artifactory() {
    local file_path="$1"
    local target_path="$2"
    
    echo "📤 Publishing to Artifactory"
    echo "📁 File: $file_path"
    echo "🎯 Target: $target_path"
    
    # Use JFrog CLI or curl depending on complexity
    if command -v jfrog >/dev/null; then
        jfrog rt u "$file_path" "$target_path"
    else
        curl -u "$ARTIFACTORY_RT" -T "$file_path" "$target_path"
    fi
}

# Main execution - call functions based on argument
case "${1:-help}" in
    "build-display")
        get_build_display_name "$2" "$3"
        ;;
    "notify-slack")
        notify_slack "$2" "$3" "$4"
        ;;
    "deploy-k8s")
        deploy_to_k8s "$2" "$3" "$4"
        ;;
    "publish-artifactory")
        publish_to_artifactory "$2" "$3"
        ;;
    "help")
        echo "Shared library functions:"
        echo "  build-display <commit> <build_id>"
        echo "  notify-slack <status> <message> [channel]"
        echo "  deploy-k8s <env> <image_tag> [namespace]"
        echo "  publish-artifactory <file> <target>"
        ;;
    *)
        echo "Unknown function: $1"
        exit 1
        ;;
esac