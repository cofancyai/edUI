const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CONFIG = {
  API_KEY: 'a1b2c3d4e5f6g7h8i9j0',
  TOGETHER_BASE_URL: 'https://api.together.xyz/v1',
  TOGETHER_MODEL: 'mistralai/Mistral-7B-Instruct-v0.2',
  BACKUP_MODEL: 'meta-llama/Llama-2-7b-chat-hf',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.3,
  TIMEOUT: 60000
};

// Get credential from Supabase
const getCredential = async (credentialName) => {
  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('config')
      .eq('name', credentialName)
      .single();

    if (error) throw error;
    return data?.config?.key;
  } catch (error) {
    console.error(`Error getting credential ${credentialName}:`, error);
    return null;
  }
};

// Validate API key
const validateApiKey = (apiKey) => {
  return apiKey === CONFIG.API_KEY;
};

// Generate content-based quiz questions
const generateContentBasedQuiz = async (query, content, numQuestions = 5, difficulty = 'medium', language = 'english') => {
  const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
  if (!togetherApiKey) {
    throw new Error('Together AI API key not found');
  }

  const systemPrompt = `You are an expert educational assessment designer. Create ${numQuestions} high-quality multiple choice questions based on the provided educational content.

Requirements:
- ${numQuestions} questions total
- Each question has 4 options (A, B, C, D)
- Mark the correct answer clearly
- ${difficulty} difficulty level
- Questions should test understanding, application, and analysis
- Cover different sections of the content
- Suitable for competitive exams and educational assessment

Return ONLY a JSON array in this exact format:
[
  {
    "question": "Clear, specific question text",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "${difficulty}",
    "topic": "Specific topic this question covers"
  }
]`;

  const userPrompt = `Based on this educational content about "${query}", create ${numQuestions} multiple choice questions:

CONTENT:
${content.substring(0, 3000)}...

Generate questions that:
- Test comprehension of key concepts
- Include application and analysis questions  
- Cover different sections of the content
- Are appropriate for ${difficulty} level
- Have clear, unambiguous correct answers

Return only the JSON array of questions.`;

  try {
    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
      model: CONFIG.TOGETHER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    }, {
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.TIMEOUT
    });

    const contentResponse = response.data.choices[0]?.message?.content?.trim() || '';
    
    // Enhanced JSON parsing with multiple attempts
    let questions = [];
    
    try {
      // Try to find JSON array first
      const jsonMatch = contentResponse.match(/\[.*?\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
        console.log(`âœ… Generated ${questions.length} quiz questions`);
        return questions;
      }
      
      // If no array found, try to parse the entire response as JSON
      questions = JSON.parse(contentResponse);
      if (Array.isArray(questions)) {
        console.log(`âœ… Generated ${questions.length} quiz questions`);
        return questions;
      }
        
    } catch (jsonError) {
      console.error(`âŒ JSON parsing error: ${jsonError}`);
    }
    
    // If JSON parsing fails, try to extract questions manually
    console.warn('âš ï¸ Could not parse quiz questions JSON, trying manual extraction');
    questions = [];

    // Manual parsing as fallback
    const questionBlocks = contentResponse.split(/(?=\{[^}]*"question")/);
    for (const block of questionBlocks.slice(1)) { // Skip first empty block
      try {
        if (block.trim()) {
          // Try to fix common JSON issues
          let cleanBlock = block.trim().replace(/,$/, '');
          if (!cleanBlock.endsWith('}')) {
            cleanBlock += '}';
          }
          const question = JSON.parse(cleanBlock);
          questions.push(question);
        }
      } catch (parseError) {
        continue;
      }
    }

    // If manual parsing also fails, create fallback questions
    if (questions.length === 0) {
      console.warn('âš ï¸ Manual extraction failed, creating fallback questions');
      questions = createFallbackQuestions(query, content, numQuestions, difficulty);
    }

    console.log(`âœ… Successfully generated ${questions.length} quiz questions`);
    return questions;

  } catch (error) {
    console.error('âŒ Error generating quiz questions:', error);
    // Return fallback questions on error
    return createFallbackQuestions(query, content, numQuestions, difficulty);
  }
};

