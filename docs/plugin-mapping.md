# Plugin-Compatibility Mapper Documentation

## Overview

The Plugin-Compatibility Mapper is a comprehensive feature that analyzes Jenkins pipelines to detect plugin usage and provides migration guidance for GitLab CI/CD conversion. It includes automated stub generation and detailed compatibility reporting.

## Features

### 1. Plugin Detection
- **Automated Scanning**: Detects 50+ common Jenkins plugins from pipeline code
- **Pattern Matching**: Uses advanced regex patterns to identify plugin usage
- **Context Capture**: Records line numbers and usage context for each plugin
- **Confidence Scoring**: Assigns confidence levels (high/medium/low) to detections

### 2. Compatibility Mapping
- **Status Classification**: 
  - ✅ **Native Support**: Direct GitLab CI equivalent available
  - ⚠️ **Template Available**: GitLab CI template can be used
  - 🔄 **Limited Support**: Partial functionality available
  - ❌ **Unsupported**: No direct equivalent, manual implementation required

### 3. Auto-Stub Generation
- **GitLab CI Includes**: Automatically adds relevant GitLab CI templates
- **Job Stubs**: Generates starter job configurations for common plugins
- **Best Practices**: Includes GitLab CI best practices and configurations

### 4. Migration Planning
- **Migration Score**: 0-100 score based on plugin compatibility
- **Detailed Checklist**: Comprehensive markdown checklist for migration planning
- **Complexity Assessment**: Easy/Medium/Hard complexity ratings per plugin

## Architecture

### Core Components

#### 1. Plugin Scanner (`lib/plugin-mapper.ts`)
```typescript
export function scanJenkinsFile(content: string): PluginHit[]
```
- Analyzes Jenkins pipeline content
- Uses pattern matching to detect plugin usage
- Returns array of plugin hits with context

#### 2. Plugin Mapping Database (`lib/plugins-mapping.json`)
```json
{
  "slack": {
    "status": "native",
    "gitlab": "notifications:slack",
    "note": "Use GitLab Slack notifications"
  }
}
```
- Central database of 50+ Jenkins plugins
- Maps each plugin to GitLab CI equivalent
- Includes migration notes and documentation links

#### 3. GitLab Converter Integration (`lib/gitlab-converter-advanced.ts`)
```typescript
export function generatePluginStubs(pluginVerdicts: PluginVerdict[]): string
```
- Automatically injects GitLab CI includes and job stubs
- Based on detected plugin verdicts
- Generates production-ready GitLab CI configurations

#### 4. API Endpoint (`pages/api/plugins.ts`)
```typescript
POST /api/plugins
{
  "jenkinsfile": "pipeline { ... }"
}
```
- RESTful API for plugin analysis
- Returns verdicts, summary, and migration checklist
- Includes caching and error handling

#### 5. UI Components
- **PluginReport Component**: Rich table with filtering and plugin details
- **ResultModal Integration**: Tabbed interface (Analysis/Plugins)
- **Plugin Detail Modals**: Detailed migration information per plugin

## Plugin Database Schema

Each plugin entry in `lib/plugins-mapping.json` follows this schema:

```typescript
interface PluginMapping {
  status: 'native' | 'template' | 'unsupported' | 'limited'
  gitlab?: string           // GitLab CI equivalent syntax
  include?: string          // GitLab CI template to include
  note: string             // Migration guidance
  documentation?: string    // Link to documentation
  alternative?: string      // Alternative solution description
}
```

### Example Entries

```json
{
  "slack": {
    "status": "native",
    "gitlab": "notifications:slack",
    "note": "Configure Slack webhook URL in GitLab project settings",
    "documentation": "https://docs.gitlab.com/ee/ci/chatops/"
  },
  "docker-workflow": {
    "status": "template",
    "include": "https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Docker.gitlab-ci.yml",
    "note": "Use official GitLab Docker template with customizations"
  },
  "custom-legacy-plugin": {
    "status": "unsupported",
    "note": "No direct equivalent available. Consider manual implementation using GitLab CI scripts",
    "alternative": "Use GitLab CI script jobs with custom Docker images"
  }
}
```

## Migration Score Calculation

The migration score is calculated as follows:

```typescript
const migrationScore = Math.round((actualScore / maxScore) * 100)

where:
- Native Support: 100 points each
- Template Available: 75 points each  
- Limited Support: 50 points each
- Unsupported: 0 points each
```

### Score Interpretation
- **80-100**: Excellent - Most plugins have native support
- **60-79**: Good - Mix of native and template solutions
- **40-59**: Challenging - Significant manual work required
- **0-39**: Complex - Major rework needed

## Auto-Stub Generation

The system automatically generates GitLab CI configuration based on detected plugins:

### 1. Template Includes
For plugins with `status: "template"`:
```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Docker.gitlab-ci.yml
```

