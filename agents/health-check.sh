#!/bin/bash
# Pipeline health check for Pilotes Academy Skill Tracker
# Checks GitHub Actions status, blocked issues, and overall pipeline health.
# Called by JARVIS on demand or after a CI failure.

REPO="Les-Pilotes/skill-tracker"
REPORT=""

echo "=== Pipeline Health Check ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

# 1. Check latest GitHub Actions runs
echo "--- GitHub Actions (last 5 runs) ---"
RUNS=$(gh run list --repo "$REPO" --limit 5 --json status,conclusion,name,createdAt,url \
  --jq '.[] | "\(.conclusion // .status)\t\(.name)\t\(.createdAt)"')

if [ -z "$RUNS" ]; then
  echo "No workflow runs found."
else
  echo "$RUNS"
fi

FAILED=$(gh run list --repo "$REPO" --limit 5 --json conclusion --jq '[.[] | select(.conclusion == "failure")] | length')
if [ "$FAILED" -gt 0 ]; then
  REPORT="$REPORT\n- $FAILED failed CI runs in last 5"
fi
echo ""

# 2. Check blocked issues
echo "--- Blocked Issues ---"
BLOCKED=$(gh issue list --repo "$REPO" --label "agent:blocked" --state open --json number,title \
  --jq '.[] | "#\(.number) — \(.title)"')

if [ -z "$BLOCKED" ]; then
  echo "No blocked issues."
else
  echo "$BLOCKED"
  BLOCKED_COUNT=$(gh issue list --repo "$REPO" --label "agent:blocked" --state open --json number --jq 'length')
  REPORT="$REPORT\n- $BLOCKED_COUNT blocked issues need attention"
fi
echo ""

# 3. Check issues in progress (agent:dev)
echo "--- In Progress (Dev Agent) ---"
IN_DEV=$(gh issue list --repo "$REPO" --label "agent:dev" --state open --json number,title \
  --jq '.[] | "#\(.number) — \(.title)"')

if [ -z "$IN_DEV" ]; then
  echo "No issues in dev."
else
  echo "$IN_DEV"
fi
echo ""

# 4. Check issues in review (agent:review)
echo "--- In Review (QA Agent) ---"
IN_REVIEW=$(gh issue list --repo "$REPO" --label "agent:review" --state open --json number,title \
  --jq '.[] | "#\(.number) — \(.title)"')

if [ -z "$IN_REVIEW" ]; then
  echo "No issues in review."
else
  echo "$IN_REVIEW"
fi
echo ""

# 5. Check backlog size
BACKLOG_COUNT=$(gh issue list --repo "$REPO" --label "agent:backlog" --state open --json number --jq 'length')
echo "--- Backlog: $BACKLOG_COUNT issues ---"
echo ""

# 6. Check open PRs
echo "--- Open PRs ---"
OPEN_PRS=$(gh pr list --repo "$REPO" --state open --json number,title,reviewDecision \
  --jq '.[] | "#\(.number) — \(.title) [\(.reviewDecision // "no review")]"')

if [ -z "$OPEN_PRS" ]; then
  echo "No open PRs."
else
  echo "$OPEN_PRS"
fi
echo ""

# 7. Summary
echo "=== Summary ==="
if [ -z "$REPORT" ]; then
  echo "Pipeline healthy. No issues detected."
else
  echo "Issues detected:"
  echo -e "$REPORT"
  echo ""
  echo "Action required — flag to Amadou via Discord."
fi
