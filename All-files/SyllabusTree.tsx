import React, { useState, useCallback } from 'react';
import { 
 ChevronRight, 
 ChevronDown, 
 BookOpen, 
 Clock, 
 Star, 
 CheckCircle2, 
 Circle,
 Play,
 Search,
 Filter,
 TrendingUp
} from 'lucide-react';
import { SyllabusTree as SyllabusTreeType, TopicNode, SubtopicNode } from '../../../types/syllabus.types';

interface SyllabusTreeProps {
 syllabusTree: SyllabusTreeType | null;
 onTopicClick: (topic: string, subtopic: string) => void;
 onToggleComplete?: (topic: string, subtopic: string, completed: boolean) => void;
 loading?: boolean;
 searchTerm?: string;
 onSearchChange?: (term: string) => void;
 showCompleted?: boolean;
 onShowCompletedChange?: (show: boolean) => void;
 
 priorityFilter?: string;
 onPriorityFilterChange?: (priority: string) => void;
}

const SyllabusTree: React.FC<SyllabusTreeProps> = ({
 syllabusTree,
 onTopicClick,
 onToggleComplete,
 loading = false,
 searchTerm = '',
 onSearchChange,
 showCompleted = true,
 onShowCompletedChange,
 
 priorityFilter = 'all',
 onPriorityFilterChange
}) => {
 const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
 const [showFilters, setShowFilters] = useState(false);

 // Toggle topic expansion
 const toggleTopic = useCallback((topic: string) => {
   setExpandedTopics(prev => {
     const newSet = new Set(prev);
     if (newSet.has(topic)) {
       newSet.delete(topic);
     } else {
       newSet.add(topic);
     }
     return newSet;
   });
 }, []);

 // Expand all topics
 const expandAll = useCallback(() => {
   if (syllabusTree && syllabusTree.topics) {
     setExpandedTopics(new Set(syllabusTree.topics.map(t => t.topic)));
   }
 }, [syllabusTree]);

 // Collapse all topics
 const collapseAll = useCallback(() => {
   setExpandedTopics(new Set());
 }, []);

 // Get difficulty color with null check
 const getDifficultyColor = (difficulty: string): string => {
   if (!difficulty) return '#6B7280';
   
   switch (difficulty.toLowerCase()) {
     case 'basic': return '#10B981';
     case 'intermediate': return '#F59E0B';
     case 'advanced': return '#EF4444';
     default: return '#6B7280';
   }
 };

 // Get priority color with null check
 const getPriorityColor = (priority: string): string => {
   if (!priority) return '#6B7280';
   
   switch (priority.toLowerCase()) {
     case 'high': return '#EF4444';
     case 'medium': return '#F59E0B';
     case 'low': return '#10B981';
     default: return '#6B7280';
   }
 };

 // Filter subtopics based on search and filters
 const filterSubtopics = useCallback((subtopics: SubtopicNode[]): SubtopicNode[] => {
  if (!subtopics || !Array.isArray(subtopics)) {
    return [];
  }

  return subtopics.filter(subtopic => {
    if (!subtopic) return false;

    // Search filter
    if (searchTerm && subtopic.subtopic) {
      const searchMatch = subtopic.subtopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subtopic.keywords && Array.isArray(subtopic.keywords) && 
         subtopic.keywords.some(keyword => 
           keyword && keyword.toLowerCase().includes(searchTerm.toLowerCase())
         ));
      if (!searchMatch) return false;
    }

    // Priority filter only (removed difficulty filter)
    if (priorityFilter !== 'all' && subtopic.priority_level) {
      if (subtopic.priority_level.toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
    }

    // Completed filter
    if (!showCompleted && subtopic.completed) {
      return false;
    }

    return true;
  });
}, [searchTerm, priorityFilter, showCompleted]);

 // Calculate topic statistics
 const getTopicStats = useCallback((topic: TopicNode) => {
   if (!topic || !topic.subtopics) {
     return { completed: 0, total: 0, percentage: 0 };
   }

   const filteredSubtopics = filterSubtopics(topic.subtopics);
   const completed = filteredSubtopics.filter(s => s && s.completed).length;
   const total = filteredSubtopics.length;
   const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
   
   return { completed, total, percentage };
 }, [filterSubtopics]);

 if (loading) {
   return (
     <div style={{
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       padding: '4rem',
       background: 'white',
       borderRadius: '1rem',
       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
     }}>
       <div style={{
         width: '40px',
         height: '40px',
         border: '4px solid #E5E7EB',
         borderTop: '4px solid #3B82F6',
         borderRadius: '50%',
         animation: 'spin 1s linear infinite',
         marginRight: '1rem'
       }} />
       <span style={{ fontSize: '1.1rem', color: '#6B7280' }}>Loading syllabus...</span>
     </div>
   );
 }

 if (!syllabusTree) {
   return (
     <div style={{
       padding: '4rem',
       textAlign: 'center',
       background: 'white',
       borderRadius: '1rem',
       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
     }}>
       <BookOpen size={64} style={{ color: '#D1D5DB', margin: '0 auto 1rem' }} />
       <h3 style={{ color: '#6B7280', marginBottom: '1rem' }}>No Syllabus Selected</h3>
       <p style={{ color: '#9CA3AF' }}>Please select an exam and paper to view the syllabus.</p>
     </div>
   );
 }

 const allTopics = syllabusTree.topics || [];
 const visibleTopics = allTopics.map(topic => ({
   ...topic,
   subtopics: filterSubtopics(topic.subtopics || [])
 })).filter(topic => topic.subtopics && topic.subtopics.length > 0);

 return (
   <div style={{
     background: 'white',
     borderRadius: '1rem',
     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
     overflow: 'hidden'
   }}>
     {/* Header */}
     <div style={{
       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
       padding: '1.5rem',
       color: 'white'
     }}>
       <div style={{
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'space-between',
         marginBottom: '1rem'
       }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <BookOpen size={24} />
           <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
             {syllabusTree.exam_name}{syllabusTree.paper_name ? ` - ${syllabusTree.paper_name}` : ''}
           </h2>
         </div>
         
         <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button
             onClick={() => setShowFilters(!showFilters)}
             style={{
               padding: '0.5rem 1rem',
               background: showFilters ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               borderRadius: '0.5rem',
               color: 'white',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               fontSize: '0.9rem'
             }}
           >
             <Filter size={16} />
             Filters
           </button>
           <button
             onClick={expandAll}
             style={{
               padding: '0.5rem 1rem',
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               borderRadius: '0.5rem',
               color: 'white',
               cursor: 'pointer',
               fontSize: '0.9rem'
             }}
           >
             Expand All
           </button>
           <button
             onClick={collapseAll}
             style={{
               padding: '0.5rem 1rem',
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               borderRadius: '0.5rem',
               color: 'white',
               cursor: 'pointer',
               fontSize: '0.9rem'
             }}
           >
             Collapse All
           </button>
         </div>
       </div>

       {/* Search Bar */}
       {onSearchChange && (
         <div style={{ position: 'relative', marginBottom: showFilters ? '1rem' : '0' }}>
           <Search size={20} style={{
             position: 'absolute',
             left: '1rem',
             top: '50%',
             transform: 'translateY(-50%)',
             color: 'rgba(255, 255, 255, 0.7)'
           }} />
           <input
             type="text"
             placeholder="Search topics and subtopics..."
             value={searchTerm}
             onChange={(e) => onSearchChange(e.target.value)}
             style={{
               width: '100%',
               padding: '0.75rem 1rem 0.75rem 3rem',
               background: 'rgba(255, 255, 255, 0.15)',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               borderRadius: '0.75rem',
               color: 'white',
               fontSize: '1rem',
               backdropFilter: 'blur(10px)'
             }}
           />
         </div>
       )}

       {/* Filters */}
       {showFilters && (
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
           gap: '1rem',
           background: 'rgba(255, 255, 255, 0.1)',
           padding: '1rem',
           borderRadius: '0.75rem',
           backdropFilter: 'blur(10px)'
         }}>
           

           <div style={{ display: 'flex', alignItems: 'end' }}>
             <label style={{
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               cursor: 'pointer',
               fontSize: '0.9rem'
             }}>
               <input
                 type="checkbox"
                 checked={showCompleted}
                 onChange={(e) => onShowCompletedChange?.(e.target.checked)}
                 style={{ cursor: 'pointer' }}
               />
               Show Completed
             </label>
           </div>
         </div>
       )}
     </div>

     {/* Syllabus Tree */}
     <div style={{ padding: '1.5rem' }}>
       {visibleTopics.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
           <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
           <p>No topics match your current filters.</p>
         </div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {visibleTopics.map((topic, topicIdx) => {
             const isExpanded = expandedTopics.has(topic.topic);
             const stats = getTopicStats(topic);
             
             return (
               <div key={topicIdx} style={{
                 border: '1px solid #E5E7EB',
                 borderRadius: '0.75rem',
                 overflow: 'hidden',
                 background: '#FAFAFA'
               }}>
                 {/* Topic Header */}
                 <div
                   onClick={() => toggleTopic(topic.topic)}
                   style={{
                     padding: '1rem 1.5rem',
                     background: 'white',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                     transition: 'all 0.2s ease'
                   }}
                 >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                     {isExpanded ? 
                       <ChevronDown size={20} style={{ color: '#6B7280' }} /> : 
                       <ChevronRight size={20} style={{ color: '#6B7280' }} />
                     }
                     
                     <div style={{ flex: 1 }}>
                       <h3 style={{
                         margin: 0,
                         fontSize: '1.1rem',
                         fontWeight: '600',
                         color: '#1F2937',
                         marginBottom: '0.25rem'
                       }}>
                         {topic.topic}
                       </h3>
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '1rem',
                         fontSize: '0.85rem',
                         color: '#6B7280'
                       }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                           <BookOpen size={14} />
                           {stats.total} subtopic{stats.total !== 1 ? 's' : ''}
                         </span>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                           <Clock size={14} />
                           {topic.total_hours || 0}h
                         </span>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                           <TrendingUp size={14} />
                           {stats.percentage}% complete
                         </span>
                       </div>
                     </div>
                   </div>

                   {/* Progress Bar */}
                   <div style={{ width: '100px', marginLeft: '1rem' }}>
                     <div style={{
                       width: '100%',
                       height: '8px',
                       background: '#E5E7EB',
                       borderRadius: '4px',
                       overflow: 'hidden'
                     }}>
                       <div style={{
                         width: `${stats.percentage}%`,
                         height: '100%',
                         background: stats.percentage === 100 ? '#10B981' : 
                                   stats.percentage > 50 ? '#3B82F6' : '#F59E0B',
                         transition: 'width 0.3s ease'
                       }} />
                     </div>
                     <div style={{
                       fontSize: '0.75rem',
                       color: '#6B7280',
                       textAlign: 'center',
                       marginTop: '0.25rem'
                     }}>
                       {stats.completed}/{stats.total}
                     </div>
                   </div>
                 </div>

                 {/* Subtopics */}
                 {isExpanded && (
                   <div style={{ padding: '0.5rem 0' }}>
                     {topic.subtopics && topic.subtopics.map((subtopic, subtopicIdx) => (
                       <div
                         key={subtopicIdx}
                         style={{
                           padding: '1rem 1.5rem',
                           margin: '0.25rem 1rem',
                           background: 'white',
                           borderRadius: '0.5rem',
                           border: '1px solid #F3F4F6',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'space-between',
                           cursor: 'pointer',
                           transition: 'all 0.2s ease'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-1px)';
                           e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = 'none';
                         }}
                       >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                           {onToggleComplete && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onToggleComplete(topic.topic, subtopic.subtopic, !subtopic.completed);
                               }}
                               style={{
                                 background: 'none',
                                 border: 'none',
                                 cursor: 'pointer',
                                 padding: '0.25rem'
                               }}
                             >
                               {subtopic.completed ? 
                                 <CheckCircle2 size={20} style={{ color: '#10B981' }} /> :
                                 <Circle size={20} style={{ color: '#D1D5DB' }} />
                               }
                             </button>
                           )}
                           
                           <div style={{ flex: 1 }}>
                             <div style={{
                               fontSize: '1rem',
                               fontWeight: '500',
                               color: subtopic.completed ? '#6B7280' : '#1F2937',
                               textDecoration: subtopic.completed ? 'line-through' : 'none',
                               marginBottom: '0.5rem'
                             }}>
                               {subtopic.subtopic}
                             </div>
                             
                             <div style={{
                               display: 'flex',
                               alignItems: 'center',
                               gap: '0.75rem',
                               flexWrap: 'wrap'
                             }}>
                               {/* Priority Badge */}
                               {subtopic.priority_level && (
                                 <span style={{
                                   padding: '0.25rem 0.5rem',
                                   borderRadius: '0.25rem',
                                   fontSize: '0.75rem',
                                   fontWeight: '600',
                                   color: 'white',
                                   background: getPriorityColor(subtopic.priority_level),
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem'
                                 }}>
                                   <Star size={12} />
                                   {subtopic.priority_level}
                                 </span>
                               )}

                               {/* Study Time */}
                               <span style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.25rem',
                                 fontSize: '0.8rem',
                                 color: '#6B7280'
                               }}>
                                 <Clock size={12} />
                                 {subtopic.estimated_study_hours || 0}h
                               </span>
                             </div>
                           </div>
                         </div>

                         <button
                           onClick={() => onTopicClick(topic.topic, subtopic.subtopic)}
                           style={{
                             padding: '0.5rem 1rem',
                             background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
                             color: 'white',
                             border: 'none',
                             borderRadius: '0.5rem',
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.5rem',
                             fontSize: '0.85rem',
                             fontWeight: '600',
                             transition: 'all 0.2s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.background = 'linear-gradient(45deg, #1D4ED8, #1E40AF)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.background = 'linear-gradient(45deg, #3B82F6, #1D4ED8)';
                           }}
                         >
                           <Play size={14} />
                           Study Now
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             );
           })}
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

export default SyllabusTree;