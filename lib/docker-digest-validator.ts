/**
 * Docker Digest Validator
 * Validates Docker images using SHA256 digests for security and integrity
 */

export interface DockerImageReference {
  registry?: string
  namespace?: string
  repository: string
  tag?: string
  digest?: string
  full_reference: string
}

export interface DockerValidationResult {
  image: string
  is_valid: boolean
  has_digest: boolean
  security_score: number // 0-100
  vulnerabilities: DockerVulnerability[]
  recommendations: string[]
  validated_reference: string
  metadata: {
    last_updated?: string
    size?: number
    architecture?: string
    os?: string
  }
}

export interface DockerVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  type: string
  description: string
  cve_id?: string
  fix_available: boolean
}

export interface DockerSecurityPolicy {
  require_digest: boolean
  allowed_registries: string[]
  blocked_tags: string[] // e.g., ['latest', 'master']
  minimum_security_score: number
  max_vulnerability_count: {
    critical: number
    high: number
  }
}

export class DockerDigestValidator {
  private securityPolicy: DockerSecurityPolicy
  private digestCache: Map<string, DockerValidationResult> = new Map()

  constructor(policy?: Partial<DockerSecurityPolicy>) {
    this.securityPolicy = {
      require_digest: true,
      allowed_registries: [
        'docker.io',
        'registry.gitlab.com',
        'gcr.io',
        'quay.io',
        'public.ecr.aws'
      ],
      blocked_tags: ['latest', 'master', 'main'],
      minimum_security_score: 70,
      max_vulnerability_count: {
        critical: 0,
        high: 5
      },
      ...policy
    }
  }

  /**
   * Validate a Docker image reference for security and integrity
   */
  async validateDockerImage(imageRef: string): Promise<DockerValidationResult> {
    // Check cache first
    if (this.digestCache.has(imageRef)) {
      return this.digestCache.get(imageRef)!
    }

    const parsedRef = this.parseImageReference(imageRef)
    const result: DockerValidationResult = {
      image: imageRef,
      is_valid: false,
      has_digest: !!parsedRef.digest,
      security_score: 0,
      vulnerabilities: [],
      recommendations: [],
      validated_reference: imageRef,
      metadata: {}
    }

    // Basic validation
    await this.performBasicValidation(parsedRef, result)
    
    // Security analysis
    await this.performSecurityAnalysis(parsedRef, result)
    
    // Generate recommendations
    this.generateRecommendations(parsedRef, result)
    
    // Calculate final security score
    result.security_score = this.calculateSecurityScore(result)
    result.is_valid = this.isImageValid(result)

    // Cache result
    this.digestCache.set(imageRef, result)
    
    return result
  }

  /**
   * Validate multiple Docker images from GitLab CI YAML
   */
  async validateImagesInYaml(yamlContent: string): Promise<DockerValidationResult[]> {
    const imageRefs = this.extractImageReferences(yamlContent)
    const results: DockerValidationResult[] = []

    for (const imageRef of imageRefs) {
      try {
        const result = await this.validateDockerImage(imageRef)
        results.push(result)
      } catch (error) {
        results.push({
          image: imageRef,
          is_valid: false,
          has_digest: false,
          security_score: 0,
          vulnerabilities: [{
            severity: 'high',
            type: 'validation_error',
            description: `Failed to validate image: ${error}`,
            fix_available: false
          }],
          recommendations: ['Verify image reference syntax'],
          validated_reference: imageRef,
          metadata: {}
        })
      }
    }

    return results
  }

  /**
   * Generate secure Docker image references with digests
   */
  async generateSecureImageReference(imageRef: string): Promise<string> {
    const parsed = this.parseImageReference(imageRef)
    
    if (parsed.digest) {
      return imageRef // Already has digest
    }

    // For enhanced security, we'd integrate with registry API
    // For now, return recommended format
    const recommendedDigest = await this.fetchImageDigest(parsed)
    
    if (recommendedDigest) {
      return `${parsed.repository}@${recommendedDigest}`
    }

    // Fallback: use specific tag instead of latest
    const secureTag = parsed.tag === 'latest' || !parsed.tag 
      ? this.getRecommendedTag(parsed.repository)
      : parsed.tag

    return `${parsed.repository}:${secureTag}`
  }

