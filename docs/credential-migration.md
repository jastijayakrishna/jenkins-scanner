# Jenkins Credential Migration Guide

This guide explains how to migrate Jenkins credentials to GitLab CI/CD variables using the Jenkins Scanner's Credential Migrator feature.

## Overview

The Credential Migrator automatically detects credential references in your Jenkins pipelines and provides:

- **Automated Detection**: Scans Jenkinsfiles for credential references
- **Smart Mapping**: Maps Jenkins credentials to appropriate GitLab variable types
- **Security Best Practices**: Configures masking and protection settings
- **Migration Artifacts**: Generates scripts and environment files
- **Status Verification**: Checks if variables exist in your GitLab project

## Supported Credential Types

### Jenkins Credential Types Detected

1. **Username/Password Credentials**
   ```groovy
   withCredentials([
     usernamePassword(credentialsId: 'docker-hub-creds', 
                     usernameVariable: 'DOCKER_USER',
                     passwordVariable: 'DOCKER_PASS')
   ])
   ```

2. **Secret Text Credentials**
   ```groovy
   withCredentials([
     string(credentialsId: 'api-token', variable: 'API_TOKEN')
   ])
   ```

3. **File Credentials**
   ```groovy
   withCredentials([
     file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG')
   ])
   ```

4. **SSH Private Key Credentials**
   ```groovy
   withCredentials([
     sshUserPrivateKey(credentialsId: 'deploy-ssh-key',
                      keyFileVariable: 'SSH_KEY',
                      usernameVariable: 'SSH_USER')
   ])
   ```

5. **Environment Variables**
   ```groovy
   environment {
     API_KEY = env.API_KEY
     DATABASE_PASSWORD = credentials('db-password')
   }
   ```

6. **Plugin-Specific Credentials**
   ```groovy
   // Docker registry
   docker.withRegistry('https://registry.com', 'registry-creds')
   
   // AWS credentials
   withAWS(credentials: 'aws-creds', region: 'us-east-1')
   
   // Kubernetes config
   kubeconfigFile(credentialsId: 'k8s-config')
   ```

### GitLab Variable Mapping

| Jenkins Type | GitLab Type | Masked | Protected | Notes |
|--------------|-------------|---------|-----------|--------|
| Username/Password | Variable (2x) | ✅ | ✅ | Split into `_USER` and `_PASS` |
| Secret Text | Variable | ✅ | ✅ | Single masked variable |
| File | File Variable | ❌ | ✅ | Base64 encoded content |
| SSH Key | Variable | ✅ | ✅ | Private key as text |
| Environment | Variable | ✅ | ✅ | Based on name pattern |

## Using the Credential Migrator

### Step 1: Upload Your Jenkinsfile

1. Upload your Jenkinsfile using the file uploader
2. Wait for the initial scan to complete
3. Click on "View Detailed Results" to open the results modal

### Step 2: Access the Secrets Tab

1. In the results modal, click the **"Secrets"** tab
2. The system will automatically analyze your pipeline for credentials
3. Review the detected credentials and their proposed GitLab variable mappings

### Step 3: Configure GitLab Integration (Optional)

To check if variables already exist in your GitLab project:

1. Click **"Check Status"** in the Secrets tab
2. When prompted, provide:
   - **Project ID**: Your GitLab project ID (e.g., `12345` or `username/project-name`)
   - **Access Token**: A GitLab personal access token with `api` scope

**Creating a GitLab Access Token:**
1. Go to GitLab → User Settings → Access Tokens
2. Create a token with `api` scope
3. Copy the token (starts with `glpat-`)

### Step 4: Review Variable Mappings

The Secrets tab displays:

- **Credential ID**: Original Jenkins credential reference
- **GitLab Variable**: Proposed variable name (sanitized for GitLab)
- **Type**: Variable or File type
- **Status**: Whether the variable exists in GitLab (if configured)
- **Properties**: Masked/Protected settings

### Step 5: Generate Migration Artifacts

The tool provides several artifacts to help with migration:

#### .env File
- Click **"Show .env File"** or **"Download .env"**
- Contains all variables in environment file format
- Use for local development and testing
- Example:
  ```bash
  # GitLab CI/CD Variables for Local Development
  # API token for external service
  API_TOKEN=<🔑 ADD_VALUE>
  
  # Configuration file
  CONFIG_FILE=<🔑 BASE64_FILE_CONTENT>
  ```

#### Shell Script
- Click **"Show Script"** or **"Download Script"**
- Automated script to create all GitLab variables
- Includes error handling and validation
- Example usage:
  ```bash
  # Set environment variables
  export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"
  export PROJECT_ID="12345"
  
  # Run the script
  chmod +x create_gitlab_vars.sh
  ./create_gitlab_vars.sh
  ```

## Variable Naming Conventions

The tool automatically sanitizes Jenkins credential IDs for GitLab compatibility:

### Transformation Rules

1. **Convert to uppercase**: `my-secret` → `MY_SECRET`
2. **Replace invalid characters**: `my-secret!@#` → `MY_SECRET`
3. **Handle numeric prefixes**: `123-token` → `VAR_123_TOKEN`
4. **Avoid CI_ conflicts**: `CI_TOKEN` → `APP_CI_TOKEN`
5. **Smart suffixes**: `docker-registry-creds` → `REGISTRY_USER` + `REGISTRY_PASS`

### Common Patterns

