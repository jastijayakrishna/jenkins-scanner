// Debug test to see which pattern matches "my-secret-key!@#"

const patterns = [
  {
    name: 'username/password',
    pattern: /.*(?:user|username|usr|login|account).*(?:pass|password|pwd).*/i,
    hasAdditionalVars: true
  },
  {
    name: 'docker registry',
    pattern: /.*\b(?:docker|registry|repo|harbor|ecr|gcr)\b.*/i,
    hasAdditionalVars: true
  },
  {
    name: 'api tokens and keys',
    pattern: /.*(?:token|key|api|secret|auth).*/i,
    hasAdditionalVars: false
  },
  {
    name: 'file credentials',
    pattern: /.*(?:cert|certificate|pem|p12|pfx|jks|keystore|config|kubeconfig|ssh|rsa|key).*file.*/i,
    hasAdditionalVars: false
  },
  {
    name: 'ssh credentials',
    pattern: /.*(?:ssh|rsa|private.*key|pub.*key).*/i,
    hasAdditionalVars: false
  },
  {
    name: 'database credentials',
    pattern: /.*(?:db|database|mysql|postgres|oracle|sql|mongo).*/i,
    hasAdditionalVars: true
  }
]

const testId = 'my-secret-key!@#'
console.log(`Testing credential ID: "${testId}"`)
console.log(`Lowercase: "${testId.toLowerCase()}"`)

for (const mapping of patterns) {
  const matches = mapping.pattern.test(testId.toLowerCase())
  console.log(`${mapping.name}: ${matches ? 'MATCHES' : 'no match'} (has additionalVars: ${mapping.hasAdditionalVars})`)
  if (matches) {
    console.log(`  Pattern: ${mapping.pattern}`)
    
    // For docker registry, let's check each part
    if (mapping.name === 'docker registry') {
      const words = ['docker', 'registry', 'repo', 'harbor', 'ecr', 'gcr']
      const found = words.filter(word => testId.toLowerCase().includes(word))
      console.log(`  Found docker words: ${found.join(', ') || 'none'}`)
    }
  }
}