  private parseImageReference(imageRef: string): DockerImageReference {
    // Handle digest format: image@sha256:...
    if (imageRef.includes('@sha256:')) {
      const [imagePart, digest] = imageRef.split('@')
      const parsed = this.parseBasicImageRef(imagePart)
      return {
        ...parsed,
        digest,
        full_reference: imageRef
      }
    }

    const parsed = this.parseBasicImageRef(imageRef)
    return {
      ...parsed,
      full_reference: imageRef
    }
  }

  private parseBasicImageRef(imageRef: string): DockerImageReference {
    // Split by registry/namespace/repository:tag
    const parts = imageRef.split('/')
    let registry: string | undefined
    let namespace: string | undefined
    let repositoryWithTag: string

    if (parts.length === 1) {
      // Simple case: nginx:1.20
      repositoryWithTag = parts[0]
    } else if (parts.length === 2) {
      if (parts[0].includes('.') || parts[0].includes(':')) {
        // registry.com/image:tag
        registry = parts[0]
        repositoryWithTag = parts[1]
      } else {
        // namespace/image:tag
        namespace = parts[0]
        repositoryWithTag = parts[1]
      }
    } else {
      // registry.com/namespace/image:tag
      registry = parts[0]
      namespace = parts[1]
      repositoryWithTag = parts.slice(2).join('/')
    }

    // Extract tag
    const [repository, tag] = repositoryWithTag.split(':')

    return {
      registry,
      namespace,
      repository,
      tag: tag || 'latest',
      full_reference: imageRef
    }
  }

  private async performBasicValidation(
    parsedRef: DockerImageReference, 
    result: DockerValidationResult
  ): Promise<void> {
    // Check registry allowlist
    if (parsedRef.registry && !this.securityPolicy.allowed_registries.includes(parsedRef.registry)) {
      result.vulnerabilities.push({
        severity: 'medium',
        type: 'untrusted_registry',
        description: `Registry '${parsedRef.registry}' is not in allowed list`,
        fix_available: true
      })
    }

    // Check blocked tags
    if (parsedRef.tag && this.securityPolicy.blocked_tags.includes(parsedRef.tag)) {
      result.vulnerabilities.push({
        severity: 'high',
        type: 'insecure_tag',
        description: `Tag '${parsedRef.tag}' is not recommended for production`,
        fix_available: true
      })
    }

    // Check digest requirement
    if (this.securityPolicy.require_digest && !parsedRef.digest) {
      result.vulnerabilities.push({
        severity: 'high',
        type: 'missing_digest',
        description: 'Image reference lacks SHA256 digest for integrity verification',
        fix_available: true
      })
    }
  }

  private async performSecurityAnalysis(
    parsedRef: DockerImageReference, 
    result: DockerValidationResult
  ): Promise<void> {
    // Simulate security scanning results
    // In production, this would integrate with vulnerability databases
    const knownVulnerabilities = this.getKnownVulnerabilities(parsedRef)
    result.vulnerabilities.push(...knownVulnerabilities)

    // Add metadata
    result.metadata = {
      last_updated: new Date().toISOString(),
      size: Math.floor(Math.random() * 500) + 50, // MB
      architecture: 'amd64',
      os: 'linux'
    }
  }

  private getKnownVulnerabilities(parsedRef: DockerImageReference): DockerVulnerability[] {
    const vulns: DockerVulnerability[] = []

    // Example vulnerability checks for common base images
    if (parsedRef.repository.includes('ubuntu') && parsedRef.tag === '18.04') {
      vulns.push({
        severity: 'high',
        type: 'outdated_base_image',
        description: 'Ubuntu 18.04 has known security vulnerabilities',
        cve_id: 'CVE-2021-3156',
        fix_available: true
      })
    }

    if (parsedRef.repository.includes('node') && parsedRef.tag?.startsWith('10')) {
      vulns.push({
        severity: 'critical',
        type: 'eol_runtime',
        description: 'Node.js 10 is end-of-life and contains unpatched vulnerabilities',
        fix_available: true
      })
    }

    if (parsedRef.repository.includes('alpine') && parsedRef.tag === 'latest') {
      vulns.push({
        severity: 'medium',
        type: 'unpinned_version',
        description: 'Using latest tag prevents reproducible builds',
        fix_available: true
      })
    }

    return vulns
  }

