-- 002_email_tracking.sql
-- Sprint 1: Add email tracking + fix cascade constraint
-- Date: 2026-04-17

-- ─────────────────────────────────────────────
-- 1. Add email_sent_at to evaluations
-- ─────────────────────────────────────────────
ALTER TABLE evaluations
  ADD COLUMN email_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN evaluations.email_sent_at IS
  'Timestamp when the bilan email was sent. NULL = not sent yet. Prevents double-sends.';

-- ─────────────────────────────────────────────
-- 2. Change profiles.person_id FK from SET NULL to RESTRICT
--    Prevents deleting a person while a profile still references it
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT profiles_person_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_person_id_fkey
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE RESTRICT;