### 2. Job Stubs
For plugins with `status: "native"`, generates appropriate job configurations:

#### Slack Notifications
```yaml
notify:slack:
  stage: .post
  when: on_failure
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Pipeline failed: $CI_PIPELINE_URL"}' \
        $SLACK_WEBHOOK_URL
  allow_failure: true
```

#### Workspace Cleanup
```yaml
cleanup:workspace:
  stage: .post
  when: always
  script:
    - echo "Cleaning up workspace"
    - rm -rf $CI_PROJECT_DIR/tmp/
    - docker system prune -f || true
  allow_failure: true
```

## API Usage

### Plugin Analysis Request
```bash
curl -X POST /api/plugins \
  -H "Content-Type: application/json" \
  -d '{"jenkinsfile": "pipeline { agent any; stages { ... } }"}'
```

### Response Format
```typescript
interface PluginAnalysisResponse {
  verdicts: PluginVerdict[]      // Detailed plugin analysis
  summary: PluginScanSummary     // Statistics summary
  migrationChecklist: string    // Markdown checklist
  success: boolean
  error?: string
}
```

## UI Integration

### ResultModal Tabs
The ResultModal component includes two tabs:
1. **Analysis Tab**: Traditional pipeline analysis (complexity, warnings, stats)
2. **Plugins Tab**: Plugin compatibility report with filtering and details

### Plugin Report Features
- **Status Filtering**: Filter by native/template/limited/unsupported
- **Plugin Details**: Click for detailed migration information
- **Migration Actions**: Copy/download migration checklist
- **Migration Score**: Visual score with color coding

## Testing

Comprehensive test coverage includes:

### Unit Tests
- Plugin detection accuracy (`__tests__/plugin-mapper.test.ts`)
- Converter stub generation (`__tests__/converter-stub.test.ts`)
- End-to-end pipeline processing

### Test Categories
1. **Pattern Matching**: Verify plugin detection patterns
2. **Mapping Logic**: Test plugin-to-GitLab conversions
3. **Summary Generation**: Validate statistics calculation
4. **Checklist Generation**: Test markdown output
5. **Stub Generation**: Verify GitLab CI stub creation

## Extending the System

### Adding New Plugins

1. **Update Detection Patterns** (`lib/plugin-mapper.ts`):
```typescript
{ pattern: /\bmyPlugin\s*[\(\{]/, group: 'my-plugin', confidence: 'high' as const }
```

2. **Add Mapping Entry** (`lib/plugins-mapping.json`):
```json
{
  "my-plugin": {
    "status": "native",
    "gitlab": "my_gitlab_equivalent",
    "note": "Migration guidance here"
  }
}
```

3. **Add Stub Generator** (optional, `lib/gitlab-converter-advanced.ts`):
```typescript
case 'my-plugin':
  stubJobs.push(generateMyPluginStub())
  break
```

### Custom Pattern Matching
For complex plugins, add custom detection logic:

```typescript
// Special handling for complex patterns
if (line.includes('myComplexPlugin') && line.includes('specialConfig')) {
  hits.push({
    id: 'my-complex-plugin',
    line: lineNumber,
    context: trimmedLine,
    confidence: 'high'
  })
}
```

## Performance Considerations

- **Pattern Optimization**: Regex patterns are optimized for performance
- **Deduplication**: Removes duplicate plugin hits automatically
- **Caching**: API responses cached for 5 minutes
- **Async Processing**: Plugin analysis runs asynchronously in UI

## Security

- **Input Validation**: Jenkinsfile content validated and size-limited (500KB max)
- **No Code Execution**: Static analysis only, no pipeline execution
- **Safe Patterns**: Regex patterns designed to avoid ReDoS attacks
- **Error Handling**: Graceful failure with detailed error messages

## Migration Checklist Format

The generated checklist includes:

```markdown
# Jenkins to GitLab CI Migration Checklist

## Summary
- **Total Plugins:** X
- **Migration Score:** X/100
- **Native Support:** X plugins
- **Template Available:** X plugins
- **Unsupported:** X plugins

## ✅ Native Support (Easy Migration)
- [ ] **plugin-name**
  - Migrate to: `gitlab_equivalent`
  - Notes: Migration guidance

## ⚠️ Template Available (Medium Migration)
- [ ] **plugin-name**
  - Include: `template: Template.gitlab-ci.yml`
  - Notes: Configuration required

## ❌ Unsupported (Hard Migration)
- [ ] **plugin-name**
  - Manual implementation required
  - Research alternative solutions

## Migration Notes
1. Start with native support plugins (✅)
2. Add template includes (⚠️) 
3. Research alternatives for unsupported plugins (❌)
4. Test each conversion in development environment
5. Update CI/CD variables and secrets as needed
```

This comprehensive documentation provides everything needed to understand, use, and extend the Plugin-Compatibility Mapper feature.