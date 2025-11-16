const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Use the same Supabase configuration as server.js
const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Cloud API URLs
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const TEXT_TO_SPEECH_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const SPEECH_TO_TEXT_URL = 'https://speech.googleapis.com/v1/speech:recognize';

// UPSC Subject configurations
const UPSC_SUBJECTS = {
  'history': {
    name: 'History',
    topics: ['Ancient India', 'Medieval India', 'Modern India', 'World History', 'Art & Culture'],
    weightage: { foundation: 30, intermediate: 40, advanced: 30 }
  },
  'geography': {
    name: 'Geography',
    topics: ['Physical Geography', 'Human Geography', 'Economic Geography', 'Environmental Geography', 'Regional Geography'],
    weightage: { foundation: 25, intermediate: 45, advanced: 30 }
  },
  'polity': {
    name: 'Polity & Governance',
    topics: ['Constitution', 'Parliament', 'Executive', 'Judiciary', 'Federalism', 'Local Government'],
    weightage: { foundation: 20, intermediate: 50, advanced: 30 }
  },
  'economy': {
    name: 'Economy',
    topics: ['Basic Concepts', 'Indian Economy', 'World Economy', 'Economic Survey', 'Budget', 'Banking'],
    weightage: { foundation: 15, intermediate: 45, advanced: 40 }
  },
  'science': {
    name: 'Science & Technology',
    topics: ['Physics', 'Chemistry', 'Biology', 'Space Technology', 'Nuclear Technology', 'Biotechnology'],
    weightage: { foundation: 35, intermediate: 40, advanced: 25 }
  },
  'current_affairs': {
    name: 'Current Affairs',
    topics: ['National Issues', 'International Relations', 'Government Schemes', 'Awards & Honours', 'Sports', 'Environment'],
    weightage: { foundation: 20, intermediate: 50, advanced: 30 }
  }
};

// Difficulty level configurations
const DIFFICULTY_LEVELS = {
  'foundation': {
    name: 'Foundation',
    description: 'Basic concepts and fundamental understanding',
    time_limit: 180, // 3 minutes
    evaluation_criteria: ['factual_accuracy', 'basic_understanding', 'clarity']
  },
  'intermediate': {
    name: 'Intermediate',
    description: 'Application of concepts with analytical thinking',
    time_limit: 240, // 4 minutes
    evaluation_criteria: ['factual_accuracy', 'analytical_thinking', 'examples', 'structure']
  },
  'advanced': {
    name: 'Advanced',
    description: 'Complex analysis with multidimensional perspective',
    time_limit: 300, // 5 minutes
    evaluation_criteria: ['comprehensive_analysis', 'critical_thinking', 'examples', 'balanced_view', 'conclusion']
  }
};

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

// Validate input parameters
const validateSessionInput = (data) => {
  const { user_id, subject, difficulty, session_type } = data;
  
  if (!user_id || typeof user_id !== 'string') {
    throw new Error('user_id is required and must be a string');
  }
  
  if (!subject || !UPSC_SUBJECTS[subject]) {
    throw new Error(`Invalid subject. Must be one of: ${Object.keys(UPSC_SUBJECTS).join(', ')}`);
  }
  
  if (!difficulty || !DIFFICULTY_LEVELS[difficulty]) {
    throw new Error(`Invalid difficulty. Must be one of: ${Object.keys(DIFFICULTY_LEVELS).join(', ')}`);
  }
  
  if (!session_type || !['practice', 'mock_test', 'targeted'].includes(session_type)) {
    throw new Error('session_type must be one of: practice, mock_test, targeted');
  }
  
  return true;
};

const validateQuestionInput = (data) => {
  const { session_id, question_number } = data;
  
  if (!session_id || typeof session_id !== 'string') {
    throw new Error('session_id is required and must be a string');
  }
  
  if (!question_number || !Number.isInteger(question_number) || question_number < 1) {
    throw new Error('question_number is required and must be a positive integer');
  }
  
  return true;
};

