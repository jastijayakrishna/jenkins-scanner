// Test what the tests expect

// For matrix builds, the test expects:
const expectedMatrix = `
parallel:
  matrix:
    - LANG:
        - "java17"
        - "java21"
      DB:
        - "mysql"
        - "postgres"
`;

// For scripted pipeline:
const expectedScripted = `
# ⚠️  IMPORTANT: This pipeline was converted from a SCRIPTED PIPELINE.
# Scripted pipelines often contain complex Groovy logic that may need manual adjustment.
`;

// The test looks for these specific strings:
const testExpectations = [
  'parallel:',
  'matrix:',
  'LANG:',
  '- "java17"',
  '- "java21"',
  'DB:',
  '- "mysql"',
  '- "postgres"',
  'SCRIPTED PIPELINE',
  'complex Groovy logic',
  'ENVIRONMENT: "dev"',  // for choice parameter with default
  'Build Java',
  'Build Frontend'
];

console.log('Test expectations:', testExpectations);
