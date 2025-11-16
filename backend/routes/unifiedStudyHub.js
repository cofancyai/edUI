const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Use the same Supabase configuration as server.js
const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Together AI API configuration
const TOGETHER_AI_API_URL = 'https://api.together.xyz/v1/chat/completions';

// Get credential from Supabase
const getCredential = async (credentialName) => {
 try {
   const { data, error } = await supabase
     .from('credentials')
     .select('config')
     .eq('name', credentialName)
     .eq('is_active', true)
     .single();
   
   if (error) {
     console.error(`Error fetching credential ${credentialName}:`, error);
     throw new Error(`Credential ${credentialName} not found`);
   }
   
   if (!data?.config?.key) {
     throw new Error(`No key found in credential ${credentialName}`);
   }
   
   return data.config.key;
 } catch (err) {
   console.error(`Failed to get credential ${credentialName}:`, err);
   throw err;
 }
};

// Transform syllabus items into tree structure
const buildSyllabusTree = (syllabusItems, userProgress = []) => {
 const topicsMap = new Map();
 
 syllabusItems.forEach(item => {
   if (!topicsMap.has(item.topic)) {
     topicsMap.set(item.topic, {
       topic: item.topic,
       subtopics: [],
       total_hours: 0,
       priority_count: {
         high: 0,
         medium: 0,
         low: 0
       }
     });
   }
   
   const topicNode = topicsMap.get(item.topic);
   
   // Check if this subtopic is completed by user
   const isCompleted = userProgress.some(progress => 
     progress.topic === item.topic && 
     progress.subtopic === item.subtopic && 
     progress.completed
   );
   
   const progressItem = userProgress.find(p => 
     p.topic === item.topic && p.subtopic === item.subtopic
   );
   
   const subtopicNode = {
     subtopic: item.subtopic,
     keywords: item.keywords || [],
     estimated_study_hours: item.estimated_study_hours,
     priority_level: item.priority_level,
     completed: isCompleted,
     last_studied: progressItem?.updated_at || null
   };
   
   topicNode.subtopics.push(subtopicNode);
   topicNode.total_hours += item.estimated_study_hours;
   
   const priority = item.priority_level.toLowerCase();
   if (priority === 'high') topicNode.priority_count.high++;
   else if (priority === 'medium') topicNode.priority_count.medium++;
   else topicNode.priority_count.low++;
 });
 
 return Array.from(topicsMap.values());
};

// Format syllabus data for AI study plan generation
const formatSyllabusForAI = (syllabusItems) => {
 const topicsMap = new Map();
 
 syllabusItems.forEach(item => {
   if (!topicsMap.has(item.topic)) {
     topicsMap.set(item.topic, []);
   }
   topicsMap.get(item.topic).push(item.subtopic);
 });
 
 let formattedContent = '';
 let topicIndex = 1;
 
 for (const [topic, subtopics] of topicsMap) {
   formattedContent += `${topicIndex}. ${topic}\n`;
   subtopics.forEach((subtopic, index) => {
     formattedContent += `   ${index + 1}. ${subtopic}\n`;
   });
   topicIndex++;
 }
 
 return formattedContent;
};

