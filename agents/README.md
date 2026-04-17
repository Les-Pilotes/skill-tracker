# Autonomous Dev Pipeline — Pilotes Academy Skill Tracker

## Overview

This directory contains the agent prompts and scripts that power the autonomous development pipeline. JARVIS (Claude Code on VPS) reads these files and follows them when triggered.

## Architecture

```
Backlog (GitHub Issues)
    |
    v
Sprint Manager  ──>  selects issues, assigns to Dev Agent
    |
    v
Dev Agent       ──>  implements fix/feature, opens PR
    |
    v
QA Agent        ──>  reviews PR, approves or blocks
    |
    v
Deploy Agent    ──>  merges PR, deploys to VPS
```

## GitHub Labels (Kanban)

| Label | Color | Meaning |
|-------|-------|---------|
| `agent:backlog` | grey | Issue identified, not yet started |
| `agent:dev` | blue | Dev Agent is working on it |
| `agent:review` | yellow | PR opened, QA Agent reviewing |
| `agent:done` | green | Merged and deployed |
| `agent:blocked` | red | Blocked — needs manual intervention |
| `priority:critical` | dark red | Security or data-loss risk |
| `priority:major` | orange | Important for stability/UX |
| `priority:minor` | light grey | Nice to have |

## Files

| File | Purpose |
|------|---------|
| `sprint-manager.md` | Prompt for Sprint Manager Agent |
| `dev-agent.md` | Prompt for Dev Agent |
| `qa-agent.md` | Prompt for QA Agent |
| `deploy-agent.md` | Prompt for Deploy Agent |
| `unblock.sh` | Quick trigger script for Dev Agent on a specific issue |
| `health-check.sh` | Pipeline health check + Discord reporting |

## Triggering

- **Sprint Manager**: Runs weekly (Monday 9h) via GitHub Actions cron, or manually via JARVIS
- **Dev Agent**: Triggered by Sprint Manager assigning an issue, or manually via `./agents/unblock.sh <issue_number>`
- **QA Agent**: Triggered automatically when Dev Agent opens a PR
- **Deploy Agent**: Triggered when QA Agent approves a PR

## Philosophy

No blind automation. The pipeline activates when a problem is **known and tracked** — via CI failure, monitoring alert, or Amadou saying "unblock #X". Every action is traced through GitHub Issues and PRs.
