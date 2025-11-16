import { useState, useCallback } from 'react';

interface SearchResult {
  id: string;
  question: string;
  answer: string;
  year: number;
  exam: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface TestSession {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number>;
  flagged: Set<string>;
}

interface TestResult {
  score: number;
  total: number;
  percentage: number;
}

export const useExamBot = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicIndex, setTopicIndex] = useState(0);
  const [testMode, setTestMode] = useState<'search' | 'test' | 'results' | 'review'>('search');
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [availableYears, setAvailableYears] = useState<number[]>([2024, 2023, 2022, 2021, 2020]);

  const performSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    try {
      // Mock search
      await new Promise(resolve => setTimeout(resolve, 500));
      setSearchResults([]);
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTest = useCallback((topicId: string) => {
    setTestSession({
      questions: [],
      currentIndex: 0,
      answers: {},
      flagged: new Set()
    });
    setTestMode('test');
  }, []);

  const endTest = useCallback(() => {
    if (testSession) {
      setTestResult({
        score: 0,
        total: testSession.questions.length,
        percentage: 0
      });
      setTestMode('results');
    }
  }, [testSession]);

  const moveToNextQuestion = useCallback(() => {
    if (testSession && testSession.currentIndex < testSession.questions.length - 1) {
      setTestSession({
        ...testSession,
        currentIndex: testSession.currentIndex + 1
      });
    }
  }, [testSession]);

  const moveToPreviousQuestion = useCallback(() => {
    if (testSession && testSession.currentIndex > 0) {
      setTestSession({
        ...testSession,
        currentIndex: testSession.currentIndex - 1
      });
    }
  }, [testSession]);

  const jumpToQuestion = useCallback((index: number) => {
    if (testSession) {
      setTestSession({
        ...testSession,
        currentIndex: index
      });
    }
  }, [testSession]);

  const currentQuestion = testSession?.questions[testSession.currentIndex] || null;

  const submitAnswer = useCallback((questionId: string, answer: number) => {
    if (testSession) {
      setTestSession({
        ...testSession,
        answers: { ...testSession.answers, [questionId]: answer }
      });
    }
  }, [testSession]);

  const isAnswered = useCallback((questionId: string) => {
    return testSession?.answers[questionId] !== undefined;
  }, [testSession]);

  const getUserAnswer = useCallback((questionId: string) => {
    return testSession?.answers[questionId];
  }, [testSession]);

  const flagQuestion = useCallback((questionId: string) => {
    if (testSession) {
      const newFlagged = new Set(testSession.flagged);
      newFlagged.add(questionId);
      setTestSession({ ...testSession, flagged: newFlagged });
    }
  }, [testSession]);

  const unflagQuestion = useCallback((questionId: string) => {
    if (testSession) {
      const newFlagged = new Set(testSession.flagged);
      newFlagged.delete(questionId);
      setTestSession({ ...testSession, flagged: newFlagged });
    }
  }, [testSession]);

  const isFlagged = useCallback((questionId: string) => {
    return testSession?.flagged.has(questionId) || false;
  }, [testSession]);

  const goToTestMode = useCallback(() => setTestMode('test'), []);
  const goToResults = useCallback(() => setTestMode('results'), []);
  const goToSearch = useCallback(() => setTestMode('search'), []);
  const goToReview = useCallback(() => setTestMode('review'), []);

  return {
    isLoading,
    error,
    topicIndex,
    testMode,
    testSession,
    testResult,
    searchQuery,
    searchResults,
    recentSearches,
    activeFilters,
    availableYears,
    performSearch,
    setActiveFilters,
    startTest,
    endTest,
    moveToNextQuestion,
    moveToPreviousQuestion,
    jumpToQuestion,
    currentQuestion,
    submitAnswer,
    isAnswered,
    getUserAnswer,
    flagQuestion,
    unflagQuestion,
    isFlagged,
    goToTestMode,
    goToResults,
    goToSearch,
    goToReview,
    setTestSession
  };
};