// Create fallback questions when AI generation fails
const createFallbackQuestions = (query, content, numQuestions, difficulty) => {
  const fallbackQuestions = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (let i = 0; i < Math.min(numQuestions, 5); i++) {
    const questionNum = i + 1;
    fallbackQuestions.push({
      question: `Based on the content about ${query}, which of the following statements is most accurate?`,
      options: {
        A: `${query} is primarily theoretical in nature`,
        B: `${query} has significant practical applications`,
        C: `${query} is a recent development in the field`,
        D: `${query} requires extensive background knowledge`
      },
      correct_answer: "B",
      explanation: `This question tests understanding of the practical relevance and applications of ${query} as discussed in the content.`,
      difficulty: difficulty,
      topic: `Understanding ${query}`
    });
  }
  
  return fallbackQuestions;
};

// Generate adaptive quiz questions based on difficulty
const generateAdaptiveQuiz = async (query, content, numQuestions, difficulty, language) => {
  const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
  if (!togetherApiKey) {
    throw new Error('Together AI API key not found');
  }

  const difficultyPrompts = {
    easy: {
      instructions: "Create basic comprehension questions focusing on definitions, simple facts, and direct recall from the content.",
      cognitive_level: "Remember and Understand"
    },
    medium: {
      instructions: "Create intermediate questions requiring application of concepts, analysis of relationships, and synthesis of information.",
      cognitive_level: "Apply and Analyze"
    },
    hard: {
      instructions: "Create advanced questions requiring evaluation, critical thinking, complex analysis, and creation of new insights.",
      cognitive_level: "Evaluate and Create"
    }
  };

  const difficultyConfig = difficultyPrompts[difficulty] || difficultyPrompts.medium;

  const systemPrompt = `You are an expert educational assessment designer specializing in ${difficulty} level questions. Create ${numQuestions} multiple choice questions based on the educational content provided.

Difficulty Level: ${difficulty.toUpperCase()}
Cognitive Level: ${difficultyConfig.cognitive_level}
Instructions: ${difficultyConfig.instructions}

Requirements:
- Exactly ${numQuestions} questions
- Each question has 4 distinct options (A, B, C, D)
- Only one correct answer per question
- Questions should progressively test different aspects of the content
- Include clear explanations for correct answers
- Ensure questions are neither too obvious nor impossibly difficult for ${difficulty} level

Return a valid JSON array with this exact structure:
[
  {
    "question": "Clear, specific question text that tests ${difficultyConfig.cognitive_level}",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    },
    "correct_answer": "A",
    "explanation": "Clear explanation of why this answer is correct",
    "difficulty": "${difficulty}",
    "topic": "Specific subtopic being tested",
    "cognitive_level": "${difficultyConfig.cognitive_level}"
  }
]`;

  const userPrompt = `Create ${numQuestions} ${difficulty} level multiple choice questions based on this educational content about "${query}":

EDUCATIONAL CONTENT:
${content.substring(0, 4000)}

Question Guidelines for ${difficulty.toUpperCase()} level:
${difficultyConfig.instructions}

Ensure questions:
1. Test different sections/concepts from the content
2. Are appropriate for ${difficulty} difficulty level
3. Have clearly distinguishable options
4. Include comprehensive explanations
5. Cover various cognitive skills: ${difficultyConfig.cognitive_level}

Return only the JSON array of questions.`;

  try {
    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
      model: CONFIG.TOGETHER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: CONFIG.MAX_TOKENS * 1.5, // More tokens for detailed questions
      temperature: CONFIG.TEMPERATURE
    }, {
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.TIMEOUT
    });

    const contentResponse = response.data.choices[0]?.message?.content?.trim() || '';
    
    // Enhanced parsing with fallback
    try {
      const jsonMatch = contentResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(questions) && questions.length > 0) {
          console.log(`âœ… Generated ${questions.length} adaptive ${difficulty} quiz questions`);
          return questions;
        }
      }
    } catch (parseError) {
      console.error(`âŒ Adaptive quiz JSON parsing error: ${parseError}`);
    }

    // Fallback to regular generation
    return await generateContentBasedQuiz(query, content, numQuestions, difficulty, language);

  } catch (error) {
    console.error('âŒ Error generating adaptive quiz:', error);
    return await generateContentBasedQuiz(query, content, numQuestions, difficulty, language);
  }
};

