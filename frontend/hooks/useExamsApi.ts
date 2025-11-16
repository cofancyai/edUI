import { useState, useCallback } from 'react';

export const useExamsApi = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [examPage, setExamPage] = useState(1);
  const [totalExams, setTotalExams] = useState(0);
  const [examsPerPage] = useState(10);

  const fetchExams = useCallback(async () => {
    setExamsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExams([]);
      setTotalExams(0);
    } catch (err) {
      setExamsError(err instanceof Error ? err.message : 'Failed to fetch exams');
    } finally {
      setExamsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchExams();
  }, [fetchExams]);

  return {
    exams,
    examsLoading,
    examsError,
    examPage,
    totalExams,
    examsPerPage,
    setExamPage,
    fetchExams,
    handleRefresh
  };
};
