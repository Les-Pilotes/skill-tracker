#!/bin/bash
# Usage: ./agents/unblock.sh <issue_number>
# Triggers the Dev Agent on a specific issue.
# Called by JARVIS manually or via RemoteTrigger.

ISSUE=$1

if [ -z "$ISSUE" ]; then
  echo "Usage: ./agents/unblock.sh <issue_number>"
  echo "Triggers the Dev Agent to work on the specified GitHub issue."
  exit 1
fi

REPO="Les-Pilotes/skill-tracker"

# Verify the issue exists and is open
echo "Checking issue #$ISSUE..."
STATE=$(gh issue view "$ISSUE" --repo "$REPO" --json state --jq '.state')

if [ "$STATE" != "OPEN" ]; then
  echo "Error: Issue #$ISSUE is not open (state: $STATE)"
  exit 1
fi

# Check current labels
LABELS=$(gh issue view "$ISSUE" --repo "$REPO" --json labels --jq '[.labels[].name] | join(", ")')
echo "Current labels: $LABELS"

# Move to agent:dev if it's in backlog or blocked
echo "Assigning issue #$ISSUE to Dev Agent..."
gh issue edit "$ISSUE" --repo "$REPO" --remove-label "agent:backlog" --remove-label "agent:blocked" --add-label "agent:dev" 2>/dev/null

gh issue comment "$ISSUE" --repo "$REPO" --body "Unblock triggered manually. Dev Agent assigned — starting implementation."

echo ""
echo "Triggering Dev Agent on issue #$ISSUE..."
echo "JARVIS should now invoke the Dev Agent with issue_number=$ISSUE"
echo "Prompt file: agents/dev-agent.md"
