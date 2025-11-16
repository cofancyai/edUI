import { useState, useCallback } from 'react';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  questions: Question[];
  examType: string;
}

export interface TestSession {
  testId: string;
  startTime: Date;
  answers: Record<string, number>;
  flaggedQuestions: Set<string>;
  currentQuestionIndex: number;
}

export interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  timeTaken: number;
  percentage: number;
}

interface UseMockTestParams {
  userId: string;
}

interface UseMockTestReturn {
  tests: Test[];
  isLoading: boolean;
  error: string | null;
  mode: 'selection' | 'test' | 'results';
  testInProgress: TestSession | null;
  testResult: TestResult | null;
  startTest: (testId: string) => void;
  submitAnswer: (questionId: string, answer: number) => void;
  flagQuestion: (questionId: string) => void;
  unflagQuestion: (questionId: string) => void;
  endTest: () => void;
  resetToSelection: () => void;
  currentQuestion: Question | null;
  moveToNextQuestion: () => void;
  moveToPreviousQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  refreshData: () => void;
}

export const useMockTest = ({ userId }: UseMockTestParams): UseMockTestReturn => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'selection' | 'test' | 'results'>('selection');
  const [testInProgress, setTestInProgress] = useState<TestSession | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const refreshData = useCallback(() => {
    // Mock test data - in production, fetch from API
    const mockTests: Test[] = [
      {
        id: '1',
        title: 'UPSC Prelims Mock Test 1',
        description: 'General Studies Paper 1',
        duration: 120,
        totalQuestions: 100,
        examType: 'UPSC',
        questions: []
      },
      {
        id: '2',
        title: 'SSC CGL Mock Test',
        description: 'General Intelligence and Reasoning',
        duration: 60,
        totalQuestions: 50,
        examType: 'SSC',
        questions: []
      }
    ];
    setTests(mockTests);
  }, []);

  const startTest = useCallback((testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) {
      setError('Test not found');
      return;
    }

    setTestInProgress({
      testId,
      startTime: new Date(),
      answers: {},
      flaggedQuestions: new Set(),
      currentQuestionIndex: 0
    });
    setMode('test');
  }, [tests]);

  const submitAnswer = useCallback((questionId: string, answer: number) => {
    if (!testInProgress) return;

    setTestInProgress({
      ...testInProgress,
      answers: {
        ...testInProgress.answers,
        [questionId]: answer
      }
    });
  }, [testInProgress]);

  const flagQuestion = useCallback((questionId: string) => {
    if (!testInProgress) return;

    const newFlagged = new Set(testInProgress.flaggedQuestions);
    newFlagged.add(questionId);

    setTestInProgress({
      ...testInProgress,
      flaggedQuestions: newFlagged
    });
  }, [testInProgress]);

  const unflagQuestion = useCallback((questionId: string) => {
    if (!testInProgress) return;

    const newFlagged = new Set(testInProgress.flaggedQuestions);
    newFlagged.delete(questionId);

    setTestInProgress({
      ...testInProgress,
      flaggedQuestions: newFlagged
    });
  }, [testInProgress]);

  const endTest = useCallback(() => {
    if (!testInProgress) return;

    const test = tests.find(t => t.id === testInProgress.testId);
    if (!test) return;

    const correctAnswers = 0; // Calculate based on answers
    const totalQuestions = test.totalQuestions;
    const timeTaken = Math.floor((new Date().getTime() - testInProgress.startTime.getTime()) / 1000);

    setTestResult({
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: Object.keys(testInProgress.answers).length - correctAnswers,
      skippedAnswers: totalQuestions - Object.keys(testInProgress.answers).length,
      timeTaken,
      percentage: (correctAnswers / totalQuestions) * 100
    });

    setMode('results');
    setTestInProgress(null);
  }, [testInProgress, tests]);

  const resetToSelection = useCallback(() => {
    setMode('selection');
    setTestInProgress(null);
    setTestResult(null);
  }, []);

  const currentQuestion = testInProgress && tests.find(t => t.id === testInProgress.testId)?.questions[testInProgress.currentQuestionIndex] || null;

  const moveToNextQuestion = useCallback(() => {
    if (!testInProgress) return;
    const test = tests.find(t => t.id === testInProgress.testId);
    if (!test) return;

    if (testInProgress.currentQuestionIndex < test.questions.length - 1) {
      setTestInProgress({
        ...testInProgress,
        currentQuestionIndex: testInProgress.currentQuestionIndex + 1
      });
    }
  }, [testInProgress, tests]);

  const moveToPreviousQuestion = useCallback(() => {
    if (!testInProgress) return;

    if (testInProgress.currentQuestionIndex > 0) {
      setTestInProgress({
        ...testInProgress,
        currentQuestionIndex: testInProgress.currentQuestionIndex - 1
      });
    }
  }, [testInProgress]);

  const jumpToQuestion = useCallback((index: number) => {
    if (!testInProgress) return;
    const test = tests.find(t => t.id === testInProgress.testId);
    if (!test) return;

    if (index >= 0 && index < test.questions.length) {
      setTestInProgress({
        ...testInProgress,
        currentQuestionIndex: index
      });
    }
  }, [testInProgress, tests]);

  return {
    tests,
    isLoading,
    error,
    mode,
    testInProgress,
    testResult,
    startTest,
    submitAnswer,
    flagQuestion,
    unflagQuestion,
    endTest,
    resetToSelection,
    currentQuestion,
    moveToNextQuestion,
    moveToPreviousQuestion,
    jumpToQuestion,
    refreshData
  };
};