const validateAnswerInput = (data) => {
  const { session_id, question_id, audio_response_base64 } = data;
  
  if (!session_id || typeof session_id !== 'string') {
    throw new Error('session_id is required and must be a string');
  }
  
  if (!question_id || typeof question_id !== 'string') {
    throw new Error('question_id is required and must be a string');
  }
  
  if (!audio_response_base64 || typeof audio_response_base64 !== 'string') {
    throw new Error('audio_response_base64 is required and must be a string');
  }
  
  return true;
};

// Generate UPSC questions using Gemini API
const generateUPSCQuestion = async (subject, difficulty, questionNumber, previousQuestions = []) => {
  try {
    const geminiApiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
    const subjectConfig = UPSC_SUBJECTS[subject];
    const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
    
    const previousQuestionsText = previousQuestions.length > 0 
      ? `\n\nPrevious questions asked in this session (avoid repetition):\n${previousQuestions.map(q => `- ${q.question_text}`).join('\n')}`
      : '';
    
    const prompt = `Generate a UPSC Civil Services ${difficultyConfig.name} level question for ${subjectConfig.name}.

Subject Topics: ${subjectConfig.topics.join(', ')}
Difficulty: ${difficultyConfig.description}
Question Number: ${questionNumber}
Time Limit: ${difficultyConfig.time_limit} seconds

Requirements:
- Create a thought-provoking question suitable for UPSC interview
- Question should test ${difficultyConfig.evaluation_criteria.join(', ')}
- Make it relevant to current context where applicable
- Ensure proper depth for ${difficulty} level
- Question should encourage structured response
${previousQuestionsText}

Return only a well-structured question (no additional text or formatting).`;

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 200
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const questionText = data.candidates[0].content.parts[0].text.trim();
    
    return {
      question_text: questionText,
      subject: subject,
      difficulty: difficulty,
      time_limit: difficultyConfig.time_limit,
      evaluation_criteria: difficultyConfig.evaluation_criteria,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating UPSC question:', error);
    throw new Error(`Failed to generate question: ${error.message}`);
  }
};

// Convert text to speech using Google Cloud TTS
const convertTextToSpeech = async (text, languageCode = 'en-IN') => {
  try {
    const ttsApiKey = await getCredential('GOOGLE_CLOUD_TTS_API_KEY');
    
    const response = await fetch(`${TEXT_TO_SPEECH_URL}?key=${ttsApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text: text },
        voice: {
          languageCode: languageCode,
          name: languageCode === 'en-IN' ? 'en-IN-Wavenet-A' : 'en-US-Wavenet-D',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9,
          pitch: 0,
          volumeGainDb: 0
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`TTS API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('No audio content received from TTS API');
    }

    return data.audioContent; // Base64 encoded audio

  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
};

// Convert speech to text using Google Cloud STT
const convertSpeechToText = async (audioBase64, languageCode = 'en-IN') => {
  try {
    const sttApiKey = await getCredential('GOOGLE_CLOUD_STT_API_KEY');
    
    const response = await fetch(`${SPEECH_TO_TEXT_URL}?key=${sttApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: languageCode,
          alternativeLanguageCodes: ['en-US', 'hi-IN'],
          maxAlternatives: 3,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: 'latest_long'
        },
        audio: {
          content: audioBase64
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`STT API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return {
        transcript: '',
        confidence: 0,
        alternatives: []
      };
    }

    const result = data.results[0];
    const alternatives = result.alternatives || [];
    
    return {
      transcript: alternatives[0]?.transcript || '',
      confidence: alternatives[0]?.confidence || 0,
      alternatives: alternatives.slice(1).map(alt => ({
        transcript: alt.transcript,
        confidence: alt.confidence
      }))
    };

  } catch (error) {
    console.error('Error converting speech to text:', error);
    throw new Error(`Failed to convert speech to text: ${error.message}`);
  }
};

// Evaluate answer using Gemini API
const evaluateAnswer = async (question, answer, subject, difficulty) => {
  try {
    const geminiApiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
    const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
    
    const prompt = `Evaluate this UPSC interview answer as an expert examiner:

QUESTION: ${question}
ANSWER: ${answer}
SUBJECT: ${UPSC_SUBJECTS[subject].name}
DIFFICULTY: ${difficultyConfig.name}

EVALUATION CRITERIA: ${difficultyConfig.evaluation_criteria.join(', ')}

Provide evaluation in this JSON format:
{
  "overall_score": 0-10,
  "detailed_scores": {
    ${difficultyConfig.evaluation_criteria.map(criteria => `"${criteria}": 0-10`).join(',\n    ')}
  },
  "strengths": ["list of strengths"],
  "weaknesses": ["list of areas for improvement"],
  "suggestions": ["specific improvement suggestions"],
  "follow_up_questions": ["2-3 follow-up questions based on the answer"],
  "benchmark_comparison": "comparison with expected UPSC standard",
  "improvement_tips": ["actionable tips for better performance"]
}

Be constructive, specific, and aligned with UPSC interview standards.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const evaluationText = data.candidates[0].content.parts[0].text.trim();
    
    let evaluation;
    try {
      // Extract JSON from response
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in evaluation response');
      }
      
      evaluation = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', parseError);
      console.log('Raw evaluation response:', evaluationText);
      
      // Create fallback evaluation
      evaluation = {
        overall_score: 5,
        detailed_scores: {},
        strengths: ['Answer provided shows basic understanding'],
        weaknesses: ['Could provide more detailed analysis'],
        suggestions: ['Try to structure your answer better', 'Include more examples'],
        follow_up_questions: ['Can you elaborate on this point?'],
        benchmark_comparison: 'Average performance for this level',
        improvement_tips: ['Practice more structured responses']
      };
      
      // Add detailed scores based on criteria
      difficultyConfig.evaluation_criteria.forEach(criteria => {
        evaluation.detailed_scores[criteria] = 5;
      });
    }

    return evaluation;

  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
};

// Calculate session statistics
const calculateSessionStats = (responses) => {
  if (!responses || responses.length === 0) {
    return {
      total_questions: 0,
      answered_questions: 0,
      average_score: 0,
      total_time_spent: 0,
      performance_by_criteria: {},
      completion_rate: 0
    };
  }

  const totalQuestions = responses.length;
  const answeredQuestions = responses.filter(r => r.transcribed_text && r.transcribed_text.trim()).length;
  
  const scores = responses
    .filter(r => r.evaluation && r.evaluation.overall_score)
    .map(r => r.evaluation.overall_score);
  
  const averageScore = scores.length > 0 
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : 0;

  const totalTimeSpent = responses.reduce((sum, r) => {
    return sum + (r.response_time || 0);
  }, 0);

  // Aggregate performance by criteria
  const criteriaScores = {};
  responses.forEach(response => {
    if (response.evaluation && response.evaluation.detailed_scores) {
      Object.entries(response.evaluation.detailed_scores).forEach(([criteria, score]) => {
        if (!criteriaScores[criteria]) {
          criteriaScores[criteria] = [];
        }
        criteriaScores[criteria].push(score);
      });
    }
  });

  const performanceByCriteria = {};
  Object.entries(criteriaScores).forEach(([criteria, scores]) => {
    performanceByCriteria[criteria] = {
      average: Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10,
      count: scores.length
    };
  });

  return {
    total_questions: totalQuestions,
    answered_questions: answeredQuestions,
    average_score: averageScore,
    total_time_spent: Math.round(totalTimeSpent),
    performance_by_criteria: performanceByCriteria,
    completion_rate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  };
};

// START SESSION ENDPOINT
router.post('/start-session', async (req, res) => {
  try {
    validateSessionInput(req.body);
    const { user_id, subject, difficulty, session_type } = req.body;
    
    console.log(`Starting mock interview session for user: ${user_id}, subject: ${subject}, difficulty: ${difficulty}`);

    // Create new session in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .insert({
        session_id: sessionId,
        user_id: user_id,
        subject: subject,
        difficulty: difficulty,
        session_type: session_type,
        status: 'active',
        started_at: new Date().toISOString(),
        current_question_number: 1
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error('Failed to create interview session');
    }

    // Generate first question
    const firstQuestion = await generateUPSCQuestion(subject, difficulty, 1);
    
    // Store question in database
    const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: questionError } = await supabase
      .from('mock_interview_questions')
      .insert({
        question_id: questionId,
        session_id: sessionId,
        question_number: 1,
        question_text: firstQuestion.question_text,
        subject: subject,
        difficulty: difficulty,
        time_limit: firstQuestion.time_limit,
        evaluation_criteria: firstQuestion.evaluation_criteria,
        generated_at: firstQuestion.generated_at
      });

    if (questionError) {
      console.error('Error storing question:', questionError);
      throw new Error('Failed to store question');
    }

    // Convert question to audio
    let audioBase64 = null;
    try {
      audioBase64 = await convertTextToSpeech(firstQuestion.question_text);
    } catch (audioError) {
      console.warn('Failed to generate audio for question:', audioError.message);
      // Continue without audio - this is not a blocking error
    }

    const welcomeMessage = `Welcome to your ${UPSC_SUBJECTS[subject].name} mock interview at ${DIFFICULTY_LEVELS[difficulty].name} level. You have ${DIFFICULTY_LEVELS[difficulty].time_limit} seconds per question. Let's begin with your first question.`;

    const response = {
      success: true,
      data: {
        session_id: sessionId,
        welcome_message: welcomeMessage,
        first_question: {
          question_id: questionId,
          question_text: firstQuestion.question_text,
          audio_base64: audioBase64,
          time_limit: firstQuestion.time_limit,
          question_number: 1
        },
        session_info: {
          subject: UPSC_SUBJECTS[subject].name,
          difficulty: DIFFICULTY_LEVELS[difficulty].name,
          session_type: session_type,
          evaluation_criteria: firstQuestion.evaluation_criteria
        }
      }
    };

    console.log(`Successfully started mock interview session: ${sessionId}`);
    res.json(response);

  } catch (error) {
    console.error('Error in start-session endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start interview session'
    });
  }
});

