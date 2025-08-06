#!/bin/bash
# P1 CRITICAL: Replaces Jenkins corp-shared-lib build functions
# Migrated Groovy build helpers to production-grade Bash

set -euo pipefail

BUILD_TYPE=${1:-"standard"}
NODE_VERSION=${2:-"18"}
ENVIRONMENT=${3:-"development"}

echo "🏗️ Build Helper - Type: $BUILD_TYPE, Node: $NODE_VERSION, Env: $ENVIRONMENT"

# Function: Setup build environment (replaces shared-lib setupBuild())
setup_build_environment() {
    echo "🔧 Setting up build environment..."
    
    # Install dependencies with retry logic
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        if npm ci --prefer-offline --no-audit --silent; then
            echo "✅ Dependencies installed successfully"
            break
        else
            retry_count=$((retry_count + 1))
            echo "⚠️ Dependency installation failed (attempt $retry_count/$max_retries)"
            if [ $retry_count -eq $max_retries ]; then
                echo "❌ Failed to install dependencies after $max_retries attempts"
                exit 1
            fi
            sleep 5
        fi
    done
    
    # Setup build environment variables
    export NODE_ENV="$ENVIRONMENT"
    export BUILD_NUMBER="${CI_PIPELINE_ID:-local}"
    export BUILD_TAG="${CI_COMMIT_SHA:-local}"
    export NEXT_TELEMETRY_DISABLED=1
}

# Function: Run standard build (replaces shared-lib standardBuild())
run_standard_build() {
    echo "📦 Running standard build..."
    
    # Pre-build validation
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found"
        exit 1
    fi
    
    # Run Next.js build with optimization
    npm run build
    
    # Validate build output
    if [ ! -d ".next" ]; then
        echo "❌ Build output directory (.next) not found"
        exit 1
    fi
    
    echo "✅ Standard build completed successfully"
}

# Function: Run production build (replaces shared-lib productionBuild())
run_production_build() {
    echo "🚀 Running production build..."
    
    # Production-specific optimizations
    export NODE_ENV="production"
    export NEXT_OPTIMIZE_FONTS=true
    export NEXT_BUNDLE_ANALYZE=false
    
    npm run build
    
    # Production build validation
    local build_size=$(du -sh .next | cut -f1)
    echo "📊 Build size: $build_size"
    
    # Check for critical files
    local required_files=(".next/BUILD_ID" ".next/static")
    for file in "${required_files[@]}"; do
        if [ ! -e ".next/$file" ] && [ ! -e "$file" ]; then
            echo "⚠️ Warning: $file not found in production build"
        fi
    done
    
    echo "✅ Production build completed successfully"
}

# Function: Run tests with coverage (replaces shared-lib testWithCoverage())
run_tests_with_coverage() {
    echo "🧪 Running tests with coverage..."
    
    # Run Jest with coverage
    npm test -- --coverage --passWithNoTests --detectOpenHandles --forceExit --maxWorkers=2
    
    # Generate coverage report
    if [ -d "coverage" ]; then
        local coverage_percent=$(grep -o '"pct":[0-9.]*' coverage/coverage-summary.json | head -1 | cut -d':' -f2)
        echo "📊 Test coverage: ${coverage_percent}%"
        
        # Coverage threshold check
        local min_coverage=${MIN_COVERAGE:-75}
        if (( $(echo "$coverage_percent < $min_coverage" | bc -l) )); then
            echo "⚠️ Warning: Coverage ($coverage_percent%) below minimum ($min_coverage%)"
        else
            echo "✅ Coverage requirement met"
        fi
    fi
    
    echo "✅ Tests with coverage completed successfully"
}

# Function: Package artifacts (replaces shared-lib packageArtifacts())
package_artifacts() {
    echo "📦 Packaging artifacts..."
    
    local artifact_name="jenkins-scanner-${BUILD_TAG:-$(date +%Y%m%d-%H%M%S)}"
    
    # Create artifacts directory
    mkdir -p dist/artifacts
    
    # Package build artifacts
    tar -czf "dist/artifacts/${artifact_name}-build.tar.gz" \
        .next/ \
        package.json \
        package-lock.json \
        next.config.js \
        public/ \
        --exclude-vcs
    
    # Package test artifacts
    if [ -d "coverage" ]; then
        tar -czf "dist/artifacts/${artifact_name}-coverage.tar.gz" coverage/
    fi
    
    # Generate artifact manifest
    cat > "dist/artifacts/manifest.json" <<EOF
{
    "artifact_name": "$artifact_name",
    "build_time": "$(date -Iseconds)",
    "node_version": "$NODE_VERSION",
    "environment": "$ENVIRONMENT",
    "commit_sha": "${CI_COMMIT_SHA:-unknown}",
    "pipeline_id": "${CI_PIPELINE_ID:-unknown}",
    "files": [
        "${artifact_name}-build.tar.gz",
        "${artifact_name}-coverage.tar.gz"
    ]
}
EOF
    
    echo "✅ Artifacts packaged successfully"
    ls -la dist/artifacts/
}

# Main execution logic
main() {
    echo "🚀 Starting build process..."
    
    setup_build_environment
    
    case "$BUILD_TYPE" in
        "standard")
            run_standard_build
            ;;
        "production")
            run_production_build
            ;;
        "with-tests")
            run_standard_build
            run_tests_with_coverage
            ;;
        "full")
            run_production_build
            run_tests_with_coverage
            package_artifacts
            ;;
        *)
            echo "❌ Unknown build type: $BUILD_TYPE"
            echo "Available types: standard, production, with-tests, full"
            exit 1
            ;;
    esac
    
    echo "🎉 Build process completed successfully!"
}

# Execute main function with all arguments
main "$@"