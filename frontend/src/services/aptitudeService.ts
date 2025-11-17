/**
 * Aptitude Service - API integration for Aptitude module
 * Integrates with aptitude_categories, aptitude_topics, and aptitude_questions tables
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabase };

// Types matching the Aptitude database schema
export interface AptitudeCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  description: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AptitudeTopic {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AptitudeQuestion {
  id: string;
  category_id: string;
  topic_id: string | null;
  question: string;
  options: string[]; // JSONB array
  answer: string;
  detailed_explanation: string | null;
  difficulty: string | null;
  marks: number;
  time_seconds: number;
  tags: string[] | null;
  formula: string | null;
  shortcut_method: string | null;
  verified: boolean;
  active: boolean;
  view_count: number;
  attempt_count: number;
  correct_count: number;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  category?: AptitudeCategory;
  topic?: AptitudeTopic;
  subject?: string; // For compatibility with ExamBot UI
}

export interface UserAptitudeProgress {
  id: string;
  user_id: string;
  question_id: string;
  attempted: boolean;
  is_correct: boolean | null;
  selected_answer: string | null;
  time_taken: number | null;
  attempted_at: string;
}

export interface UserAptitudeSession {
  id: string;
  user_id: string;
  session_type: string;
  category_id: string | null;
  topic_id: string | null;
  difficulty: string | null;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  skipped_questions: number;
  total_time_seconds: number;
  accuracy: number;
  started_at: string;
  completed_at: string | null;
  session_data: any; // JSONB
}

// Aptitude Service
export const aptitudeService = {
  /**
   * Get all active aptitude categories
   */
  async getCategories(): Promise<AptitudeCategory[]> {
    const { data, error } = await supabase
      .from('aptitude_categories')
      .select('*')
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get topics for a specific category
   */
  async getTopics(categoryId?: string): Promise<AptitudeTopic[]> {
    let query = supabase
      .from('aptitude_topics')
      .select('*')
      .eq('active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    query = query.order('display_order');

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get questions with filters
   */
  async getQuestions(filters: {
    categoryId?: string;
    topicId?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
    randomize?: boolean;
  }): Promise<AptitudeQuestion[]> {
    let query = supabase
      .from('aptitude_questions')
      .select('*')
      .eq('active', true);

    // Apply filters
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.topicId) query = query.eq('topic_id', filters.topicId);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    // Pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    // Order
    if (!filters.randomize) {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    let questions = data || [];

    // Randomize if requested
    if (filters.randomize && questions.length > 0) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Add subject field for compatibility with ExamBot UI
    questions = questions.map(q => ({
      ...q,
      subject: 'Aptitude' // Generic subject name
    }));

    return questions;
  },

  /**
   * Get a single question by ID
   */
  async getQuestionById(questionId: string): Promise<AptitudeQuestion | null> {
    const { data, error } = await supabase
      .from('aptitude_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment view count for a question
   */
  async incrementViewCount(questionId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_aptitude_view_count', {
      question_id: questionId
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: question } = await supabase
        .from('aptitude_questions')
        .select('view_count')
        .eq('id', questionId)
        .single();

      if (question) {
        await supabase
          .from('aptitude_questions')
          .update({ view_count: question.view_count + 1 })
          .eq('id', questionId);
      }
    }
  },

  /**
   * Save user progress on a question
   */
  async saveProgress(
    userId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    timeTaken: number
  ): Promise<void> {
    const { error } = await supabase
      .from('user_aptitude_progress')
      .upsert({
        user_id: userId,
        question_id: questionId,
        attempted: true,
        is_correct: isCorrect,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
        attempted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      });

    if (error) throw error;

    // Update question statistics
    const { data: question } = await supabase
      .from('aptitude_questions')
      .select('attempt_count, correct_count')
      .eq('id', questionId)
      .single();

    if (question) {
      await supabase
        .from('aptitude_questions')
        .update({
          attempt_count: question.attempt_count + 1,
          correct_count: question.correct_count + (isCorrect ? 1 : 0)
        })
        .eq('id', questionId);
    }
  },

  /**
   * Get user progress for questions
   */
  async getUserProgress(userId: string, questionIds: string[]): Promise<Map<string, UserAptitudeProgress>> {
    const { data, error } = await supabase
      .from('user_aptitude_progress')
      .select('*')
      .eq('user_id', userId)
      .in('question_id', questionIds);

    if (error) throw error;

    const progressMap = new Map<string, UserAptitudeProgress>();
    (data || []).forEach(progress => {
      progressMap.set(progress.question_id, progress);
    });

    return progressMap;
  },

  /**
   * Create a practice session
   */
  async createSession(
    userId: string,
    categoryId: string | null,
    topicId: string | null,
    difficulty: string | null
  ): Promise<string> {
    const { data, error } = await supabase
      .from('user_aptitude_sessions')
      .insert({
        user_id: userId,
        session_type: 'practice',
        category_id: categoryId,
        topic_id: topicId,
        difficulty: difficulty,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Complete a practice session
   */
  async completeSession(
    sessionId: string,
    results: {
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      skippedQuestions: number;
      totalTimeSeconds: number;
      sessionData: any;
    }
  ): Promise<void> {
    const accuracy = results.totalQuestions > 0
      ? (results.correctAnswers / results.totalQuestions) * 100
      : 0;

    const { error } = await supabase
      .from('user_aptitude_sessions')
      .update({
        total_questions: results.totalQuestions,
        correct_answers: results.correctAnswers,
        incorrect_answers: results.incorrectAnswers,
        skipped_questions: results.skippedQuestions,
        total_time_seconds: results.totalTimeSeconds,
        accuracy: accuracy,
        completed_at: new Date().toISOString(),
        session_data: results.sessionData
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  /**
   * Get user's session history
   */
  async getUserSessions(userId: string, limit = 10): Promise<UserAptitudeSession[]> {
    const { data, error } = await supabase
      .from('user_aptitude_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get statistics for a category
   */
  async getCategoryStats(categoryId: string): Promise<{
    totalQuestions: number;
    averageDifficulty: string;
    topicsCount: number;
  }> {
    const { data: questions, error: qError } = await supabase
      .from('aptitude_questions')
      .select('difficulty')
      .eq('category_id', categoryId)
      .eq('active', true);

    const { data: topics, error: tError } = await supabase
      .from('aptitude_topics')
      .select('id')
      .eq('category_id', categoryId)
      .eq('active', true);

    if (qError || tError) throw qError || tError;

    return {
      totalQuestions: questions?.length || 0,
      averageDifficulty: 'medium', // Could be calculated from questions
      topicsCount: topics?.length || 0
    };
  }
};

export default aptitudeService;