// GET QUESTION ENDPOINT
router.post('/get-question', async (req, res) => {
  try {
    validateQuestionInput(req.body);
    const { session_id, question_number } = req.body;
    
    console.log(`Getting question ${question_number} for session: ${session_id}`);

    // Fetch session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !sessionData) {
      throw new Error('Session not found');
    }

    if (sessionData.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Check if question already exists
    let { data: existingQuestion, error: questionFetchError } = await supabase
      .from('mock_interview_questions')
      .select('*')
      .eq('session_id', session_id)
      .eq('question_number', question_number)
      .single();

    let questionData;

    if (questionFetchError || !existingQuestion) {
      // Generate new question
      console.log(`Generating new question ${question_number} for session ${session_id}`);
      
      // Get previous questions to avoid repetition
      const { data: previousQuestions } = await supabase
        .from('mock_interview_questions')
        .select('question_text')
        .eq('session_id', session_id)
        .lt('question_number', question_number);

      const newQuestion = await generateUPSCQuestion(
        sessionData.subject, 
        sessionData.difficulty, 
        question_number,
        previousQuestions || []
      );
      
      const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: insertedQuestion, error: insertError } = await supabase
        .from('mock_interview_questions')
        .insert({
          question_id: questionId,
          session_id: session_id,
          question_number: question_number,
          question_text: newQuestion.question_text,
          subject: sessionData.subject,
          difficulty: sessionData.difficulty,
          time_limit: newQuestion.time_limit,
          evaluation_criteria: newQuestion.evaluation_criteria,
          generated_at: newQuestion.generated_at
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Failed to store new question');
      }

      questionData = insertedQuestion;
    } else {
      questionData = existingQuestion;
    }

    // Convert question to audio
    let audioBase64 = null;
    try {
      audioBase64 = await convertTextToSpeech(questionData.question_text);
    } catch (audioError) {
      console.warn('Failed to generate audio for question:', audioError.message);
    }

    // Update session current question number
    await supabase
      .from('mock_interview_sessions')
      .update({ 
        current_question_number: question_number,
        last_activity_at: new Date().toISOString()
      })
      .eq('session_id', session_id);

    const response = {
      success: true,
      data: {
        question_id: questionData.question_id,
        question_text: questionData.question_text,
        audio_base64: audioBase64,
        time_limit: questionData.time_limit,
        question_number: question_number,
        evaluation_criteria: questionData.evaluation_criteria
      }
    };

    console.log(`Successfully retrieved question ${question_number} for session ${session_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in get-question endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get question'
    });
  }
});

// SUBMIT ANSWER ENDPOINT
router.post('/submit-answer', async (req, res) => {
  try {
    validateAnswerInput(req.body);
    const { session_id, question_id, audio_response_base64 } = req.body;
    
    console.log(`Processing answer submission for question: ${question_id}`);

    // Verify session and question exist
    const { data: questionData, error: questionError } = await supabase
      .from('mock_interview_questions')
      .select('*, mock_interview_sessions(*)')
      .eq('question_id', question_id)
      .single();

    if (questionError || !questionData) {
      throw new Error('Question not found');
    }

    if (questionData.mock_interview_sessions.session_id !== session_id) {
      throw new Error('Question does not belong to this session');
    }

    // Convert speech to text
    console.log('Converting speech to text...');
    const transcriptionResult = await convertSpeechToText(audio_response_base64);
    
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store response in database
    const { data: responseData, error: responseError } = await supabase
      .from('mock_interview_responses')
      .insert({
        response_id: responseId,
        session_id: session_id,
        question_id: question_id,
        audio_response_base64: audio_response_base64,
        transcribed_text: transcriptionResult.transcript,
        transcription_confidence: transcriptionResult.confidence,
        transcription_alternatives: transcriptionResult.alternatives,
        submitted_at: new Date().toISOString(),
        processing_status: 'completed'
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error storing response:', responseError);
      throw new Error('Failed to store response');
    }

    // Update session last activity
    await supabase
      .from('mock_interview_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_id', session_id);

    const response = {
      success: true,
      data: {
        response_id: responseId,
        transcribed_text: transcriptionResult.transcript,
        transcription_confidence: transcriptionResult.confidence,
        processing_status: 'completed',
        alternatives: transcriptionResult.alternatives
      }
    };

    console.log(`Successfully processed answer submission for question: ${question_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in submit-answer endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process answer'
    });
  }
});

