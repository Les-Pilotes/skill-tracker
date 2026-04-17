# Lessons Learned — Pilotes Academy Skill Tracker

## Sprint 1 — 2026-04-17

### What went wrong

1. **Hardcoded DB password in source code** — `send_bilan.py` had the Supabase DB password in plaintext. This was in git history. Anyone with repo access had full DB access.
   - **Action:** Rotated the password. All secrets now come from env vars with explicit validation.

2. **Env var name mismatch killed Edge Functions silently** — The code used `SERVICE_ROLE_KEY` but Supabase secrets had `SUPABASE_SERVICE_ROLE_KEY`. The non-null assertion (`!`) masked the `undefined` value, causing auth failures at runtime with no clear error.
   - **Action:** Fixed the name. Added startup-time validation that throws immediately if env vars are missing.

3. **No guard for null person_id** — A stagiaire account without a linked `person_id` would redirect to `person.html?id=null`, which crashes the page.
   - **Action:** Added explicit guard in `requireAuth()` — stagiaires without `person_id` are signed out with an error.

4. **ON DELETE SET NULL creates zombie profiles** — Deleting a person from `people` would null out `profiles.person_id`, leaving a stagiaire account that can log in but can't do anything useful.
   - **Action:** Changed to `ON DELETE RESTRICT`. You must clean up profiles before deleting a person.

5. **Two email paths, no dedup** — Both `send_bilan.py` (Gmail) and the `send-evaluation` Edge Function (Resend) can send the same bilan. No tracking of whether it was already sent.
   - **Action:** Added `email_sent_at` column. Edge Function now checks it before sending and updates it after.

### What went well

1. **Supabase RLS was correctly set up from day one** — Row-level security policies were solid. Stagiaires can only see their own data.
2. **Clean separation between Edge Functions and Python endpoint** — Each has a clear purpose (Resend vs Gmail).
3. **Simple stack** — Vanilla HTML/CSS/JS means no build step, no framework churn. Fast to iterate.

### Rules going forward

- **Never hardcode secrets.** Use env vars. Validate them at startup.
- **Name env vars exactly as documented.** One source of truth: `.env.example`.
- **Guard every user-facing redirect.** If a value could be null, handle it before redirecting.
- **Prefer RESTRICT over SET NULL** for FKs where orphaned data is dangerous.
- **Track side effects.** If an action sends an email, record when it happened.