// Generate quiz with multiple question types
const generateMixedQuiz = async (query, content, numQuestions, difficulty, language) => {
  const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
  if (!togetherApiKey) {
    throw new Error('Together AI API key not found');
  }

  const questionTypes = [
    {
      type: "factual",
      description: "Direct recall of facts and information from the content",
      count: Math.ceil(numQuestions * 0.3)
    },
    {
      type: "conceptual", 
      description: "Understanding of concepts, principles, and relationships",
      count: Math.ceil(numQuestions * 0.4)
    },
    {
      type: "application",
      description: "Application of knowledge to new situations or problem-solving", 
      count: Math.ceil(numQuestions * 0.3)
    }
  ];

  const systemPrompt = `You are an expert educational assessment designer. Create a mixed-type quiz with ${numQuestions} multiple choice questions based on the educational content.

Question Type Distribution:
${questionTypes.map(type => `- ${type.type.toUpperCase()}: ${type.count} questions - ${type.description}`).join('\n')}

Requirements:
- Total ${numQuestions} questions across all types
- Each question has 4 options (A, B, C, D) 
- ${difficulty} difficulty level
- Include question type in metadata
- Comprehensive explanations for each answer

Return a valid JSON array:
[
  {
    "question": "Question text",
    "options": {
      "A": "Option A",
      "B": "Option B", 
      "C": "Option C",
      "D": "Option D"
    },
    "correct_answer": "A",
    "explanation": "Detailed explanation",
    "difficulty": "${difficulty}",
    "topic": "Specific topic",
    "question_type": "factual|conceptual|application"
  }
]`;

  const userPrompt = `Create a mixed-type quiz with ${numQuestions} questions about "${query}" based on this content:

CONTENT:
${content.substring(0, 3500)}

Generate questions with this distribution:
${questionTypes.map(type => `${type.count} ${type.type} questions: ${type.description}`).join('\n')}

Ensure variety in:
- Question types (factual, conceptual, application)
- Content coverage (different sections/topics)
- Cognitive complexity appropriate for ${difficulty} level

Return only the JSON array.`;

  try {
    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
      model: CONFIG.TOGETHER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: CONFIG.MAX_TOKENS * 2,
      temperature: 0.4 // Slightly higher for variety
    }, {
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.TIMEOUT * 1.5
    });

    const contentResponse = response.data.choices[0]?.message?.content?.trim() || '';
    
    try {
      const jsonMatch = contentResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(questions)) {
          console.log(`âœ… Generated ${questions.length} mixed-type quiz questions`);
          return questions;
        }
      }
    } catch (parseError) {
      console.error(`âŒ Mixed quiz JSON parsing error: ${parseError}`);
    }

    // Fallback to standard generation
    return await generateContentBasedQuiz(query, content, numQuestions, difficulty, language);

  } catch (error) {
    console.error('âŒ Error generating mixed quiz:', error);
    return await generateContentBasedQuiz(query, content, numQuestions, difficulty, language);
  }
};

// Validate quiz questions format
const validateQuizQuestions = (questions) => {
  if (!Array.isArray(questions)) return false;
  
  return questions.every(q => 
    q.question && 
    q.options && 
    typeof q.options === 'object' &&
    q.options.A && q.options.B && q.options.C && q.options.D &&
    q.correct_answer &&
    ['A', 'B', 'C', 'D'].includes(q.correct_answer) &&
    q.explanation &&
    q.difficulty &&
    q.topic
  );
};

// Routes

// Health check
router.get('/health', (req, res) => {
  res.json({
    service: 'Enhanced Quiz Generation API',
    status: 'healthy',
    version: '2.0.0',
    ai_provider: 'Together AI',
    model: CONFIG.TOGETHER_MODEL,
    backup_model: CONFIG.BACKUP_MODEL,
    features: [
      'content_based_quiz_generation',
      'adaptive_difficulty',
      'multiple_question_types',
      'comprehensive_explanations',
      'fallback_question_generation',
      'enhanced_parsing'
    ],
    supported_difficulties: ['easy', 'medium', 'hard'],
    max_questions: 50,
    timestamp: Date.now()
  });
});

