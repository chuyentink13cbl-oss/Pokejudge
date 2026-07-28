/*
# PokéJudge — Core Schema

## Overview
Creates the full schema for PokéJudge, a Pokémon-themed online judge.
Users sign in (Supabase Auth), solve programming problems, submit code that is
judged (currently by a mock judge edge function, swappable for Judge0 later),
earn Gym badges, climb Trainer Ranks, and appear on the League leaderboard.

## New Tables
1. `profiles` — extends auth.users with a public trainer profile.
2. `problems` — programming problems with difficulty mapped to Pokémon types.
3. `test_cases` — hidden + sample test cases (hidden never exposed to client).
4. `submissions` — user code submissions and verdicts.
5. `user_badges` — Gym badges unlocked by a user.

## Security (RLS)
- profiles: all authenticated can read (leaderboard); users update own row.
- problems: published readable by anon+authenticated; admins see/manage all.
- test_cases: ONLY sample cases readable by client; hidden via service role only.
- submissions: users read/insert own; admins read all; updates via service role.
- user_badges: users read own; admins read all; writes via service role.

## Important Notes
1. Owner columns default to auth.uid() so client inserts without user_id work.
2. Hidden test_cases are never returned to the anon key.
3. A trigger auto-creates a profile row on signup.
*/

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  trainer_rank text NOT NULL DEFAULT 'Trainer Mới',
  total_points int NOT NULL DEFAULT 0,
  solved_count int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_solve_date date,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ===== problems =====
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_md text NOT NULL,
  statement text,
  difficulty_type text NOT NULL DEFAULT 'normal',
  time_limit_ms int NOT NULL DEFAULT 1000,
  memory_limit_kb int NOT NULL DEFAULT 262144,
  points int NOT NULL DEFAULT 100,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_published_problems" ON problems;
CREATE POLICY "select_published_problems" ON problems FOR SELECT
  TO anon, authenticated USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_insert_problems" ON problems;
CREATE POLICY "admin_insert_problems" ON problems FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_update_problems" ON problems;
CREATE POLICY "admin_update_problems" ON problems FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_delete_problems" ON problems;
CREATE POLICY "admin_delete_problems" ON problems FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- ===== test_cases =====
CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input text NOT NULL,
  expected_output text NOT NULL,
  is_sample boolean NOT NULL DEFAULT false
);

ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_sample_test_cases" ON test_cases;
CREATE POLICY "select_sample_test_cases" ON test_cases FOR SELECT
  TO anon, authenticated USING (is_sample = true OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_insert_test_cases" ON test_cases;
CREATE POLICY "admin_insert_test_cases" ON test_cases FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_update_test_cases" ON test_cases;
CREATE POLICY "admin_update_test_cases" ON test_cases FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "admin_delete_test_cases" ON test_cases;
CREATE POLICY "admin_delete_test_cases" ON test_cases FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- ===== submissions =====
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language_id int NOT NULL,
  language_name text NOT NULL,
  source_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  exec_time_ms numeric,
  exec_memory_kb numeric,
  judge0_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_submissions" ON submissions;
CREATE POLICY "select_own_submissions" ON submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "insert_own_submissions" ON submissions;
CREATE POLICY "insert_own_submissions" ON submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_submissions" ON submissions;
CREATE POLICY "update_own_submissions" ON submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== user_badges =====
CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_code)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_badges" ON user_badges;
CREATE POLICY "select_own_badges" ON user_badges FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "insert_own_badges" ON user_badges;
CREATE POLICY "insert_own_badges" ON user_badges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== indexes =====
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty_type);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(total_points DESC);

-- ===== trigger: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username',
             'trainer_' || substr(NEW.id::text, 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();