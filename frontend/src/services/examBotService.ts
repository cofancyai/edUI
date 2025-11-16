/**
 * ExamBot Service - Updated for Existing Database Schema
 * Integrates with your existing Supabase database structure
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching your existing database schema
export interface ExamCategory {
  id: number;
  category_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  file: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam: string;
  year: number | null;
  topic: string;
  subtopic: string;
  topic_id: string;
  subtopic_id: string;
  question_number: number | null;
  question: string;
  options: string[]; // JSONB array
  answer: string;
  detailed_explanation: string | null;
  difficulty: string | null;
  subject: string;
  tags: string[] | null; // JSONB array
  time_estimate: number;
  file_source: string | null;
  created_at: string;
  updated_at: string;
  question_type: string;
  bookmarked?: boolean; // Added from user progress
  attempted?: boolean; // Added from user progress
}

export interface UserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  listen_completed: boolean;
  study_completed: boolean;
  review_completed: boolean;
  test_completed: boolean;
  memory_completed: boolean;
  test_score: number | null;
  last_accessed: string | null;
}

// ExamBot Service
export const examBotService = {
  /**
   * Get all active exam categories
   */
  async getExamCategories(): Promise<ExamCategory[]> {
    const { data, error } = await supabase
      .from('exam_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all topics
   */
  async getTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get subtopics for a specific topic
   */
  async getSubtopics(topicId: string): Promise<Subtopic[]> {
    const { data, error } = await supabase
      .from('subtopics')
      .select('*')
      .eq('topic_id', topicId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get questions with filters
   */
  async getQuestions(filters: {
    exam?: string;
    year?: number;
    topic?: string;
    subtopic?: string;
    topicId?: string;
    subtopicId?: string;
    subject?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<Question[]> {
    let query = supabase.from('questions').select('*');

    // Apply filters
    if (filters.exam) query = query.eq('exam', filters.exam);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.topic) query = query.eq('topic', filters.topic);
    if (filters.subtopic) query = query.eq('subtopic', filters.subtopic);
    if (filters.topicId) query = query.eq('topic_id', filters.topicId);
    if (filters.subtopicId) query = query.eq('subtopic_id', filters.subtopicId);
    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    // Pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    // Order by question number or created date
    query = query.order('question_number', { ascending: true, nullsFirst: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get previous year questions for a specific exam and year
   */
  async getPreviousYearQuestions(
    exam: string,
    year: number,
    limit?: number
  ): Promise<Question[]> {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam', exam)
      .eq('year', year)
      .order('subject')
      .order('question_number');

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get available years for an exam
   */
  async getAvailableYears(exam: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('year')
      .eq('exam', exam)
      .not('year', 'is', null)
      .order('year', { ascending: false });

    if (error) throw error;

    // Extract unique years
    const years = [...new Set(data?.map((q) => q.year).filter((y) => y !== null))];
    return years as number[];
  },

  /**
   * Get question count with filters
   */
  async getQuestionCount(filters: {
    exam?: string;
    year?: number;
    topicId?: string;
    subtopicId?: string;
    subject?: string;
    difficulty?: string;
  }): Promise<number> {
    let query = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (filters.exam) query = query.eq('exam', filters.exam);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.topicId) query = query.eq('topic_id', filters.topicId);
    if (filters.subtopicId) query = query.eq('subtopic_id', filters.subtopicId);
    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get unique subjects for an exam
   */
  async getSubjectsByExam(exam: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('subject')
      .eq('exam', exam)
      .order('subject');

    if (error) throw error;

    // Get unique subjects
    const subjects = [...new Set(data?.map((q) => q.subject))];
    return subjects;
  },

  /**
   * Get unique topics for an exam and subject
   */
  async getTopicsByExamAndSubject(
    exam: string,
    subject: string
  ): Promise<{ topic: string; topic_id: string }[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('topic, topic_id')
      .eq('exam', exam)
      .eq('subject', subject)
      .order('topic');

    if (error) throw error;

    // Get unique topics
    const uniqueTopics = Array.from(
      new Map(data?.map((item) => [item.topic_id, item])).values()
    );

    return uniqueTopics;
  },

  /**
   * Get unique subtopics for a topic
   */
  async getSubtopicsByTopic(
    topicId: string
  ): Promise<{ subtopic: string; subtopic_id: string }[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('subtopic, subtopic_id')
      .eq('topic_id', topicId)
      .order('subtopic');

    if (error) throw error;

    // Get unique subtopics
    const uniqueSubtopics = Array.from(
      new Map(data?.map((item) => [item.subtopic_id, item])).values()
    );

    return uniqueSubtopics;
  },

  /**
   * Search questions by keyword
   */
  async searchQuestions(
    keyword: string,
    exam?: string,
    limit: number = 20
  ): Promise<Question[]> {
    let query = supabase
      .from('questions')
      .select('*')
      .textSearch('question', keyword)
      .limit(limit);

    if (exam) query = query.eq('exam', exam);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get random questions for practice
   */
  async getRandomQuestions(filters: {
    exam: string;
    subject?: string;
    topicId?: string;
    difficulty?: string;
    count: number;
  }): Promise<Question[]> {
    // Note: Supabase doesn't have a built-in RANDOM() function in the client
    // We'll fetch more questions and randomize on client side
    const fetchCount = Math.min(filters.count * 3, 100); // Fetch 3x to randomize

    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam', filters.exam)
      .limit(fetchCount);

    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.topicId) query = query.eq('topic_id', filters.topicId);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    const { data, error } = await query;

    if (error) throw error;

    // Randomize and take requested count
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, filters.count);
  },

  /**
   * Get a single question by ID
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get statistics for an exam
   */
  async getExamStats(exam: string): Promise<{
    totalQuestions: number;
    subjectCount: number;
    topicCount: number;
    yearRange: { min: number | null; max: number | null };
  }> {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, topic_id, year')
      .eq('exam', exam);

    if (error) throw error;

    const subjects = new Set(data?.map((q) => q.subject));
    const topics = new Set(data?.map((q) => q.topic_id));
    const years = data?.map((q) => q.year).filter((y) => y !== null) as number[];

    return {
      totalQuestions: data?.length || 0,
      subjectCount: subjects.size,
      topicCount: topics.size,
      yearRange: {
        min: years.length > 0 ? Math.min(...years) : null,
        max: years.length > 0 ? Math.max(...years) : null,
      },
    };
  },
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Note: User progress tracking would need a separate table
// For now, we can use localStorage for bookmarks or create a new table
export const userProgressService = {
  /**
   * Get bookmarked question IDs from localStorage
   */
  getBookmarkedQuestions(): string[] {
    const bookmarks = localStorage.getItem('exambot_bookmarks');
    return bookmarks ? JSON.parse(bookmarks) : [];
  },

  /**
   * Toggle bookmark for a question
   */
  toggleBookmark(questionId: string): void {
    const bookmarks = this.getBookmarkedQuestions();
    const index = bookmarks.indexOf(questionId);

    if (index > -1) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push(questionId);
    }

    localStorage.setItem('exambot_bookmarks', JSON.stringify(bookmarks));
  },

  /**
   * Check if question is bookmarked
   */
  isBookmarked(questionId: string): boolean {
    const bookmarks = this.getBookmarkedQuestions();
    return bookmarks.includes(questionId);
  },

  /**
   * Save test session to localStorage
   */
  saveTestSession(sessionId: string, sessionData: any): void {
    localStorage.setItem(`test_session_${sessionId}`, JSON.stringify(sessionData));
  },

  /**
   * Get test session from localStorage
   */
  getTestSession(sessionId: string): any {
    const session = localStorage.getItem(`test_session_${sessionId}`);
    return session ? JSON.parse(session) : null;
  },

  /**
   * Clear test session
   */
  clearTestSession(sessionId: string): void {
    localStorage.removeItem(`test_session_${sessionId}`);
  },
};