// GET FEEDBACK ENDPOINT
router.post('/get-feedback', async (req, res) => {
  try {
    const { session_id, question_id, response_id } = req.body;
    
    if (!session_id || !question_id || !response_id) {
      throw new Error('session_id, question_id, and response_id are required');
    }
    
    console.log(`Generating feedback for response: ${response_id}`);

    // Fetch response and question data
    const { data: responseData, error: responseError } = await supabase
      .from('mock_interview_responses')
      .select(`
        *,
        mock_interview_questions(*),
        mock_interview_sessions(*)
      `)
      .eq('response_id', response_id)
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .single();

    if (responseError || !responseData) {
      throw new Error('Response not found');
    }

    // Check if evaluation already exists
    if (responseData.evaluation && Object.keys(responseData.evaluation).length > 0) {
      console.log('Using existing evaluation for response:', response_id);
      
      const response = {
        success: true,
        data: {
          response_id: response_id,
          evaluation: responseData.evaluation,
          transcribed_text: responseData.transcribed_text,
          question_text: responseData.mock_interview_questions.question_text,
          cached: true
        }
      };
      
      return res.json(response);
    }

    // Generate new evaluation
    console.log('Generating new evaluation...');
    const evaluation = await evaluateAnswer(
      responseData.mock_interview_questions.question_text,
      responseData.transcribed_text,
      responseData.mock_interview_sessions.subject,
      responseData.mock_interview_sessions.difficulty
    );

    // Update response with evaluation
    const { error: updateError } = await supabase
      .from('mock_interview_responses')
      .update({
        evaluation: evaluation,
        evaluated_at: new Date().toISOString()
      })
      .eq('response_id', response_id);

    if (updateError) {
      console.error('Error updating response with evaluation:', updateError);
      throw new Error('Failed to store evaluation');
    }

    // Determine next question info
    const currentQuestionNumber = responseData.mock_interview_questions.question_number;
    const nextQuestionNumber = currentQuestionNumber + 1;
    
    let nextQuestionInfo = null;
    if (responseData.mock_interview_sessions.session_type === 'practice' || nextQuestionNumber <= 10) {
      nextQuestionInfo = {
        available: true,
        question_number: nextQuestionNumber,
        message: `Ready for question ${nextQuestionNumber}?`
      };
    } else {
      nextQuestionInfo = {
        available: false,
        message: 'Session completed. Great job!'
      };
    }

    const response = {
      success: true,
      data: {
        response_id: response_id,
        evaluation: evaluation,
        transcribed_text: responseData.transcribed_text,
        question_text: responseData.mock_interview_questions.question_text,
        next_question: nextQuestionInfo,
        cached: false
      }
    };

    console.log(`Successfully generated feedback for response: ${response_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in get-feedback endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate feedback'
    });
  }
});

// SESSION HISTORY ENDPOINT
router.get('/session-history/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 20, offset = 0, subject, difficulty } = req.query;
    
    if (!user_id) {
      throw new Error('user_id is required');
    }
    
    console.log(`Fetching session history for user: ${user_id}`);

    // Build query with optional filters
    let query = supabase
      .from('mock_interview_sessions')
      .select(`
        *,
        mock_interview_questions(count),
        mock_interview_responses(count)
      `)
      .eq('user_id', user_id)
      .order('started_at', { ascending: false });

    if (subject) {
      query = query.eq('subject', subject);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Error fetching session history:', sessionsError);
      throw new Error('Failed to fetch session history');
    }

    // Get detailed stats for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        // Get responses for this session
        const { data: responses } = await supabase
          .from('mock_interview_responses')
          .select('*')
          .eq('session_id', session.session_id);

        const stats = calculateSessionStats(responses || []);
        
        return {
          ...session,
          stats: stats,
          subject_name: UPSC_SUBJECTS[session.subject]?.name || session.subject,
          difficulty_name: DIFFICULTY_LEVELS[session.difficulty]?.name || session.difficulty
        };
      })
    );

    // Calculate overall user statistics
    const allResponses = await Promise.all(
      sessions.map(async (session) => {
        const { data: responses } = await supabase
          .from('mock_interview_responses')
          .select('*')
          .eq('session_id', session.session_id);
        return responses || [];
      })
    );

    const flatResponses = allResponses.flat();
    const overallStats = calculateSessionStats(flatResponses);

    // Get subject-wise performance
    const subjectPerformance = {};
    sessions.forEach(session => {
      const subject = session.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          name: UPSC_SUBJECTS[subject]?.name || subject,
          sessions: 0,
          total_questions: 0,
          average_score: 0,
          scores: []
        };
      }
      subjectPerformance[subject].sessions++;
    });

    // Calculate average scores per subject
    for (const [subject, data] of Object.entries(subjectPerformance)) {
      const subjectResponses = flatResponses.filter(r => 
        sessions.find(s => s.session_id === r.session_id)?.subject === subject
      );
      
      const scores = subjectResponses
        .filter(r => r.evaluation?.overall_score)
        .map(r => r.evaluation.overall_score);
      
      data.total_questions = subjectResponses.length;
      data.average_score = scores.length > 0 
        ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
        : 0;
      data.scores = scores;
    }

    const response = {
      success: true,
      data: {
        sessions: sessionsWithStats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: sessions.length
        },
        overall_stats: overallStats,
        subject_performance: subjectPerformance,
        user_id: user_id
      }
    };

    console.log(`Successfully retrieved session history for user: ${user_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in session-history endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch session history'
    });
  }
});