  private generateRecommendations(
    parsedRef: DockerImageReference, 
    result: DockerValidationResult
  ): void {
    // Generate specific recommendations based on vulnerabilities
    if (!result.has_digest) {
      result.recommendations.push(`Use digest: ${parsedRef.repository}@sha256:...`)
    }

    if (parsedRef.tag === 'latest') {
      result.recommendations.push('Pin to specific version tag instead of latest')
    }

    if (result.vulnerabilities.some(v => v.type === 'outdated_base_image')) {
      result.recommendations.push('Update to latest LTS version of base image')
    }

    if (result.vulnerabilities.some(v => v.severity === 'critical')) {
      result.recommendations.push('URGENT: Address critical vulnerabilities before deployment')
    }

    // Always recommend security scanning
    result.recommendations.push('Run container image security scan in CI pipeline')
  }

  private calculateSecurityScore(result: DockerValidationResult): number {
    let score = 100

    // Deduct points for vulnerabilities
    result.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score -= 25; break
        case 'high': score -= 15; break
        case 'medium': score -= 8; break
        case 'low': score -= 3; break
        case 'info': score -= 1; break
      }
    })

    // Bonus points for good practices
    if (result.has_digest) score += 10
    if (result.image.includes('alpine')) score += 5 // Smaller attack surface

    return Math.max(0, Math.min(100, score))
  }

  private isImageValid(result: DockerValidationResult): boolean {
    const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical').length
    const highVulns = result.vulnerabilities.filter(v => v.severity === 'high').length

    return (
      result.security_score >= this.securityPolicy.minimum_security_score &&
      criticalVulns <= this.securityPolicy.max_vulnerability_count.critical &&
      highVulns <= this.securityPolicy.max_vulnerability_count.high
    )
  }

  private extractImageReferences(yamlContent: string): string[] {
    const imageRefs: string[] = []
    const lines = yamlContent.split('\n')

    for (const line of lines) {
      // Match image: declarations
      const imageMatch = line.match(/^\s*image:\s*(.+)$/)
      if (imageMatch) {
        const image = imageMatch[1].replace(/['"]/g, '').trim()
        if (image && !imageRefs.includes(image)) {
          imageRefs.push(image)
        }
      }

      // Match services with images
      const serviceImageMatch = line.match(/^\s*-\s*name:\s*(.+)|^\s*-\s*(.+:\S+)$/)
      if (serviceImageMatch) {
        const image = (serviceImageMatch[1] || serviceImageMatch[2])?.replace(/['"]/g, '').trim()
        if (image && image.includes(':') && !imageRefs.includes(image)) {
          imageRefs.push(image)
        }
      }
    }

    return imageRefs
  }

  private async fetchImageDigest(parsedRef: DockerImageReference): Promise<string | null> {
    // In production, this would make API calls to container registries
    // For now, return a mock digest for demonstration
    const mockDigests: Record<string, string> = {
      'alpine': 'sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e566cf',
      'nginx': 'sha256:10d1f5b58f74683ad34eb29287e07dab1e90f10af243f151bb50aa5dbb4d62ee',
      'node': 'sha256:b87d0a6618fba1b73a24e6db50a2e13b6a7c52fe7b2e4b8bb7e3d5e7c6b8d9e0'
    }

    for (const [image, digest] of Object.entries(mockDigests)) {
      if (parsedRef.repository.includes(image)) {
        return digest
      }
    }

    return null
  }

  private getRecommendedTag(repository: string): string {
    // Return stable, recommended tags for common images
    const recommendedTags: Record<string, string> = {
      'node': '18-alpine',
      'python': '3.11-alpine',
      'nginx': '1.24-alpine',
      'maven': '3.9-openjdk-11-slim',
      'gradle': '8.4-jdk17-alpine',
      'postgres': '15-alpine',
      'redis': '7-alpine',
      'ubuntu': '22.04',
      'alpine': '3.18'
    }

    for (const [image, tag] of Object.entries(recommendedTags)) {
      if (repository.includes(image)) {
        return tag
      }
    }

    return '1.0.0' // Generic fallback
  }
}

// Export singleton instance with security policy
export const dockerDigestValidator = new DockerDigestValidator({
  require_digest: true,
  minimum_security_score: 80,
  max_vulnerability_count: {
    critical: 0,
    high: 3
  }
})