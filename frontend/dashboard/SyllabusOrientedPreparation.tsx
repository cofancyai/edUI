import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, BarChart3, Target, Clock, AlertTriangle, RefreshCw, Calendar, Play } from 'lucide-react';
import ExamSelector from '../ExamSelector';
import SyllabusTree from '../SyllabusTree';
import { useSyllabusApi } from '../../hooks/useSyllabusApi';

interface SyllabusOrientedPreparationProps {
 userId?: string;
 isAuthenticated?: boolean;
 setSelectedMenu?: React.Dispatch<React.SetStateAction<string | null>>;
 handleTopicSearch?: (topicTitle: string) => void;
}

const SyllabusOrientedPreparation: React.FC<SyllabusOrientedPreparationProps> = ({ 
 userId, 
 isAuthenticated, 
 setSelectedMenu,
 handleTopicSearch
}) => {
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 
 // Local state for UI
 const [searchTerm, setSearchTerm] = useState<string>('');
 const [showCompleted, setShowCompleted] = useState<boolean>(true);
 const [priorityFilter, setPriorityFilter] = useState<string>('all');
 const [showStats, setShowStats] = useState<boolean>(false);
 const [showStudyPlan, setShowStudyPlan] = useState<boolean>(false);
 const [activeTab, setActiveTab] = useState<'syllabus' | 'plan'>('syllabus');
 const [studyConfig, setStudyConfig] = useState({
   numberOfDays: 30,
   dailyHours: 2
 });
 const [showStudyConfig, setShowStudyConfig] = useState<boolean>(false);

 // Get data and methods from hook
 const {
   exams,
   syllabusTree,
   studyPlan,
   studyStats,
   userProgress,
   selectedExam,
   selectedPaper,
   examsLoading,
   syllabusLoading,
   studyPlanLoading,
   progressLoading,
   statsLoading,
   examsError,
   syllabusError,
   studyPlanError,
   progressError,
   statsError,
   fetchExams,
   fetchUnifiedStudyHub,
   selectExam,
   generateStudyPlan,
   markTopicComplete,
   fetchStudyStats,
   searchSyllabus,
   searchResults,
   searchLoading,
   resetErrors
 } = useSyllabusApi();

 // Debug logging
 const logDebug = useCallback((message: string, data?: any) => {
   console.log(`[SyllabusOrientedPreparation] ${message}`, data || '');
 }, []);

 // Initialize from URL parameters
 useEffect(() => {
   const examFromUrl = searchParams.get('exam');
   const paperFromUrl = searchParams.get('paper');
   
   if (examFromUrl && examFromUrl !== selectedExam) {
     logDebug('Initializing from URL params:', { exam: examFromUrl, paper: paperFromUrl });
     handleExamSelect(examFromUrl, paperFromUrl || '');
   }
 }, [searchParams, selectedExam]);

 // Load exams on component mount
 useEffect(() => {
   fetchExams();
 }, [fetchExams]);

 // Handle exam selection
 const handleExamSelect = useCallback(async (exam_name: string, paper_name: string) => {
   logDebug('Exam selected:', { exam_name, paper_name });
   
   // Update URL parameters
   if (paper_name) {
     setSearchParams({ exam: exam_name, paper: paper_name });
   } else {
     setSearchParams({ exam: exam_name });
   }
   
   // Reset errors and UI state
   resetErrors();
   setActiveTab('syllabus');
   setShowStudyPlan(false);
   
   // Fetch unified data with default study config
   await fetchUnifiedStudyHub(exam_name, paper_name, studyConfig, userId);
   
 }, [setSearchParams, fetchUnifiedStudyHub, userId, studyConfig, resetErrors, logDebug]);

 // Handle topic click - navigate to AI Tutor
 const handleTopicClick = useCallback((topic: string, subtopic: string) => {
   logDebug('Topic clicked:', { topic, subtopic });
   
   if (handleTopicSearch && setSelectedMenu) {
     handleTopicSearch(subtopic);
     setSelectedMenu('AI Tutor');
   }
 }, [handleTopicSearch, setSelectedMenu, logDebug]);

 // Handle topic completion toggle
 const handleToggleComplete = useCallback(async (topic: string, subtopic: string, completed: boolean) => {
   if (!userId) {
     logDebug('Cannot mark completion - user not logged in');
     return;
   }
   
   logDebug('Toggling completion:', { topic, subtopic, completed });
   
   try {
     await markTopicComplete(
       userId,
       selectedExam,
       selectedPaper,
       topic,
       subtopic,
       completed
     );
     
     // Refresh stats if user is authenticated
     if (userId && selectedExam) {
       await fetchStudyStats(userId, selectedExam, selectedPaper);
     }
     
   } catch (error) {
     console.error('Failed to update completion status:', error);
   }
 }, [userId, selectedExam, selectedPaper, markTopicComplete, fetchStudyStats, logDebug]);

 // Handle search
 const handleSearchChange = useCallback((term: string) => {
   setSearchTerm(term);
   
   if (term.trim() && selectedExam) {
     searchSyllabus(selectedExam, term.trim(), selectedPaper);
   }
 }, [selectedExam, selectedPaper, searchSyllabus]);

 // Generate study plan with custom configuration
 const handleGenerateStudyPlan = useCallback(async () => {
   if (!selectedExam) {
     logDebug('No exam selected for study plan generation');
     return;
   }
   
   logDebug('Generating study plan with config:', studyConfig);
   
   try {
     await generateStudyPlan(selectedExam, selectedPaper, studyConfig, userId);
     setShowStudyPlan(true);
     setActiveTab('plan');
     setShowStudyConfig(false);
     
     logDebug('Study plan generated successfully');
   } catch (error) {
     console.error('Failed to generate study plan:', error);
   }
 }, [selectedExam, selectedPaper, studyConfig, userId, generateStudyPlan, logDebug]);

 // Refresh data
 const handleRefresh = useCallback(async () => {
   logDebug('Refreshing data...');
   
   resetErrors();
   await fetchExams();
   
   if (selectedExam) {
     await fetchUnifiedStudyHub(selectedExam, selectedPaper, studyConfig, userId);
   }
 }, [fetchExams, fetchUnifiedStudyHub, selectedExam, selectedPaper, studyConfig, userId, resetErrors, logDebug]);

 // Format date for display
 const formatDate = (dateString: string): string => {
   try {
     return new Date(dateString).toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
     });
   } catch {
     return dateString;
   }
 };

 // Calculate study plan progress
 const getStudyPlanProgress = () => {
   if (!studyPlan || !studyPlan.schedule) return 0;
   
   const today = new Date().toISOString().split('T')[0];
   const totalDays = studyPlan.schedule.length;
   const daysPassed = studyPlan.schedule.findIndex(day => day.date > today);
   
   if (daysPassed === -1) return 100;
   if (daysPassed === 0) return 0;
   
   return Math.round((daysPassed / totalDays) * 100);
 };

 return (
   <div style={{
     minHeight: '100vh',
     background: 'transparent',
     padding: '2rem'
   }}>
     <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
       
       {/* Header */}
       <div style={{
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'space-between',
         marginBottom: '2rem'
       }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             padding: '1rem',
             borderRadius: '1rem',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center'
           }}>
             <BookOpen size={32} style={{ color: 'white' }} />
           </div>
           <div>
             <h1 style={{
               margin: 0,
               fontSize: '2.5rem',
               fontWeight: '800',
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               backgroundClip: 'text'
             }}>
               Unified Study Hub
             </h1>  
             <p style={{
               margin: '0.5rem 0 0 0',
               fontSize: '1.1rem',
               color: '#6B7280'
             }}>
               Structured syllabus with AI-powered study plans
             </p>
           </div>
         </div>

         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <button
             onClick={handleRefresh}
             disabled={examsLoading || syllabusLoading || studyPlanLoading}
             style={{
               padding: '0.75rem 1.5rem',
               background: 'white',
               border: '1px solid #E5E7EB',
               borderRadius: '0.75rem',
               cursor: (examsLoading || syllabusLoading || studyPlanLoading) ? 'not-allowed' : 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               fontSize: '0.9rem',
               fontWeight: '600',
               color: '#374151',
               boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
               opacity: (examsLoading || syllabusLoading || studyPlanLoading) ? 0.6 : 1
             }}
           >
             <RefreshCw size={16} style={{
               animation: (examsLoading || syllabusLoading || studyPlanLoading) ? 'spin 1s linear infinite' : 'none'
             }} />
             Refresh
           </button>

           {studyStats && (
             <button
               onClick={() => setShowStats(!showStats)}
               style={{
                 padding: '0.75rem 1.5rem',
                 background: showStats ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                 border: '1px solid #E5E7EB',
                 borderRadius: '0.75rem',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 fontSize: '0.9rem',
                 fontWeight: '600',
                 color: showStats ? 'white' : '#374151',
                 boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
               }}
             >
               <BarChart3 size={16} />
               Progress Stats
             </button>
           )}

           {selectedExam && (
             <button
               onClick={() => setShowStudyConfig(!showStudyConfig)}
               style={{
                 padding: '0.75rem 1.5rem',
                 background: showStudyPlan ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                 border: 'none',
                 borderRadius: '0.75rem',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 fontSize: '0.9rem',
                 fontWeight: '600',
                 color: 'white',
                 boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
               }}
             >
               <Calendar size={16} />
               {showStudyPlan ? 'Study Plan Ready' : 'Generate Study Plan'}
             </button>
           )}
         </div>
       </div>

       {/* Study Configuration Modal */}
       {showStudyConfig && (
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           padding: '2rem',
           marginBottom: '2rem',
           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
           border: '1px solid #E5E7EB'
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
             marginBottom: '1.5rem'
           }}>
             <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
               Configure Study Plan
             </h2>
             <button
               onClick={() => setShowStudyConfig(false)}
               style={{
                 background: 'none',
                 border: 'none',
                 fontSize: '1.5rem',
                 cursor: 'pointer',
                 color: '#6B7280'
               }}
             >
               Ã—
             </button>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
             <div>
               <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                 Total Days to Complete Syllabus
               </label>
               <input
                 type="number"
                 min="7"
                 max="365"
                 value={studyConfig.numberOfDays}
                 onChange={(e) => setStudyConfig(prev => ({ ...prev, numberOfDays: parseInt(e.target.value) || 30 }))}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #D1D5DB',
                   borderRadius: '0.5rem',
                   fontSize: '1rem'
                 }}
                 placeholder="Enter number of days (e.g., 30)"
               />
               <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                 Recommended: 15-90 days for comprehensive preparation
               </div>
             </div>
             <div>
               <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                 Hours Per Day
               </label>
               <input
                 type="number"
                 min="1"
                 max="12"
                 step="0.5"
                 value={studyConfig.dailyHours}
                 onChange={(e) => setStudyConfig(prev => ({ ...prev, dailyHours: parseFloat(e.target.value) || 2 }))}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #D1D5DB',
                   borderRadius: '0.5rem',
                   fontSize: '1rem'
                 }}
                 placeholder="Enter hours per day (e.g., 2.5)"
               />
               <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                 Recommended: 2-6 hours per day for effective learning
               </div>
             </div>
           </div>

           <div style={{
             background: '#F3F4F6',
             padding: '1rem',
             borderRadius: '0.5rem',
             marginBottom: '2rem'
           }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '1rem' }}>
               Study Plan Summary
             </h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
               <div>
                 <strong>Duration:</strong> {studyConfig.numberOfDays} days
               </div>
               <div>
                 <strong>Daily Hours:</strong> {studyConfig.dailyHours} hours
               </div>
               <div>
                 <strong>Total Hours:</strong> {(studyConfig.numberOfDays * studyConfig.dailyHours).toFixed(1)} hours
               </div>
             </div>
           </div>

           <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
             <button
               onClick={() => setShowStudyConfig(false)}
               style={{
                 padding: '0.75rem 1.5rem',
                 background: '#F3F4F6',
                 border: '1px solid #D1D5DB',
                 borderRadius: '0.5rem',
                 cursor: 'pointer',
                 fontSize: '0.9rem',
                 fontWeight: '600',
                 color: '#374151'
               }}
             >
               Cancel
             </button>
             <button
               onClick={handleGenerateStudyPlan}
               disabled={studyPlanLoading}
               style={{
                 padding: '0.75rem 1.5rem',
                 background: studyPlanLoading ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                 border: 'none',
                 borderRadius: '0.5rem',
                 cursor: studyPlanLoading ? 'not-allowed' : 'pointer',
                 fontSize: '0.9rem',
                 fontWeight: '600',
                 color: 'white',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem'
               }}
             >
               {studyPlanLoading ? (
                 <>
                   <div style={{
                     width: '16px',
                     height: '16px',
                     border: '2px solid rgba(255, 255, 255, 0.3)',
                     borderTop: '2px solid white',
                     borderRadius: '50%',
                     animation: 'spin 1s linear infinite'
                   }} />
                   Generating...
                 </>
               ) : (
                 <>
                   <Play size={16} />
                   Generate Study Plan
                 </>
               )}
             </button>
           </div>
         </div>
       )}

       {/* Progress Stats Panel */}
       {showStats && studyStats && (
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           padding: '2rem',
           marginBottom: '2rem',
           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '0.75rem',
             marginBottom: '1.5rem'
           }}>
             <BarChart3 size={24} style={{ color: '#3B82F6' }} />
             <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
               Study Progress Overview
             </h2>
           </div>

           <div style={{
             display: 'grid',
             gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
             gap: '1.5rem',
             marginBottom: '2rem'
           }}>
             <div style={{
               background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
               padding: '1.5rem',
               borderRadius: '0.75rem',
               color: 'white'
             }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                 {studyStats.completion_percentage}%
               </div>
               <div style={{ fontSize: '1rem', opacity: 0.9 }}>Overall Completion</div>
               <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                 {studyStats.completed_topics} of {studyStats.total_topics} topics
               </div>
             </div>

             <div style={{
               background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
               padding: '1.5rem',
               borderRadius: '0.75rem',
               color: 'white'
             }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                 {studyStats.hours_completed}h
               </div>
               <div style={{ fontSize: '1rem', opacity: 0.9 }}>Hours Studied</div>
               <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                 of {studyStats.total_hours}h total
               </div>
             </div>

             <div style={{
               background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
               padding: '1.5rem',
               borderRadius: '0.75rem',
               color: 'white'
             }}>
               <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                 {studyStats.topics_by_priority.high.total > 0 
                   ? Math.round((studyStats.topics_by_priority.high.completed / studyStats.topics_by_priority.high.total) * 100)
                   : 0}%
               </div>
               <div style={{ fontSize: '1rem', opacity: 0.9 }}>High Priority</div>
               <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                 {studyStats.topics_by_priority.high.completed} of {studyStats.topics_by_priority.high.total} topics
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Error Display */}
       {(examsError || syllabusError || studyPlanError || progressError || statsError) && (
         <div style={{
           background: 'rgba(239, 68, 68, 0.1)',
           border: '1px solid rgba(239, 68, 68, 0.3)',
           borderRadius: '1rem',
           padding: '1.5rem',
           marginBottom: '2rem',
           display: 'flex',
           alignItems: 'center',
           gap: '1rem'
         }}>
           <AlertTriangle size={24} style={{ color: '#EF4444' }} />
           <div>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#EF4444' }}>Error Loading Data</h3>
             <p style={{ margin: 0, color: '#6B7280' }}>
               {examsError || syllabusError || studyPlanError || progressError || statsError}
             </p>
           </div>
           <button
             onClick={handleRefresh}
             style={{
               padding: '0.5rem 1rem',
               background: '#EF4444',
               color: 'white',
               border: 'none',
               borderRadius: '0.5rem',
               cursor: 'pointer',
               fontSize: '0.9rem',
               fontWeight: '600'
             }}
           >
             Retry
           </button>
         </div>
       )}

       {/* Exam Selector */}
       <ExamSelector
         exams={exams}
         selectedExam={selectedExam}
         selectedPaper={selectedPaper}
         onExamSelect={handleExamSelect}
         loading={examsLoading}
         error={examsError}
         onRefresh={handleRefresh}
       />

       {/* Main Content Tabs */}
       {selectedExam && (
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
           overflow: 'hidden',
           marginBottom: '2rem'
         }}>
           {/* Tab Headers */}
           <div style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             padding: '1rem 1.5rem',
             display: 'flex',
             gap: '1rem'
           }}>
             <button
               onClick={() => setActiveTab('syllabus')}
               style={{
                 padding: '0.75rem 1.5rem',
                 background: activeTab === 'syllabus' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                 border: '1px solid rgba(255, 255, 255, 0.3)',
                 borderRadius: '0.5rem',
                 color: 'white',
                 cursor: 'pointer',
                 fontSize: '0.9rem',
                 fontWeight: '600',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 transition: 'all 0.2s ease'
               }}
             >
               <BookOpen size={16} />
               Syllabus Explorer
             </button>
             
             {studyPlan && (
               <button
                 onClick={() => setActiveTab('plan')}
                 style={{
                   padding: '0.75rem 1.5rem',
                   background: activeTab === 'plan' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                   border: '1px solid rgba(255, 255, 255, 0.3)',
                   borderRadius: '0.5rem',
                   color: 'white',
                   cursor: 'pointer',
                   fontSize: '0.9rem',
                   fontWeight: '600',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   transition: 'all 0.2s ease'
                 }}
               >
                 <Calendar size={16} />
                 Study Plan
               </button>
             )}
           </div>

           {/* Tab Content */}
           <div style={{ padding: '1.5rem' }}>
             {activeTab === 'syllabus' && (
               <SyllabusTree
                 syllabusTree={syllabusTree}
                 onTopicClick={handleTopicClick}
                 onToggleComplete={userId ? handleToggleComplete : undefined}
                 loading={syllabusLoading}
                 searchTerm={searchTerm}
                 onSearchChange={handleSearchChange}
                 showCompleted={showCompleted}
                 onShowCompletedChange={setShowCompleted}
                 priorityFilter={priorityFilter}
                 onPriorityFilterChange={setPriorityFilter}
               />
             )}

             {activeTab === 'plan' && studyPlan && (
               <div>
                 <div style={{ marginBottom: '1.5rem' }}>
                   <h3 style={{ color: '#1F2937', marginBottom: '0.5rem' }}>
                     {studyPlan.title}
                   </h3>
                   <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#6B7280' }}>
                     <span>Duration: {formatDate(studyPlan.startDate)} - {formatDate(studyPlan.endDate)}</span>
                     <span>Total Topics: {studyPlan.totalTopics}</span>
                     <span>Estimated Hours: {studyPlan.totalEstimatedHours}h</span>
                     <span>Progress: {getStudyPlanProgress()}%</span>
                   </div>
                 </div>

                 <div style={{
                   maxHeight: '60vh',
                   overflowY: 'auto',
                   border: '1px solid #E5E7EB',
                   borderRadius: '0.5rem'
                 }}>
                   {studyPlan.schedule.map((day, index) => (
                     <div
                       key={index}
                       style={{
                         padding: '1rem',
                         borderBottom: index < studyPlan.schedule.length - 1 ? '1px solid #E5E7EB' : 'none',
                         background: new Date(day.date).toDateString() === new Date().toDateString() 
                           ? 'rgba(59, 130, 246, 0.05)' 
                           : 'white'
                       }}
                     >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                         <h4 style={{ margin: 0, color: '#1F2937' }}>
                           {formatDate(day.date)} - {day.dayOfWeek}
                           {new Date(day.date).toDateString() === new Date().toDateString() && (
                             <span style={{ color: '#3B82F6', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                               (Today)
                             </span>
                           )}
                         </h4>
                         <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                           {day.availableHours}h available
                         </span>
                       </div>
                       
                       {day.topics && day.topics.length > 0 ? (
                         <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                           {day.topics.map((topic, topicIndex) => (
                             <li key={topicIndex} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                               <strong>{topic.title}</strong> ({topic.allocatedHours}h)
                               {topic.focusAreas && topic.focusAreas.length > 0 && (
                                 <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                                   Focus: {topic.focusAreas.join(', ')}
                                 </div>
                               )}
                               {topic.expectedOutcomes && topic.expectedOutcomes.length > 0 && (
                                 <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem' }}>
                                   Goals: {topic.expectedOutcomes.join(', ')}
                                 </div>
                               )}
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <p style={{ margin: 0, color: '#9CA3AF', fontStyle: 'italic' }}>
                           No topics scheduled for this day
                         </p>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Getting Started Guide */}
       {!selectedExam && !examsLoading && exams.length > 0 && (
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           padding: '3rem',
           textAlign: 'center',
           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
         }}>
           <Target size={64} style={{ color: '#3B82F6', margin: '0 auto 2rem' }} />
           <h2 style={{ color: '#1F2937', marginBottom: '1rem', fontSize: '2rem' }}>
             Ready to Begin Your Unified Study Journey?
           </h2>
           <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
             Select your target exam above to access both structured syllabus exploration and AI-powered study planning in one place.
           </p>
           <div style={{
             display: 'grid',
             gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
             gap: '1.5rem',
             maxWidth: '900px',
             margin: '0 auto'
           }}>
             <div style={{ padding: '1.5rem', background: '#F0F9FF', borderRadius: '0.75rem' }}>
               <BookOpen size={32} style={{ color: '#3B82F6', margin: '0 auto 1rem' }} />
               <h3 style={{ color: '#1F2937', marginBottom: '0.5rem' }}>Structured Syllabus</h3>
               <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                 Explore topics organized by priority with progress tracking and AI Tutor integration
               </p>
             </div>
             <div style={{ padding: '1.5rem', background: '#F0FDF4', borderRadius: '0.75rem' }}>
               <Calendar size={32} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
               <h3 style={{ color: '#1F2937', marginBottom: '0.5rem' }}>AI Study Plans</h3>
               <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                 Generate personalized study schedules with realistic time allocations
               </p>
             </div>
             <div style={{ padding: '1.5rem', background: '#FFFBEB', borderRadius: '0.75rem' }}>
               <BarChart3 size={32} style={{ color: '#F59E0B', margin: '0 auto 1rem' }} />
               <h3 style={{ color: '#1F2937', marginBottom: '0.5rem' }}>Progress Analytics</h3>
               <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                 Track completion rates, study time, and get insights on your learning journey
               </p>
             </div>
           </div>
         </div>
       )}

       {/* No Exams Available */}
       {!examsLoading && exams.length === 0 && !examsError && (
         <div style={{
           background: 'white',
           borderRadius: '1rem',
           padding: '3rem',
           textAlign: 'center',
           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
         }}>
           <BookOpen size={64} style={{ color: '#D1D5DB', margin: '0 auto 2rem' }} />
           <h2 style={{ color: '#6B7280', marginBottom: '1rem' }}>No Exams Available</h2>
           <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>
             No exam syllabi have been added yet. Please contact support to add your exam syllabus.
           </p>
           <button
             onClick={handleRefresh}
             style={{
               padding: '1rem 2rem',
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               color: 'white',
               border: 'none',
               borderRadius: '0.75rem',
               cursor: 'pointer',
               fontSize: '1rem',
               fontWeight: '600'
             }}
           >
             Refresh Data
           </button>
         </div>
       )}
     </div>

     {/* Add CSS animation */}
     <style>
       {`
         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }
       `}
     </style>
   </div>
 );
};

export default SyllabusOrientedPreparation;