#!/bin/bash
# Maven SonarQube helper script
set -euo pipefail

echo "🔍 Running SonarQube analysis..."

mvn -B verify sonar:sonar -Dsonar.login=$SONAR_TOKEN_MASKED

echo "✅ SonarQube analysis completed"