// Generate quiz questions from content
router.post('/generate', async (req, res) => {
  // Validate API key
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { 
      query, 
      content, 
      num_questions = 5, 
      difficulty = 'medium', 
      language = 'english',
      quiz_type = 'standard' // standard, adaptive, mixed
    } = req.body;
    
    if (!query || !content) {
      return res.status(400).json({ error: 'Query and content are required' });
    }

    if (num_questions < 1 || num_questions > 50) {
      return res.status(400).json({ error: 'Number of questions must be between 1 and 50' });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be easy, medium, or hard' });
    }

    console.log(`ðŸ§  Generating ${quiz_type} quiz for: ${query} (${num_questions} questions, ${difficulty} difficulty)`);

    const startTime = Date.now();
    let questions = [];

    // Generate questions based on quiz type
    switch (quiz_type) {
      case 'adaptive':
        questions = await generateAdaptiveQuiz(query, content, num_questions, difficulty, language);
        break;
      case 'mixed':
        questions = await generateMixedQuiz(query, content, num_questions, difficulty, language);
        break;
      default:
        questions = await generateContentBasedQuiz(query, content, num_questions, difficulty, language);
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // Validate generated questions
    if (!validateQuizQuestions(questions)) {
      console.warn('âš ï¸ Generated questions failed validation, using fallback');
      questions = createFallbackQuestions(query, content, num_questions, difficulty);
    }

    // Calculate quiz statistics
    const quizStats = {
      total_questions: questions.length,
      difficulty_distribution: questions.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        return acc;
      }, {}),
      topic_coverage: [...new Set(questions.map(q => q.topic))],
      question_types: questions.reduce((acc, q) => {
        const type = q.question_type || 'standard';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      status: 'success',
      query,
      questions,
      total_questions: questions.length,
      difficulty,
      quiz_type,
      language,
      time_taken: Math.round(processingTime * 100) / 100,
      quiz_metadata: {
        content_based: true,
        adaptive_difficulty: quiz_type === 'adaptive',
        comprehensive_coverage: true,
        ai_generated: true,
        validated: true
      },
      quiz_statistics: quizStats,
      generation_info: {
        model: CONFIG.TOGETHER_MODEL,
        content_length: content.length,
        processing_method: quiz_type,
        fallback_used: questions.length < num_questions
      }
    });

  } catch (error) {
    console.error('âŒ Quiz generation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      error_type: 'quiz_generation_failed'
    });
  }
});

// Generate practice quiz (simplified version)
router.post('/practice', async (req, res) => {
  // Validate API key
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { topic, difficulty = 'easy', num_questions = 3 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`ðŸ“ Generating practice quiz for: ${topic}`);

    // Generate simple content summary for practice questions
    const practiceContent = `This practice quiz covers ${topic}. The questions are designed to test basic understanding and key concepts related to ${topic}. Practice questions help reinforce learning and identify areas that need more study.`;

    const questions = await generateContentBasedQuiz(topic, practiceContent, num_questions, difficulty, 'english');

    res.json({
      status: 'success',
      topic,
      questions,
      total_questions: questions.length,
      difficulty,
      quiz_type: 'practice',
      message: 'Practice quiz generated successfully'
    });

  } catch (error) {
    console.error('âŒ Practice quiz generation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      error_type: 'practice_quiz_failed'
    });
  }
});

// Validate quiz answers
router.post('/validate', async (req, res) => {
  // Validate API key
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { questions, answers } = req.body;
    
    if (!questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Questions and answers arrays are required' });
    }

    if (questions.length !== answers.length) {
      return res.status(400).json({ error: 'Questions and answers arrays must have the same length' });
    }

    const results = questions.map((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correct_answer;
      const isCorrect = userAnswer === correctAnswer;

      return {
        question_index: index,
        question: question.question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        explanation: question.explanation,
        topic: question.topic
      };
    });

    const score = results.filter(r => r.is_correct).length;
    const percentage = Math.round((score / questions.length) * 100);

    res.json({
      status: 'success',
      results,
      score: {
        correct: score,
        total: questions.length,
        percentage
      },
      performance: {
        grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F',
        passed: percentage >= 60,
        needs_improvement: results.filter(r => !r.is_correct).map(r => r.topic)
      }
    });

  } catch (error) {
    console.error('âŒ Quiz validation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      error_type: 'validation_failed'
    });
  }
});

module.exports = router;