| Jenkins Credential | GitLab Variables | Notes |
|-------------------|------------------|--------|
| `docker-hub-creds` | `DOCKER_HUB_CREDS_USER`<br>`DOCKER_HUB_CREDS_PASS` | Username/password split |
| `api-token` | `API_TOKEN` | Direct mapping |
| `kubeconfig-file` | `KUBECONFIG_FILE` | File variable |
| `deploy-ssh-key` | `SSH_DEPLOY_SSH_KEY` | SSH key pattern |
| `db-password` | `DB_PASSWORD` | Database credential |

## Security Best Practices

### Variable Protection Settings

- **Masked**: Prevents variable values from appearing in job logs
- **Protected**: Only available to protected branches/tags
- **Environment Scope**: Restricts variables to specific environments

### Recommendations

1. **Always mask sensitive variables**: API tokens, passwords, keys
2. **Protect production variables**: Use protected branches for deployments
3. **Use environment scopes**: Separate dev/staging/production credentials
4. **Regular rotation**: Update credentials periodically
5. **Least privilege**: Only grant necessary permissions

### File Variables

For file credentials (certificates, configs, SSH keys):

1. **Base64 encode** the file content
2. **Use file variables** instead of regular variables
3. **Don't mask file variables** (GitLab limitation)
4. **Store securely** in GitLab's encrypted storage

Example:
```bash
# Encode file for GitLab
base64 -w 0 certificate.pem > certificate.base64

# In GitLab CI/CD, decode the file
echo "$CERTIFICATE_FILE" | base64 -d > certificate.pem
```

## Troubleshooting

### Common Issues

#### 1. Variables Not Detected
- **Cause**: Unusual credential syntax or custom plugin usage
- **Solution**: Add custom mappings or manual configuration

#### 2. Invalid Variable Names
- **Cause**: Jenkins credential IDs with special characters
- **Solution**: Review suggested names in validation warnings

#### 3. GitLab API Errors
- **Cause**: Invalid access token or project ID
- **Solution**: Verify token permissions and project access

#### 4. Duplicate Variable Names
- **Cause**: Multiple credentials map to the same GitLab variable name
- **Solution**: Use custom mappings to provide unique names

### Custom Mappings

For special cases, you can provide custom mappings via the API:

```typescript
const customMappings = {
  'special-jenkins-cred': {
    proposedKey: 'CUSTOM_VAR_NAME',
    type: 'file',
    masked: false,
    description: 'Custom credential mapping'
  }
}
```

### Validation Warnings

The tool provides validation to catch common issues:

- **Duplicate variable keys**
- **Invalid naming conventions**
- **CI_ prefix conflicts**
- **Overly long variable names**
- **File variables marked as masked**

## Migration Checklist

### Pre-Migration

- [ ] Review all detected credentials
- [ ] Verify variable name mappings
- [ ] Check for any validation warnings
- [ ] Test .env file in local environment

### Migration Process

- [ ] Create GitLab access token with `api` scope
- [ ] Run the generated shell script
- [ ] Verify variables were created in GitLab project settings
- [ ] Test pipeline with new variables

### Post-Migration

- [ ] Update Jenkinsfile to use GitLab CI/CD syntax
- [ ] Remove old Jenkins credentials
- [ ] Update documentation and team processes
- [ ] Set up credential rotation schedule

### GitLab Pipeline Updates

After migrating credentials, update your GitLab CI/CD pipeline:

```yaml
# Before (Jenkins)
withCredentials([
  usernamePassword(credentialsId: 'docker-creds', 
                  usernameVariable: 'USER',
                  passwordVariable: 'PASS')
]) {
  sh 'docker login -u $USER -p $PASS'
}

# After (GitLab CI/CD)
build:
  script:
    - docker login -u "$DOCKER_CREDS_USER" -p "$DOCKER_CREDS_PASS"
  variables:
    DOCKER_CREDS_USER: "$DOCKER_CREDS_USER"  # Reference to GitLab variable
    DOCKER_CREDS_PASS: "$DOCKER_CREDS_PASS"  # Reference to GitLab variable
```

## API Reference

### POST /api/creds

Analyze Jenkins credentials and generate GitLab variable mappings.

**Request Body:**
```typescript
{
  jenkinsfile: string;           // Required: Jenkinsfile content
  projectId?: string;            // GitLab project ID
  environmentScope?: string;     // Variable scope (default: '*')
  forceProtected?: boolean;      // Force all variables to be protected
  customMappings?: object;       // Custom credential mappings
  options?: {
    generateEnv?: boolean;       // Generate .env file
    generateScript?: boolean;    // Generate shell script
    dryRun?: boolean;           // Script dry run mode
    batchSize?: number;         // Variables per batch
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    credentials: CredentialHit[];    // Detected credentials
    analysis: UsageAnalysis;         // Usage statistics
    variables: GitLabVarSpec[];      // Variable specifications
    validation: ValidationResult;    // Validation results
    envFile?: string;               // Generated .env content
    script?: string;                // Generated shell script
    summary: {
      totalCredentials: number;
      totalVariables: number;
      fileVariables: number;
      protectedVariables: number;
      maskedVariables: number;
    }
  }
}
```

## Support

For additional help with credential migration:

1. **Check validation warnings** for specific issues
2. **Review the generated artifacts** before applying
3. **Test in a development environment** first
4. **Use GitLab's built-in variable management** for ongoing maintenance

The Credential Migrator is designed to handle 95% of common Jenkins credential patterns automatically, with extensibility for custom scenarios.