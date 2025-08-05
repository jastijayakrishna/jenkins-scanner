#!/bin/bash

# Deployment script for Jenkins Scanner
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

echo "🚀 Deploying Jenkins Scanner to $ENVIRONMENT with tag $IMAGE_TAG"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '#' | xargs)
fi

# Build the application
echo "📦 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t jenkins-scanner:$IMAGE_TAG .

# Tag for registry
if [ -n "$DOCKER_REGISTRY" ]; then
    docker tag jenkins-scanner:$IMAGE_TAG $DOCKER_REGISTRY/jenkins-scanner:$IMAGE_TAG
    
    # Push to registry
    echo "📤 Pushing to registry..."
    docker push $DOCKER_REGISTRY/jenkins-scanner:$IMAGE_TAG
fi

# Deploy based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🚀 Deploying to production..."
    
    # Add production deployment commands here
    # Example: kubectl set image deployment/jenkins-scanner app=$DOCKER_REGISTRY/jenkins-scanner:$IMAGE_TAG
    
    # Run database migrations if needed
    # Example: npm run migrate:prod
    
    # Health check
    echo "🏥 Running health check..."
    sleep 10
    curl -f https://jenkins-scanner.com/api/health || exit 1
    
else
    echo "🚀 Deploying to staging..."
    
    # Add staging deployment commands here
    # Example: docker-compose -f docker-compose.staging.yml up -d
fi

echo "✅ Deployment complete!"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Jenkins Scanner deployed to $ENVIRONMENT (tag: $IMAGE_TAG)\"}" \
        $SLACK_WEBHOOK
fi
