-- Supabase Helper Functions for ExamBot
-- Run these functions in your Supabase SQL editor

-- Function to get exam ID by code
CREATE OR REPLACE FUNCTION get_exam_id_by_code(exam_code TEXT)
RETURNS UUID AS $$
  SELECT id FROM exams WHERE code = exam_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(question_id UUID)
RETURNS VOID AS $$
  UPDATE questions SET view_count = view_count + 1 WHERE id = question_id;
$$ LANGUAGE SQL VOLATILE;

-- Function to update question statistics when answered
CREATE OR REPLACE FUNCTION update_question_stats(question_id UUID, is_correct BOOLEAN)
RETURNS VOID AS $$
  UPDATE questions
  SET
    attempt_count = attempt_count + 1,
    correct_count = correct_count + CASE WHEN is_correct THEN 1 ELSE 0 END
  WHERE id = question_id;
$$ LANGUAGE SQL VOLATILE;

-- Function to get question count with filters
CREATE OR REPLACE FUNCTION get_question_count(
  p_exam_id UUID DEFAULT NULL,
  p_subject_id UUID DEFAULT NULL,
  p_chapter_id UUID DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO result
  FROM questions
  WHERE active = true
    AND (p_exam_id IS NULL OR exam_id = p_exam_id)
    AND (p_subject_id IS NULL OR subject_id = p_subject_id)
    AND (p_chapter_id IS NULL OR chapter_id = p_chapter_id)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty)
    AND (p_year IS NULL OR year = p_year);

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get random questions for practice/test
CREATE OR REPLACE FUNCTION get_random_questions(
  p_exam_id UUID,
  p_subject_id UUID DEFAULT NULL,
  p_chapter_id UUID DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_count INTEGER DEFAULT 10
)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM questions
  WHERE active = true
    AND exam_id = p_exam_id
    AND (p_subject_id IS NULL OR subject_id = p_subject_id)
    AND (p_chapter_id IS NULL OR chapter_id = p_chapter_id)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty)
  ORDER BY RANDOM()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to get user performance summary
