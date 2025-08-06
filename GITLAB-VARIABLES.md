# GitLab CI/CD Variables Configuration

**Required for Enterprise Pipeline v3.0**

Navigate to **Project → Settings → CI/CD → Variables** and configure:

## P2 CRITICAL: All Secrets MUST be Masked Variables (NOT in YAML)

| Variable Name | Value | Type | Protected | Masked | Scope |
|---------------|-------|------|-----------|--------|-------|
| `SONAR_TOKEN_MASKED` | `your-sonarqube-token` | Variable | ✅ | ✅ | All |
| `DOCKER_REGISTRY` | `registry.gitlab.com/your-group/jenkins-scanner` | Variable | ❌ | ❌ | All |
| `SLACK_WEBHOOK_MASKED` | `https://hooks.slack.com/...` | Variable | ❌ | ✅ | All |
| `ARTIFACTORY_RT_MASKED` | `your-artifactory-token` | Variable | ✅ | ✅ | All |

## Kubernetes Configuration

| Variable Name | Value | Type | Protected | Masked | Scope |
|---------------|-------|------|-----------|--------|-------|
| `STAGING_KUBECONFIG` | `base64-encoded-kubeconfig` | File | ✅ | ✅ | All |
| `PRODUCTION_KUBECONFIG` | `base64-encoded-kubeconfig` | File | ✅ | ✅ | All |
| `REVIEW_KUBECONFIG` | `base64-encoded-kubeconfig` | File | ✅ | ✅ | All |

## P2 CRITICAL: Integration Secrets (All Must Be Masked)

| Variable Name | Value | Type | Protected | Masked | Scope |
|---------------|-------|------|-----------|--------|-------|
| `SLACK_WEBHOOK_MASKED` | `https://hooks.slack.com/...` | Variable | ❌ | ✅ | All |
| `TEAMS_WEBHOOK_MASKED` | `https://outlook.office.com/webhook/...` | Variable | ❌ | ✅ | All |
| `EMAIL_RECIPIENT` | `team@company.com` | Variable | ❌ | ❌ | All |
| `ALERTMANAGER_URL` | `https://alertmanager.example.com` | Variable | ❌ | ❌ | All |

## Environment-Specific URLs

| Variable Name | Value | Type | Protected | Masked | Scope |
|---------------|-------|------|-----------|--------|-------|
| `STAGING_URL` | `https://jenkins-scanner-staging.example.com` | Variable | ❌ | ❌ | All |
| `PRODUCTION_URL` | `https://jenkins-scanner.example.com` | Variable | ❌ | ❌ | All |
| `REVIEW_BASE_URL` | `jenkins-scanner-review.example.com` | Variable | ❌ | ❌ | All |

## Setup Commands

### Generate Kubeconfig (Base64 encoded)
```bash
# For each environment, encode your kubeconfig:
cat ~/.kube/config-staging | base64 -w 0
cat ~/.kube/config-production | base64 -w 0
cat ~/.kube/config-review | base64 -w 0
```

### SonarQube Token
1. Login to SonarQube
2. Go to **My Account → Security → Generate Token**
3. Copy token and add as masked variable

### Slack Webhook (Optional)
1. Create Slack App at https://api.slack.com/apps
2. Enable **Incoming Webhooks**
3. Create webhook for your channel
4. Add URL as masked variable

## GitLab Built-in Integrations

Instead of variables, configure these in **Project → Settings → Integrations**:

### Slack Notifications
- Go to **Integrations → Slack notifications**
- Configure webhook URL and channels
- Enable pipeline events

### Email Notifications  
- Go to **Integrations → Emails on push**
- Configure recipients for pipeline events

## Verification Script

Run this in your GitLab CI to verify configuration:

```yaml
verify:variables:
  stage: prepare
  script:
    - echo "🔧 Verifying CI/CD configuration..."
    - |
      if [ -z "$SONAR_TOKEN_MASKED" ]; then
        echo "❌ SONAR_TOKEN_MASKED not configured"
        exit 1
      fi
    - |
      if [ -z "$STAGING_KUBECONFIG" ]; then
        echo "❌ STAGING_KUBECONFIG not configured"
        exit 1
      fi
    - |
      if [ -z "$PRODUCTION_KUBECONFIG" ]; then
        echo "❌ PRODUCTION_KUBECONFIG not configured"  
        exit 1
      fi
    - echo "✅ All required variables configured"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - when: manual
```

## Security Best Practices

1. **Always mask sensitive variables**
2. **Use protected variables for production**
3. **Rotate tokens regularly (quarterly)**
4. **Use minimal permissions for service accounts**
5. **Audit variable access logs**

---

**Next Steps:**
1. Configure all required variables
2. Test with a simple pipeline run
3. Gradually enable security scanning
4. Set up environment deployments