// Debug script to test AI service fallback
const { EnterpriseAIService } = require('./lib/ai-service.ts');

// Clear API key
delete process.env.ANTHROPIC_API_KEY;

// Test fallback analysis
const result = EnterpriseAIService.analyzePlugin(
  'unknown-plugin',
  'some usage context',
  {
    projectType: 'unknown',
    detectedFeatures: [],
    complexityLevel: 'simple'
  }
);

console.log('Result:', result);
console.log('Compatibility status:', result.compatibility_status);
console.log('Migration notes:', result.migration_notes);
console.log('Confidence:', result.confidence); 