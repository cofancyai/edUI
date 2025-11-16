/**
 * ExamBot Service - Supabase Integration
 * This service handles all database operations for the ExamBot question bank
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// TODO: Replace with your actual Supabase URL and anon key from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching our database schema
export interface Exam {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

export interface Subject {
  id: string;
  exam_id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  display_order: number;
  active: boolean;
}

export interface Chapter {
  id: string;
  subject_id: string;
  code: string;
  name: string;
  description: string;
  display_order: number;
  active: boolean;
}

export interface Topic {
  id: string;
  chapter_id: string;
  code: string;
  name: string;
  description: string;
  display_order: number;
  active: boolean;
}

export interface Question {
  id: string;
  exam_id: string;
  subject_id: string;
  chapter_id: string;
  topic_id?: string;
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  year?: number;
  marks: number;
  negative_marks: number;
  time_seconds: number;
  question_type: string;
  tags: string[];
  verified: boolean;
  active: boolean;
  view_count: number;
  attempt_count: number;
  correct_count: number;
}

export interface QuestionFull extends Question {
  exam_code: string;
  exam_name: string;
  subject_code: string;
  subject_name: string;
  chapter_code: string;
  chapter_name: string;
  topic_code?: string;
  topic_name?: string;
}

export interface UserQuestionProgress {
  id: string;
  user_id: string;
  question_id: string;
  bookmarked: boolean;
  bookmarked_at?: string;
  attempted: boolean;
  attempt_count: number;
  correct_count: number;
  incorrect_count: number;
  last_attempted_at?: string;
  last_answer?: string;
  last_correct?: boolean;
  time_spent_seconds: number;
  notes?: string;
}

export interface TestSession {
  id: string;
  user_id: string;
  session_type: 'practice' | 'timed_test' | 'previous_year' | 'chapter_test';
  exam_id?: string;
  subject_id?: string;
  chapter_id?: string;
  year?: number;
  total_questions: number;
  total_marks: number;
  time_limit_seconds?: number;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  correct_answers: number;
  incorrect_answers: number;
  skipped_answers: number;
}

export interface TestSessionAnswer {
  id: string;
  session_id: string;
  question_id: string;
  question_number: number;
  user_answer?: string;
  correct_answer: string;
  is_correct?: boolean;
  is_flagged: boolean;
  time_spent_seconds: number;
  answered_at?: string;
}

// Exam Operations
export const examBotService = {
  // Fetch all active exams
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Fetch subjects for a specific exam
  async getSubjects(examCode: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('exam_id', supabase.rpc('get_exam_id_by_code', { exam_code: examCode }))
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Fetch subjects by exam ID
  async getSubjectsByExamId(examId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('exam_id', examId)
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Fetch chapters for a specific subject
  async getChapters(subjectId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Fetch topics for a specific chapter
  async getTopics(chapterId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Fetch questions with filters
  async getQuestions(filters: {
    examId?: string;
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    year?: number;
    limit?: number;
    offset?: number;
  }): Promise<QuestionFull[]> {
    let query = supabase
      .from('vw_questions_full')
      .select('*');

    if (filters.examId) query = query.eq('exam_id', filters.examId);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
    if (filters.chapterId) query = query.eq('chapter_id', filters.chapterId);
    if (filters.topicId) query = query.eq('topic_id', filters.topicId);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.year) query = query.eq('year', filters.year);

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Fetch previous year questions for a specific year
  async getPreviousYearQuestions(examId: string, year: number, limit?: number): Promise<QuestionFull[]> {
    let query = supabase
      .from('vw_questions_full')
      .select('*')
      .eq('exam_id', examId)
      .eq('year', year);

    if (limit) query = query.limit(limit);

    const { data, error } = await query.order('subject_name');

    if (error) throw error;
    return data || [];
  },

  // Get available years for previous year papers
  async getAvailableYears(examId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('year')
      .eq('exam_id', examId)
      .not('year', 'is', null)
      .order('year', { ascending: false });

    if (error) throw error;

    // Extract unique years
    const years = [...new Set(data?.map(q => q.year).filter(y => y !== null) || [])];
    return years as number[];
  },

  // Increment view count for a question
  async incrementViewCount(questionId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_view_count', { question_id: questionId });
    if (error) throw error;
  },

  // User Progress Operations
  async getUserProgress(userId: string, questionId: string): Promise<UserQuestionProgress | null> {
    const { data, error } = await supabase
      .from('user_question_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  // Get all bookmarked questions for a user
  async getBookmarkedQuestions(userId: string, examId?: string): Promise<QuestionFull[]> {
    let query = supabase
      .from('user_question_progress')
      .select(`
        question_id,
        bookmarked_at,
        vw_questions_full!inner (*)
      `)
      .eq('user_id', userId)
      .eq('bookmarked', true);

    if (examId) {
      query = query.eq('vw_questions_full.exam_id', examId);
    }

    const { data, error } = await query.order('bookmarked_at', { ascending: false });

    if (error) throw error;
    return data?.map((item: any) => item.vw_questions_full) || [];
  },

  // Toggle bookmark for a question
  async toggleBookmark(userId: string, questionId: string, bookmarked: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_question_progress')
      .upsert({
        user_id: userId,
        question_id: questionId,
        bookmarked,
        bookmarked_at: bookmarked ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,question_id'
      });

    if (error) throw error;
  },

  // Record user answer
  async recordAnswer(
    userId: string,
    questionId: string,
    userAnswer: string,
    correctAnswer: string,
    timeSpent: number
  ): Promise<void> {
    const isCorrect = userAnswer === correctAnswer;

    // Get existing progress
    const existing = await this.getUserProgress(userId, questionId);

    const updateData = {
      user_id: userId,
      question_id: questionId,
      attempted: true,
      attempt_count: (existing?.attempt_count || 0) + 1,
      correct_count: (existing?.correct_count || 0) + (isCorrect ? 1 : 0),
      incorrect_count: (existing?.incorrect_count || 0) + (isCorrect ? 0 : 1),
      last_attempted_at: new Date().toISOString(),
      last_answer: userAnswer,
      last_correct: isCorrect,
      time_spent_seconds: (existing?.time_spent_seconds || 0) + timeSpent,
    };

    const { error } = await supabase
      .from('user_question_progress')
      .upsert(updateData, { onConflict: 'user_id,question_id' });

    if (error) throw error;

    // Update question statistics
    await supabase.rpc('update_question_stats', {
      question_id: questionId,
      is_correct: isCorrect
    });
  },

  // Test Session Operations
  async createTestSession(sessionData: Omit<TestSession, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('test_sessions')
      .insert(sessionData)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateTestSession(sessionId: string, updates: Partial<TestSession>): Promise<void> {
    const { error } = await supabase
      .from('test_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  },

  async getTestSession(sessionId: string): Promise<TestSession | null> {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserTestSessions(userId: string, limit = 10): Promise<TestSession[]> {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async saveTestAnswer(answerData: Omit<TestSessionAnswer, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('test_session_answers')
      .upsert(answerData, { onConflict: 'session_id,question_id' });

    if (error) throw error;
  },

  async getTestAnswers(sessionId: string): Promise<TestSessionAnswer[]> {
    const { data, error } = await supabase
      .from('test_session_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number');

    if (error) throw error;
    return data || [];
  },

  // Statistics
  async getUserStats(userId: string): Promise<{
    total_questions_attempted: number;
    bookmarked_questions: number;
    total_correct: number;
    total_incorrect: number;
    accuracy_percentage: number;
  }> {
    const { data, error } = await supabase
      .from('vw_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      total_questions_attempted: 0,
      bookmarked_questions: 0,
      total_correct: 0,
      total_incorrect: 0,
      accuracy_percentage: 0,
    };
  },

  async getQuestionCount(filters: {
    examId?: string;
    subjectId?: string;
    chapterId?: string;
    difficulty?: string;
    year?: number;
  }): Promise<number> {
    let query = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    if (filters.examId) query = query.eq('exam_id', filters.examId);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
    if (filters.chapterId) query = query.eq('chapter_id', filters.chapterId);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.year) query = query.eq('year', filters.year);

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  },
};

// Helper function to get current user ID
export const getCurrentUserId = (): string | null => {
  return supabase.auth.getUser().then(({ data }) => data.user?.id || null).catch(() => null) as any;
};

// Database functions that need to be created in Supabase
// These are SQL functions that should be added to your Supabase project:

/*
-- Function to get exam ID by code
CREATE OR REPLACE FUNCTION get_exam_id_by_code(exam_code TEXT)
RETURNS UUID AS $$
  SELECT id FROM exams WHERE code = exam_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(question_id UUID)
RETURNS VOID AS $$
  UPDATE questions SET view_count = view_count + 1 WHERE id = question_id;
$$ LANGUAGE SQL;

-- Function to update question statistics
CREATE OR REPLACE FUNCTION update_question_stats(question_id UUID, is_correct BOOLEAN)
RETURNS VOID AS $$
  UPDATE questions
  SET
    attempt_count = attempt_count + 1,
    correct_count = correct_count + CASE WHEN is_correct THEN 1 ELSE 0 END
  WHERE id = question_id;
$$ LANGUAGE SQL;
*/