// Generate comprehensive AI study plan
const generateAIStudyPlan = async (examName, paperName, syllabusContent, studyConfig) => {
 try {
   const togetherAiKey = await getCredential('VITE_OPENROUTER_API_KEY');
   
   const today = new Date();
   const endDate = new Date(today);
   endDate.setDate(today.getDate() + parseInt(studyConfig.numberOfDays));
   
   const startDate = today.toISOString().split('T')[0];
   const endDateStr = endDate.toISOString().split('T')[0];
   
   const dailyHours = parseFloat(studyConfig.dailyHours);
   const numberOfDays = parseInt(studyConfig.numberOfDays);

   // Parse syllabus content to get actual topics FIRST
   const topicLines = syllabusContent.split('\n').filter(line => line.trim() && !line.startsWith('   '));
   const allTopics = topicLines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(topic => topic.length > 0);

   const response = await fetch(TOGETHER_AI_API_URL, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${togetherAiKey}`,
       'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
       'X-Title': 'StudyHub-UnifiedPlanner'
     },
     body: JSON.stringify({
       model: "mistralai/Mistral-7B-Instruct-v0.2",
       messages: [
         { 
           role: "user", 
           content: `Create study plan JSON for ${examName}. Topics: ${syllabusContent.substring(0, 200)}. ${numberOfDays} days, ${dailyHours} hours each. Return only JSON starting with {` 
         }
       ],
       max_tokens: 1000,
       temperature: 0
     })
   });

   if (!response.ok) {
     const errorData = await response.json();
     throw new Error(`Together AI API error: ${errorData.error?.message || response.statusText}`);
   }

   const data = await response.json();
   
   if (!data.choices || !data.choices[0] || !data.choices[0].message) {
     throw new Error('Invalid response structure from Together AI API');
   }

   const responseContent = data.choices[0].message.content.trim();
   
   let studyPlan;
   try {
     // Try to extract JSON and clean it
     let jsonStr = responseContent.match(/\{[\s\S]*\}/)?.[0] || responseContent;
     jsonStr = jsonStr.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
     studyPlan = JSON.parse(jsonStr);
   } catch (parseError) {
     console.error('AI generated invalid JSON:', parseError);
     console.log('Raw AI response:', responseContent.substring(0, 500));
     
     // Create basic structure if parsing fails
     studyPlan = {
       title: `${examName} - ${paperName} Study Plan`,
       totalTopics: allTopics.length,
       totalEstimatedHours: numberOfDays * dailyHours,
       startDate: startDate,
       endDate: endDateStr,
       topics: [],
       schedule: []
     };
   }

   // Ensure all required fields exist
   studyPlan.title = studyPlan.title || `${examName} - ${paperName} Study Plan`;
   studyPlan.totalTopics = studyPlan.totalTopics || allTopics.length;
   studyPlan.totalEstimatedHours = studyPlan.totalEstimatedHours || (numberOfDays * dailyHours);
   studyPlan.startDate = startDate;
   studyPlan.endDate = endDateStr;
   studyPlan.topics = studyPlan.topics || [];

   // Always generate schedule with actual topics
   studyPlan.schedule = [];
   
   for (let i = 0; i < numberOfDays; i++) {
     const currentDate = new Date(startDate);
     currentDate.setDate(currentDate.getDate() + i);
     
     // Cycle through actual topics
     const topicIndex = i % allTopics.length;
     const currentTopic = allTopics[topicIndex] || `Study Session ${i + 1}`;
     
     studyPlan.schedule.push({
       date: currentDate.toISOString().split('T')[0],
       dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
       availableHours: dailyHours,
       topics: [{
         topicId: `topic_${i + 1}`,
         title: currentTopic,
         allocatedHours: dailyHours,
         focusAreas: [currentTopic.length > 30 ? currentTopic.substring(0, 30) + "..." : currentTopic],
         expectedOutcomes: [`Master: ${currentTopic.length > 25 ? currentTopic.substring(0, 25) + "..." : currentTopic}`]
       }]
     });
   }

   // Add metadata
   studyPlan.id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   studyPlan.progress = 0;
   studyPlan.lastUpdated = new Date().toISOString();
   studyPlan.examName = examName;
   studyPlan.paperName = paperName;

   return studyPlan;

 } catch (error) {
   console.error('Error generating AI study plan:', error);
   throw new Error(`Failed to generate study plan: ${error.message}`);
 }
};

// Calculate study statistics
const calculateStudyStats = (syllabusItems, userProgress) => {
 const completedTopics = userProgress.filter(p => p.completed).length;
 const totalHours = syllabusItems.reduce((sum, item) => sum + item.estimated_study_hours, 0);
 const hoursCompleted = userProgress
   .filter(p => p.completed)
   .reduce((sum, p) => {
     const syllabusItem = syllabusItems.find(s => 
       s.topic === p.topic && s.subtopic === p.subtopic
     );
     return sum + (syllabusItem?.estimated_study_hours || 0);
   }, 0);

 const topicsByPriority = {
   high: { total: 0, completed: 0 },
   medium: { total: 0, completed: 0 },
   low: { total: 0, completed: 0 }
 };

 syllabusItems.forEach(item => {
   const priority = item.priority_level.toLowerCase();
   if (topicsByPriority[priority]) {
     topicsByPriority[priority].total++;
     
     const isCompleted = userProgress.some(p => 
       p.topic === item.topic && 
       p.subtopic === item.subtopic && 
       p.completed
     );
     
     if (isCompleted) {
       topicsByPriority[priority].completed++;
     }
   }
 });

 return {
   total_topics: syllabusItems.length,
   completed_topics: completedTopics,
   total_hours: totalHours,
   hours_completed: hoursCompleted,
   completion_percentage: syllabusItems.length > 0 
     ? Math.round((completedTopics / syllabusItems.length) * 100) 
     : 0,
   topics_by_priority: topicsByPriority
 };
};

// Main unified study hub endpoint
router.post('/unified-study-hub', async (req, res) => {
 try {
   const { exam_name, paper_name, study_config, user_id } = req.body;
   
   // Validate required parameters
   if (!exam_name) {
     return res.status(400).json({
       success: false,
       error: 'exam_name is required'
     });
   }
   
   if (!study_config || !study_config.numberOfDays) {
     return res.status(400).json({
       success: false,
       error: 'study_config with numberOfDays is required'
     });
   }

   console.log(`Processing unified study hub request for: ${exam_name}${paper_name ? ` - ${paper_name}` : ''}`);

   // Fetch syllabus data from database
   let syllabusQuery = supabase
     .from('syllabus_data')
     .select('*')
     .eq('exam_name', exam_name);
   
   if (paper_name) {
     syllabusQuery = syllabusQuery.eq('paper_name', paper_name);
   }
   
   const { data: syllabusItems, error: syllabusError } = await syllabusQuery.order('topic').order('subtopic');
   
   if (syllabusError) {
     console.error('Error fetching syllabus data:', syllabusError);
     return res.status(500).json({
       success: false,
       error: 'Failed to fetch syllabus data from database'
     });
   }
   
   if (!syllabusItems || syllabusItems.length === 0) {
     return res.status(404).json({
       success: false,
       error: `No syllabus data found for ${exam_name}${paper_name ? ` - ${paper_name}` : ''}`
     });
   }

   // Fetch user progress if user_id provided
   let userProgress = [];
   if (user_id) {
     let progressQuery = supabase
       .from('user_progress')
       .select('*')
       .eq('user_id', user_id)
       .eq('exam_name', exam_name);
     
     if (paper_name) {
       progressQuery = progressQuery.eq('paper_name', paper_name);
     }
     
     const { data: progressData, error: progressError } = await progressQuery;
     
     if (progressError) {
       console.warn('Error fetching user progress:', progressError);
     } else {
       userProgress = progressData || [];
     }
   }

   // Build syllabus tree structure
   const syllabusTree = {
     exam_name: exam_name,
     paper_name: paper_name || '',
     topics: buildSyllabusTree(syllabusItems, userProgress)
   };

   // Format syllabus content for AI
   const formattedSyllabusContent = formatSyllabusForAI(syllabusItems);

   // Generate AI study plan
   const studyPlan = await generateAIStudyPlan(
     exam_name, 
     paper_name || '', 
     formattedSyllabusContent, 
     study_config
   );

   // Calculate study statistics
   const studyStats = calculateStudyStats(syllabusItems, userProgress);

   // Prepare unified response
   const response = {
     success: true,
     data: {
       syllabusTree: syllabusTree,
       studyPlan: studyPlan,
       userProgress: userProgress,
       studyStats: studyStats,
       examInfo: {
         exam_name: exam_name,
         paper_name: paper_name || '',
         total_topics: syllabusItems.length,
         total_hours: syllabusItems.reduce((sum, item) => sum + item.estimated_study_hours, 0)
       }
     }
   };

   console.log(`Successfully generated unified study hub response for ${exam_name}${paper_name ? ` - ${paper_name}` : ''}`);
   
   res.json(response);

 } catch (error) {
   console.error('Error in unified study hub endpoint:', error);
   res.status(500).json({
     success: false,
     error: error.message || 'Internal server error'
   });
 }
});

module.exports = router;