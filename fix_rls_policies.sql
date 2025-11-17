-- ============================================================
-- FIX RLS POLICIES FOR EXAMBOT
-- ============================================================
-- This script creates RLS policies to allow anonymous users
-- to read data from the questions and related tables
-- ============================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subtopics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous read access to questions" ON questions;
DROP POLICY IF EXISTS "Allow anonymous read access to exam_categories" ON exam_categories;
DROP POLICY IF EXISTS "Allow anonymous read access to topics" ON topics;
DROP POLICY IF EXISTS "Allow anonymous read access to subtopics" ON subtopics;

-- ============================================================
-- CREATE READ-ONLY POLICIES FOR ANONYMOUS USERS
-- ============================================================

-- Questions table: Allow all users to read questions
CREATE POLICY "Allow anonymous read access to questions"
ON questions
FOR SELECT
TO anon, authenticated
USING (true);

-- Exam Categories table: Allow all users to read exam categories
CREATE POLICY "Allow anonymous read access to exam_categories"
ON exam_categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Topics table: Allow all users to read topics
CREATE POLICY "Allow anonymous read access to topics"
ON topics
FOR SELECT
TO anon, authenticated
USING (true);

-- Subtopics table: Allow all users to read subtopics
CREATE POLICY "Allow anonymous read access to subtopics"
ON subtopics
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================================
-- VERIFY POLICIES
-- ============================================================

-- Show all policies
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('questions', 'exam_categories', 'topics', 'subtopics')
ORDER BY tablename, policyname;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

SELECT 'RLS policies created successfully! Anonymous users can now read ExamBot data.' AS status;
