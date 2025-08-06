#!/bin/bash
# Kubernetes deployment helper script
set -euo pipefail

ENV="${1:-dev}"
IMAGE_TAG="${2:-latest}"

echo "🚀 Deploying to Kubernetes environment: $ENV"
echo "📦 Image: $IMAGE_TAG"

# Set kubeconfig based on environment
case "$ENV" in
  "prod"|"production")
    export KUBECONFIG=$KUBECONFIG_CRED_MASKED
    NAMESPACE="production"
    ;;
  "dev"|"development")
    export KUBECONFIG=$KUBECONFIG_CRED_MASKED
    NAMESPACE="development"
    ;;
  *)
    export KUBECONFIG=$KUBECONFIG_CRED_MASKED
    NAMESPACE="$ENV"
    ;;
esac

echo "🏷️ Namespace: $NAMESPACE"

# Deploy to Kubernetes
kubectl set image deployment/jenkins-scanner jenkins-scanner="$IMAGE_TAG" -n "$NAMESPACE"
kubectl rollout status deployment/jenkins-scanner -n "$NAMESPACE" --timeout=300s

echo "✅ Deployment completed successfully"