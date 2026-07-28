/*
# Add PDF + detailed results columns

## Overview
Adds support for problem statements as PDF files and detailed per-test-case
grading results on submissions.

## Modified Tables
1. `problems` — add `pdf_url` (text, nullable): public URL to a PDF statement
   uploaded to Supabase Storage. When present, the problem detail page renders
   the PDF in an embedded viewer instead of (or alongside) the markdown.
2. `submissions` — add `results_json` (jsonb, nullable): detailed per-test-case
   grading breakdown. Structure:
   [{ "index": 1, "status": "accepted", "time_ms": 12, "memory_kb": 8400,
      "expected": "...", "actual": "...", "message": "..." }, ...]
   This lets the UI show exactly which test cases passed/failed and why.

## Security
No policy changes — existing RLS still applies. The new columns inherit the
same access rules. `results_json` is visible only to the submission owner
(select_own_submissions) and admins, same as the rest of the row.

## Important Notes
1. Both columns are nullable so existing rows and the mock judge keep working.
2. The edge function writes `results_json` with the service role (bypasses RLS).
*/

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS pdf_url text;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS results_json jsonb;