-- ExamBot Question Bank Database Schema
-- This schema supports the database-driven ExamBot UI with hierarchical organization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exams table (UPSC, SSC, Banking, etc.)
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table (History, Geography, Mathematics, etc.)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, code)
);

-- Chapters table (Ancient India, Physical Geography, etc.)
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject_id, code)
);

-- Topics table (optional sub-chapter level)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, code)
);

-- Questions table (main question bank)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,

  question TEXT NOT NULL,
  options JSONB NOT NULL, -- {"A": "option1", "B": "option2", "C": "option3", "D": "option4"}
  correct_answer VARCHAR(10) NOT NULL, -- "A", "B", "C", or "D"
  explanation TEXT,

  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  year INTEGER, -- for previous year questions (2015-2024)
  marks DECIMAL(5,2) DEFAULT 1.0,
  negative_marks DECIMAL(5,2) DEFAULT 0.0,
  time_seconds INTEGER DEFAULT 60, -- suggested time per question

  question_type VARCHAR(50) DEFAULT 'mcq', -- 'mcq', 'multi-select', 'true-false', 'numerical'
  tags TEXT[], -- additional tags for better filtering

  verified BOOLEAN DEFAULT false,
  verified_by UUID, -- reference to admin/moderator
  verified_at TIMESTAMP WITH TIME ZONE,

  active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID -- reference to user who created the question
);

-- User question progress tracking
CREATE TABLE user_question_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- reference to auth.users
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  bookmarked BOOLEAN DEFAULT false,
  bookmarked_at TIMESTAMP WITH TIME ZONE,

  attempted BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,

  last_attempted_at TIMESTAMP WITH TIME ZONE,
  last_answer VARCHAR(10),
  last_correct BOOLEAN,

  time_spent_seconds INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, question_id)
);

-- Test sessions table (for tracking user tests)
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  session_type VARCHAR(50) NOT NULL, -- 'practice', 'timed_test', 'previous_year', 'chapter_test'
  exam_id UUID REFERENCES exams(id),
  subject_id UUID REFERENCES subjects(id),
  chapter_id UUID REFERENCES chapters(id),
  year INTEGER, -- for previous year papers

  total_questions INTEGER NOT NULL,
  total_marks DECIMAL(8,2),
  time_limit_seconds INTEGER,

  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,

  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'

  score DECIMAL(8,2),
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  skipped_answers INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test session answers table
CREATE TABLE test_session_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  question_number INTEGER NOT NULL,
  user_answer VARCHAR(10),
  correct_answer VARCHAR(10) NOT NULL,
  is_correct BOOLEAN,
  is_flagged BOOLEAN DEFAULT false,

  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, question_id)
);

-- Indexes for better query performance
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_chapter ON questions(chapter_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(active);

CREATE INDEX idx_subjects_exam ON subjects(exam_id);
CREATE INDEX idx_chapters_subject ON chapters(subject_id);
CREATE INDEX idx_topics_chapter ON topics(chapter_id);

CREATE INDEX idx_user_progress_user ON user_question_progress(user_id);
CREATE INDEX idx_user_progress_question ON user_question_progress(question_id);
CREATE INDEX idx_user_progress_bookmarked ON user_question_progress(bookmarked) WHERE bookmarked = true;

CREATE INDEX idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_test_session_answers_session ON test_session_answers(session_id);

-- Row Level Security (RLS) policies
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_session_answers ENABLE ROW LEVEL SECURITY;

-- Public read access for active exam structure
CREATE POLICY "Anyone can view active exams" ON exams
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active subjects" ON subjects
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active chapters" ON chapters
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active topics" ON topics
  FOR SELECT USING (active = true);

-- Authenticated users can view active questions
CREATE POLICY "Authenticated users can view active questions" ON questions
  FOR SELECT TO authenticated
  USING (active = true);

-- Users can only access their own progress
CREATE POLICY "Users can view own progress" ON user_question_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_question_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_question_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can only access their own test sessions
CREATE POLICY "Users can view own test sessions" ON test_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test sessions" ON test_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions" ON test_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can only access their own test session answers
CREATE POLICY "Users can view own test session answers" ON test_session_answers
  FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM test_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own test session answers" ON test_session_answers
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (SELECT id FROM test_sessions WHERE user_id = auth.uid()));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_question_progress_updated_at BEFORE UPDATE ON user_question_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON test_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
