#!/bin/bash
# GitLab CI/CD Variables Creation Script Template
# This template will be populated by the credential mapper

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${CI_PROJECT_ID:-{{PROJECT_ID}}}
GITLAB_TOKEN=${GITLAB_TOKEN:-}
API_URL=${CI_API_V4_URL:-https://gitlab.com/api/v4}
DRY_RUN={{DRY_RUN:-false}}
BATCH_SIZE={{BATCH_SIZE:-10}}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Validation
validate_environment() {
    log_info "Validating environment..."
    
    if [[ -z "$GITLAB_TOKEN" ]]; then
        log_error "GITLAB_TOKEN environment variable is required"
        log_info "Get your token from: https://gitlab.com/-/profile/personal_access_tokens"
        log_info "Token needs 'api' scope for variable management"
        exit 1
    fi
    
    if [[ -z "$PROJECT_ID" ]]; then
        log_error "PROJECT_ID is required"
        log_info "Usage: PROJECT_ID=12345 GITLAB_TOKEN=glpat-xxx $0"
        exit 1
    fi
    
    # Test API connectivity
    local response
    if ! response=$(curl -s -w "%{http_code}" -o /tmp/gitlab_test_response \
        --header "PRIVATE-TOKEN:$GITLAB_TOKEN" \
        "$API_URL/projects/$PROJECT_ID" 2>/dev/null); then
        log_error "Failed to connect to GitLab API"
        exit 1
    fi
    
    if [[ "$response" != "200" ]]; then
        log_error "GitLab API returned HTTP $response"
        if [[ -f /tmp/gitlab_test_response ]]; then
            log_error "$(cat /tmp/gitlab_test_response)"
        fi
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Function to create a single variable
create_variable() {
    local key="$1"
    local value="$2"
    local masked="$3"
    local protected="$4"
    local scope="$5"
    local description="$6"
    
    log_info "Creating variable: $key"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "[DRY RUN] Would create: $key (masked: $masked, protected: $protected, scope: $scope)"
        return 0
    fi
    
    # Check if variable already exists
    local check_response
    check_response=$(curl -s -w "%{http_code}" -o /tmp/gitlab_var_check \
        --header "PRIVATE-TOKEN:$GITLAB_TOKEN" \
        "$API_URL/projects/$PROJECT_ID/variables/$key" 2>/dev/null || echo "000")
    
    if [[ "$check_response" == "200" ]]; then
        log_warning "Variable $key already exists - updating"
        local response
        response=$(curl -s -w "%{http_code}" -o /tmp/gitlab_var_response \
            --header "PRIVATE-TOKEN:$GITLAB_TOKEN" \
            --request PUT \
            --data "key=$key" \
            --data "value=$value" \
            --data "masked=$masked" \
            --data "protected=$protected" \
            --data "environment_scope=$scope" \
            "$API_URL/projects/$PROJECT_ID/variables/$key")
    else
        log_info "Creating new variable: $key"
        local response
        response=$(curl -s -w "%{http_code}" -o /tmp/gitlab_var_response \
            --header "PRIVATE-TOKEN:$GITLAB_TOKEN" \
            --request POST \
            --data "key=$key" \
            --data "value=$value" \
            --data "masked=$masked" \
            --data "protected=$protected" \
            --data "environment_scope=$scope" \
            "$API_URL/projects/$PROJECT_ID/variables")
    fi
    
    if [[ "$response" =~ ^2[0-9][0-9]$ ]]; then
        log_success "✅ $key"
    else
        log_error "❌ Failed: $key (HTTP $response)"
        if [[ -f /tmp/gitlab_var_response ]]; then
            cat /tmp/gitlab_var_response
        fi
        echo
        return 1
    fi
}

# Main execution
main() {
    log_info "GitLab CI/CD Variables Creation Script"
    log_info "====================================="
    log_info "Project: $PROJECT_ID"
    log_info "API URL: $API_URL"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No variables will be created"
    fi
    
    echo
    
    # Validate environment
    validate_environment
    echo
    
    # Variables will be inserted here by the template processor
    local success_count=0
    local error_count=0
    
    {{VARIABLE_CREATION_CALLS}}
    
    echo
    log_info "Script completed"
    log_success "Successfully created: $success_count variables"
    
    if [[ $error_count -gt 0 ]]; then
        log_error "Failed to create: $error_count variables"
        exit 1
    fi
    
    echo
    log_info "Check your GitLab project settings to verify variables:"
    log_info "https://gitlab.com/YOUR_USERNAME/YOUR_PROJECT/-/settings/ci_cd"
    log_success "All variables created successfully! 🎉"
}

# Cleanup function
cleanup() {
    rm -f /tmp/gitlab_var_response /tmp/gitlab_var_check /tmp/gitlab_test_response 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

# Run main function
main "$@"