CREATE OR REPLACE FUNCTION get_user_performance_summary(p_user_id UUID)
RETURNS TABLE (
  exam_name TEXT,
  subject_name TEXT,
  total_attempted INTEGER,
  total_correct INTEGER,
  total_incorrect INTEGER,
  accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.name as exam_name,
    s.name as subject_name,
    COUNT(*)::INTEGER as total_attempted,
    SUM(CASE WHEN uqp.last_correct THEN 1 ELSE 0 END)::INTEGER as total_correct,
    SUM(CASE WHEN NOT uqp.last_correct THEN 1 ELSE 0 END)::INTEGER as total_incorrect,
    ROUND(
      CASE
        WHEN COUNT(*) > 0
        THEN (SUM(CASE WHEN uqp.last_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
        ELSE 0
      END,
      2
    ) as accuracy
  FROM user_question_progress uqp
  JOIN questions q ON uqp.question_id = q.id
  JOIN exams e ON q.exam_id = e.id
  JOIN subjects s ON q.subject_id = s.id
  WHERE uqp.user_id = p_user_id
    AND uqp.attempted = true
  GROUP BY e.name, s.name
  ORDER BY e.name, s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get weak topics for a user
CREATE OR REPLACE FUNCTION get_weak_topics(
  p_user_id UUID,
  p_exam_id UUID DEFAULT NULL,
  p_min_attempts INTEGER DEFAULT 3,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  exam_name TEXT,
  subject_name TEXT,
  chapter_name TEXT,
  total_attempts INTEGER,
  correct_attempts INTEGER,
  accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.name as exam_name,
    s.name as subject_name,
    c.name as chapter_name,
    COUNT(*)::INTEGER as total_attempts,
    SUM(uqp.correct_count)::INTEGER as correct_attempts,
    ROUND(
      CASE
        WHEN SUM(uqp.attempt_count) > 0
        THEN (SUM(uqp.correct_count)::NUMERIC / SUM(uqp.attempt_count)::NUMERIC) * 100
        ELSE 0
      END,
      2
    ) as accuracy
  FROM user_question_progress uqp
  JOIN questions q ON uqp.question_id = q.id
  JOIN exams e ON q.exam_id = e.id
  JOIN subjects s ON q.subject_id = s.id
  LEFT JOIN chapters c ON q.chapter_id = c.id
  WHERE uqp.user_id = p_user_id
    AND uqp.attempted = true
    AND (p_exam_id IS NULL OR q.exam_id = p_exam_id)
  GROUP BY e.name, s.name, c.name
  HAVING COUNT(*) >= p_min_attempts
  ORDER BY accuracy ASC, total_attempts DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get test performance over time
CREATE OR REPLACE FUNCTION get_test_performance_timeline(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  test_date DATE,
  session_type TEXT,
  exam_name TEXT,
  total_questions INTEGER,
  score NUMERIC,
  accuracy NUMERIC,
  time_spent_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.started_at::DATE as test_date,
    ts.session_type,
    e.name as exam_name,
    ts.total_questions,
    ts.score,
    ROUND(
      CASE
        WHEN ts.total_questions > 0
        THEN (ts.correct_answers::NUMERIC / ts.total_questions::NUMERIC) * 100
        ELSE 0
      END,
      2
    ) as accuracy,
    ROUND(ts.time_spent_seconds / 60.0)::INTEGER as time_spent_minutes
  FROM test_sessions ts
  LEFT JOIN exams e ON ts.exam_id = e.id
  WHERE ts.user_id = p_user_id
    AND ts.status = 'completed'
  ORDER BY ts.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate adaptive difficulty
-- Recommends difficulty level based on user's recent performance
CREATE OR REPLACE FUNCTION get_recommended_difficulty(
  p_user_id UUID,
  p_exam_id UUID,
  p_subject_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  avg_accuracy NUMERIC;
  recommended_difficulty TEXT;
BEGIN
  -- Calculate average accuracy for recent attempts
  SELECT
    ROUND(
      CASE
        WHEN SUM(uqp.attempt_count) > 0
        THEN (SUM(uqp.correct_count)::NUMERIC / SUM(uqp.attempt_count)::NUMERIC) * 100
        ELSE 0
      END,
      2
    )
  INTO avg_accuracy
  FROM user_question_progress uqp
  JOIN questions q ON uqp.question_id = q.id
  WHERE uqp.user_id = p_user_id
    AND q.exam_id = p_exam_id
    AND (p_subject_id IS NULL OR q.subject_id = p_subject_id)
    AND uqp.attempted = true
    AND uqp.last_attempted_at > NOW() - INTERVAL '30 days'; -- Last 30 days

  -- Recommend difficulty based on accuracy
  IF avg_accuracy IS NULL OR avg_accuracy < 40 THEN
    recommended_difficulty := 'easy';
  ELSIF avg_accuracy < 70 THEN
    recommended_difficulty := 'medium';
  ELSE
    recommended_difficulty := 'hard';
  END IF;

  RETURN recommended_difficulty;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to automatically update attempt statistics
CREATE OR REPLACE FUNCTION update_user_progress_on_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- Update question view statistics
  UPDATE questions
  SET
    attempt_count = attempt_count + 1,
    correct_count = correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
  WHERE id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for test session answers
DROP TRIGGER IF EXISTS update_stats_on_test_answer ON test_session_answers;
CREATE TRIGGER update_stats_on_test_answer
  AFTER INSERT OR UPDATE ON test_session_answers
  FOR EACH ROW
  WHEN (NEW.is_correct IS NOT NULL)
  EXECUTE FUNCTION update_user_progress_on_answer();

COMMENT ON FUNCTION get_exam_id_by_code IS 'Helper function to get exam UUID from code string';
COMMENT ON FUNCTION increment_view_count IS 'Increment the view count when a question is viewed';
COMMENT ON FUNCTION update_question_stats IS 'Update question statistics when answered';
COMMENT ON FUNCTION get_question_count IS 'Get count of questions matching filters';
COMMENT ON FUNCTION get_random_questions IS 'Fetch random questions for practice/test sessions';
COMMENT ON FUNCTION get_user_performance_summary IS 'Get user performance breakdown by exam and subject';
COMMENT ON FUNCTION get_weak_topics IS 'Identify topics where user needs improvement';
COMMENT ON FUNCTION get_test_performance_timeline IS 'Get user test performance over time';
COMMENT ON FUNCTION get_recommended_difficulty IS 'Recommend difficulty level based on recent performance';
