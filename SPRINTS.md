# Sprint History — Pilotes Academy Skill Tracker

## Sprint 1 — 2026-04-17

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

### Sprint 2 backlog
- Network error handling in all HTML pages (try/catch + user-friendly messages)
- Resend retry logic with exponential backoff on rate limit (429)
- Audit trail for emails (unify `send_bilan.py` and Edge Function paths)
- JWT session refresh logic
- Auto-deploy on merge to main
- E2E test suite (at least login + evaluation flow)
