#!/bin/bash
# P1 CRITICAL: Replaces Jenkins corp-shared-lib notification functions
# Migrated Groovy notification helpers to production-grade Bash

set -euo pipefail

NOTIFICATION_TYPE=${1:-"pipeline"}
STATUS=${2:-"success"}
MESSAGE=${3:-"Pipeline completed"}

echo "📢 Notification Helper - Type: $NOTIFICATION_TYPE, Status: $STATUS"

# Function: Send Slack notification (replaces shared-lib slackNotify())
send_slack_notification() {
    local webhook_url="$SLACK_WEBHOOK_URL"
    local channel="${SLACK_CHANNEL:-#ci-cd}"
    local username="${SLACK_USERNAME:-GitLab CI}"
    
    if [ -z "${webhook_url:-}" ]; then
        echo "⚠️ SLACK_WEBHOOK_URL not configured, skipping Slack notification"
        return 0
    fi
    
    # Determine color and emoji based on status
    local color="good"
    local emoji="✅"
    
    case "$STATUS" in
        "failure"|"failed"|"error")
            color="danger"
            emoji="❌"
            ;;
        "warning"|"unstable")
            color="warning" 
            emoji="⚠️"
            ;;
        "success"|"passed")
            color="good"
            emoji="✅"
            ;;
        "started"|"running")
            color="#439FE0"
            emoji="🚀"
            ;;
    esac
    
    # Build Slack payload
    local payload=$(cat <<EOF
{
    "channel": "$channel",
    "username": "$username",
    "icon_emoji": ":gitlab:",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Pipeline Status",
                    "value": "$emoji $STATUS",
                    "short": true
                },
                {
                    "title": "Project",
                    "value": "${CI_PROJECT_NAME:-jenkins-scanner}",
                    "short": true
                },
                {
                    "title": "Branch",
                    "value": "${CI_COMMIT_REF_NAME:-main}",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "<${CI_PROJECT_URL}/-/commit/${CI_COMMIT_SHA}|${CI_COMMIT_SHA:0:8}>",
                    "short": true
                },
                {
                    "title": "Pipeline",
                    "value": "<${CI_PIPELINE_URL}|#${CI_PIPELINE_ID}>",
                    "short": true
                },
                {
                    "title": "Duration",
                    "value": "${CI_JOB_STARTED_AT:-unknown}",
                    "short": true
                }
            ],
            "footer": "GitLab CI/CD",
            "footer_icon": "https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    # Send notification
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$webhook_url")
    
    if [ $? -eq 0 ]; then
        echo "✅ Slack notification sent successfully"
    else
        echo "❌ Failed to send Slack notification: $response"
    fi
}

# Function: Send email notification (replaces shared-lib emailNotify())
send_email_notification() {
    local recipient="${EMAIL_RECIPIENT:-team@company.com}"
    local subject="[Jenkins Scanner] Pipeline $STATUS - ${CI_COMMIT_REF_NAME:-main}"
    
    # Determine email content based on status
    local email_body=""
    
    case "$STATUS" in
        "failure"|"failed"|"error")
            email_body=$(cat <<EOF
Pipeline FAILED for Jenkins Scanner

Project: ${CI_PROJECT_NAME:-jenkins-scanner}
Branch: ${CI_COMMIT_REF_NAME:-main}
Commit: ${CI_COMMIT_SHA:0:8} - ${CI_COMMIT_MESSAGE:-No message}
Author: ${CI_COMMIT_AUTHOR:-Unknown}

Pipeline URL: ${CI_PIPELINE_URL:-N/A}
Job URL: ${CI_JOB_URL:-N/A}

Please check the pipeline logs for details.

-- 
GitLab CI/CD
EOF
)
            ;;
        "success"|"passed")
            email_body=$(cat <<EOF
Pipeline PASSED for Jenkins Scanner

Project: ${CI_PROJECT_NAME:-jenkins-scanner}
Branch: ${CI_COMMIT_REF_NAME:-main}
Commit: ${CI_COMMIT_SHA:0:8} - ${CI_COMMIT_MESSAGE:-No message}
Author: ${CI_COMMIT_AUTHOR:-Unknown}

Pipeline URL: ${CI_PIPELINE_URL:-N/A}

All tests passed and deployment completed successfully.

-- 
GitLab CI/CD
EOF
)
            ;;
    esac
    
    # Use GitLab's built-in email notification or sendmail if available
    if command -v sendmail >/dev/null 2>&1; then
        echo "To: $recipient" | sendmail "$recipient" <<EOF