// END SESSION ENDPOINT
router.post('/end-session', async (req, res) => {
  try {
    const { session_id, user_id } = req.body;
    
    if (!session_id || !user_id) {
      throw new Error('session_id and user_id are required');
    }
    
    console.log(`Ending session: ${session_id} for user: ${user_id}`);

    // Verify session belongs to user
    const { data: sessionData, error: sessionError } = await supabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user_id)
      .single();

    if (sessionError || !sessionData) {
      throw new Error('Session not found or does not belong to user');
    }

    if (sessionData.status === 'completed') {
      throw new Error('Session is already completed');
    }

    // Get all responses for final statistics
    const { data: responses } = await supabase
      .from('mock_interview_responses')
      .select('*')
      .eq('session_id', session_id);

    const finalStats = calculateSessionStats(responses || []);

    // Update session status
    const { error: updateError } = await supabase
      .from('mock_interview_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        final_stats: finalStats
      })
      .eq('session_id', session_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      throw new Error('Failed to end session');
    }

    const response = {
      success: true,
      data: {
        session_id: session_id,
        final_stats: finalStats,
        message: 'Session completed successfully',
        recommendations: {
          continue_practice: finalStats.average_score < 7,
          focus_areas: Object.entries(finalStats.performance_by_criteria)
            .filter(([_, data]) => data.average < 6)
            .map(([criteria, _]) => criteria),
          next_difficulty: finalStats.average_score > 8 ? 'higher' : 'same'
        }
      }
    };

    console.log(`Successfully ended session: ${session_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in end-session endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end session'
    });
  }
});

// GET SESSION DETAILS ENDPOINT
router.get('/session/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { user_id } = req.query;
    
    if (!session_id) {
      throw new Error('session_id is required');
    }
    
    console.log(`Fetching session details for: ${session_id}`);

    // Build query
    let query = supabase
      .from('mock_interview_sessions')
      .select(`
        *,
        mock_interview_questions(*),
        mock_interview_responses(*)
      `)
      .eq('session_id', session_id);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: sessionData, error: sessionError } = await query.single();

    if (sessionError || !sessionData) {
      throw new Error('Session not found');
    }

    // Sort questions and responses by number/time
    sessionData.mock_interview_questions.sort((a, b) => a.question_number - b.question_number);
    sessionData.mock_interview_responses.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));

    // Calculate session statistics
    const stats = calculateSessionStats(sessionData.mock_interview_responses);

    // Enhance session data
    const enhancedSession = {
      ...sessionData,
      subject_name: UPSC_SUBJECTS[sessionData.subject]?.name || sessionData.subject,
      difficulty_name: DIFFICULTY_LEVELS[sessionData.difficulty]?.name || sessionData.difficulty,
      stats: stats,
      questions_with_responses: sessionData.mock_interview_questions.map(question => {
        const response = sessionData.mock_interview_responses.find(r => r.question_id === question.question_id);
        return {
          ...question,
          response: response || null
        };
      })
    };

    const response = {
      success: true,
      data: enhancedSession
    };

    console.log(`Successfully retrieved session details for: ${session_id}`);
    res.json(response);

  } catch (error) {
    console.error('Error in session details endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch session details'
    });
  }
});

// HEALTH CHECK ENDPOINT
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('mock_interview_sessions')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error('Database connection failed');
    }

    // Test Google Cloud credentials
    const credentialTests = [];
    
    try {
      await getCredential('GOOGLE_GEMINI_API_KEY');
      credentialTests.push({ service: 'Gemini API', status: 'ok' });
    } catch (e) {
      credentialTests.push({ service: 'Gemini API', status: 'error', error: e.message });
    }

    try {
      await getCredential('GOOGLE_CLOUD_TTS_API_KEY');
      credentialTests.push({ service: 'Text-to-Speech API', status: 'ok' });
    } catch (e) {
      credentialTests.push({ service: 'Text-to-Speech API', status: 'error', error: e.message });
    }

    try {
      await getCredential('GOOGLE_CLOUD_STT_API_KEY');
      credentialTests.push({ service: 'Speech-to-Text API', status: 'ok' });
    } catch (e) {
      credentialTests.push({ service: 'Speech-to-Text API', status: 'error', error: e.message });
    }

    const allServicesOk = credentialTests.every(test => test.status === 'ok');

    res.json({
      success: true,
      data: {
        status: allServicesOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: 'connected',
        services: credentialTests,
        upsc_subjects: Object.keys(UPSC_SUBJECTS),
        difficulty_levels: Object.keys(DIFFICULTY_LEVELS)
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});

module.exports = router;