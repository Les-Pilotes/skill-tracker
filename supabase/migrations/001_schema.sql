-- Pilotes Academy — Skill Tracker
-- Initial schema migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE people (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  start_date  DATE,
  color       TEXT NOT NULL DEFAULT '#BA7517',
  email       TEXT UNIQUE,
  initials    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role      TEXT NOT NULL CHECK (role IN ('manager', 'stagiaire')),
  person_id UUID REFERENCES people(id) ON DELETE SET NULL
);

CREATE TABLE skills (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id  UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id       UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  general_comment TEXT
);

CREATE TABLE evaluation_scores (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE NOT NULL,
  skill_id      UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  score         INTEGER CHECK (score >= 1 AND score <= 5) NOT NULL,
  comment       TEXT
);

-- ─────────────────────────────────────────────
-- HELPER FUNCTION: is_manager
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION my_person_id()
RETURNS UUID AS $$
  SELECT person_id FROM profiles
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE people           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;

-- profiles: each user sees only their own profile
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (id = auth.uid());

-- people: managers see all; stagiaires see only their own record
CREATE POLICY "people_manager_all"    ON people FOR ALL    USING (is_manager());
CREATE POLICY "people_stagiaire_read" ON people FOR SELECT USING (id = my_person_id());

-- skills
CREATE POLICY "skills_manager_all"    ON skills FOR ALL    USING (is_manager());
CREATE POLICY "skills_stagiaire_read" ON skills FOR SELECT USING (person_id = my_person_id());

-- evaluations
CREATE POLICY "eval_manager_all"      ON evaluations FOR ALL    USING (is_manager());
CREATE POLICY "eval_stagiaire_read"   ON evaluations FOR SELECT USING (person_id = my_person_id());

-- evaluation_scores (join through evaluations)
CREATE POLICY "scores_manager_all"    ON evaluation_scores FOR ALL USING (is_manager());
CREATE POLICY "scores_stagiaire_read" ON evaluation_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_id AND e.person_id = my_person_id()
    )
  );

-- ─────────────────────────────────────────────
-- SEED: default manager accounts
-- (run after creating auth users via Supabase dashboard or CLI)
-- INSERT INTO profiles (id, role) VALUES ('<user-uuid>', 'manager');
-- ─────────────────────────────────────────────
