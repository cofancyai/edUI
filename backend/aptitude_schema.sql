-- Aptitude Question Bank Database Schema
-- Separate database structure for Aptitude training module

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aptitude categories table (Number Systems, Percentages, Time & Distance, etc.)
CREATE TABLE aptitude_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aptitude topics table (sub-categories within each category)
CREATE TABLE aptitude_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES aptitude_categories(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, code)
);

-- Aptitude questions table
CREATE TABLE aptitude_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES aptitude_categories(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES aptitude_topics(id) ON DELETE SET NULL,

  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options: ["option1", "option2", "option3", "option4"]
  answer VARCHAR(10) NOT NULL, -- "A", "B", "C", or "D"
  detailed_explanation TEXT,

  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  marks DECIMAL(5,2) DEFAULT 1.0,
  time_seconds INTEGER DEFAULT 90, -- suggested time per question

  tags TEXT[], -- additional tags for better filtering
  formula TEXT, -- formula used (if applicable)
  shortcut_method TEXT, -- quick solving method

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

-- User aptitude progress tracking
CREATE TABLE user_aptitude_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  question_id UUID REFERENCES aptitude_questions(id) ON DELETE CASCADE,

  attempted BOOLEAN DEFAULT false,
  is_correct BOOLEAN,
  selected_answer VARCHAR(10),
  time_taken INTEGER, -- seconds taken to answer

  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, question_id)
);

-- User aptitude practice sessions
CREATE TABLE user_aptitude_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_type VARCHAR(20) DEFAULT 'practice', -- 'practice', 'test'

  category_id UUID REFERENCES aptitude_categories(id),
  topic_id UUID REFERENCES aptitude_topics(id),
  difficulty VARCHAR(20),

  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  skipped_questions INTEGER DEFAULT 0,

  total_time_seconds INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2),

  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  session_data JSONB -- stores detailed session information
);

-- Indexes for better query performance
CREATE INDEX idx_aptitude_questions_category ON aptitude_questions(category_id);
CREATE INDEX idx_aptitude_questions_topic ON aptitude_questions(topic_id);
CREATE INDEX idx_aptitude_questions_difficulty ON aptitude_questions(difficulty);
CREATE INDEX idx_aptitude_questions_active ON aptitude_questions(active);

CREATE INDEX idx_aptitude_topics_category ON aptitude_topics(category_id);
CREATE INDEX idx_user_aptitude_progress_user ON user_aptitude_progress(user_id);
CREATE INDEX idx_user_aptitude_progress_question ON user_aptitude_progress(question_id);
CREATE INDEX idx_user_aptitude_sessions_user ON user_aptitude_sessions(user_id);

-- Comments
COMMENT ON TABLE aptitude_categories IS 'Main aptitude categories like Number Systems, Percentages, etc.';
COMMENT ON TABLE aptitude_topics IS 'Subcategories within each aptitude category';
COMMENT ON TABLE aptitude_questions IS 'Aptitude question bank with explanations and formulas';
COMMENT ON TABLE user_aptitude_progress IS 'Tracks individual user progress on each question';
COMMENT ON TABLE user_aptitude_sessions IS 'Records complete practice/test sessions';
