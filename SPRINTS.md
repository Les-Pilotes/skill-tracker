# Sprint History — Pilotes Academy Skill Tracker

## Sprint 1 — 2026-04-17 (COMPLETE)

**Goal:** Fix critical security and stability issues, set up CI/CD and project structure.

### Done
- [x] Removed hardcoded DB password from `send_bilan.py` — now loaded from env vars
- [x] Fixed Edge Function env var name: `SERVICE_ROLE_KEY` -> `SUPABASE_SERVICE_ROLE_KEY`
- [x] Added startup validation for all required env vars in Edge Functions
- [x] Added guard in `auth.js` for stagiaires without `person_id` (prevents crash on `person.html?id=null`)
- [x] Created migration `002_email_tracking.sql`:
  - Added `email_sent_at` column to `evaluations` for double-send prevention
  - Changed `profiles.person_id` FK from `ON DELETE SET NULL` to `ON DELETE RESTRICT`
- [x] Added `email_sent_at` guard in `send-evaluation` Edge Function (returns 409 if already sent)
- [x] Created `docs/nginx.conf` — production nginx config with HTTPS, proxy, security headers
- [x] Created GitHub Actions CI workflow: secret scanning, env var validation, SQL checks
- [x] Updated `.env.example` with all required variables

### Blockers
- None

### Decisions
- Use `ON DELETE RESTRICT` instead of `SET NULL` for `profiles.person_id` — better to fail explicitly than leave orphaned profiles
- Email double-send prevention via `email_sent_at` timestamp rather than a boolean flag — provides audit trail
- CI runs on every push/PR to main — no auto-deploy yet (manual deployment)

### Metrics
- 5 critical bugs fixed
- 1 CI pipeline created
- 6 commits

---

## Sprint 2 — Started 2026-04-17

**Goal:** Set up autonomous dev pipeline and address stability/security backlog.

### Infrastructure
- [x] Created autonomous agent pipeline (`agents/` directory)
  - Sprint Manager, Dev Agent, QA Agent, Deploy Agent
  - `unblock.sh` for manual triggering
  - `health-check.sh` for pipeline monitoring
- [x] GitHub Issues as Kanban board (labels: `agent:backlog`, `agent:dev`, `agent:review`, `agent:done`, `agent:blocked`)
- [x] Enhanced CI: PR quality check with comment, HTML lint, deploy job (SSH placeholder)
- [x] Weekly Sprint Manager cron workflow

### Backlog (GitHub Issues)
- [ ] #7 — Rotation mot de passe Supabase DB (priority:critical)
- [ ] #1 — Gestion d'erreurs réseau dans toutes les pages HTML (priority:major)
- [ ] #2 — Retry Resend avec exponential backoff sur rate limit 429 (priority:major)
- [ ] #3 — Unifier les deux chemins d'envoi email (priority:major)
- [ ] #4 — Refresh JWT automatique avant expiration session (priority:major)
- [ ] #5 — Auto-deploy sur merge to main (priority:major)
- [ ] #6 — Tests E2E login + création évaluation (priority:major)
- [ ] #8 — Créer repo project-launcher sur GitHub (priority:minor)

### Decisions
- Agent pipeline uses GitHub Issues + labels as kanban — no external tool needed
- Agents are prompt files read by JARVIS (Claude Code), not standalone services
- Deploy via SSH from GitHub Actions (requires secrets configuration)
- Weekly sprint trigger via GitHub Actions cron + JARVIS webhook