Subject: $subject

$email_body
EOF
        echo "✅ Email notification sent to $recipient"
    else
        echo "⚠️ Email notification skipped - configure GitLab email integration"
    fi
}

# Function: Send Teams notification (replaces shared-lib teamsNotify())
send_teams_notification() {
    local webhook_url="$TEAMS_WEBHOOK_URL"
    
    if [ -z "${webhook_url:-}" ]; then
        echo "⚠️ TEAMS_WEBHOOK_URL not configured, skipping Teams notification"
        return 0
    fi
    
    # Determine theme color based on status
    local theme_color="00FF00"
    case "$STATUS" in
        "failure"|"failed"|"error")
            theme_color="FF0000"
            ;;
        "warning"|"unstable")
            theme_color="FFA500"
            ;;
    esac
    
    # Build Teams payload
    local payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "$theme_color",
    "summary": "Pipeline $STATUS",
    "sections": [{
        "activityTitle": "Jenkins Scanner Pipeline",
        "activitySubtitle": "Status: $STATUS",
        "activityImage": "https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png",
        "facts": [{
            "name": "Project",
            "value": "${CI_PROJECT_NAME:-jenkins-scanner}"
        }, {
            "name": "Branch",
            "value": "${CI_COMMIT_REF_NAME:-main}"
        }, {
            "name": "Commit",
            "value": "${CI_COMMIT_SHA:0:8}"
        }, {
            "name": "Pipeline",
            "value": "#${CI_PIPELINE_ID:-unknown}"
        }],
        "markdown": true
    }],
    "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Pipeline",
        "targets": [{
            "os": "default",
            "uri": "${CI_PIPELINE_URL:-#}"
        }]
    }]
}
EOF
)
    
    # Send Teams notification
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$webhook_url")
    
    if [ $? -eq 0 ]; then
        echo "✅ Teams notification sent successfully"
    else
        echo "❌ Failed to send Teams notification: $response"
    fi
}

# Function: Send comprehensive notification (replaces shared-lib notifyAll())
send_comprehensive_notification() {
    echo "📢 Sending comprehensive notifications..."
    
    # Send to all configured channels
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        send_slack_notification
    fi
    
    if [ -n "${EMAIL_RECIPIENT:-}" ]; then
        send_email_notification
    fi
    
    if [ -n "${TEAMS_WEBHOOK_URL:-}" ]; then
        send_teams_notification
    fi
    
    # GitLab built-in notifications
    echo "ℹ️ Configure GitLab integrations at: ${CI_PROJECT_URL:-}/-/settings/integrations"
    
    echo "✅ All notifications sent"
}

# Main execution logic
main() {
    echo "🚀 Starting notification process..."
    
    case "$NOTIFICATION_TYPE" in
        "slack")
            send_slack_notification
            ;;
        "email")
            send_email_notification
            ;;
        "teams")
            send_teams_notification
            ;;
        "all"|"comprehensive")
            send_comprehensive_notification
            ;;
        "pipeline")
            # Default pipeline notification
            if [ "$STATUS" = "failure" ] || [ "$STATUS" = "success" ]; then
                send_comprehensive_notification
            fi
            ;;
        *)
            echo "❌ Unknown notification type: $NOTIFICATION_TYPE"
            echo "Available types: slack, email, teams, all, pipeline"
            exit 1
            ;;
    esac
    
    echo "🎉 Notification process completed!"
}

# Execute main function with all arguments
main "$@"