const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Pure AI Configuration
const CONFIG = {
  API_KEY: 'a1b2c3d4e5f6g7h8i9j0',
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  PRIMARY_MODEL: 'qwen/qwen3-235b-a22b:free', 
  BACKUP_MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
  MAX_TOKENS: 8000,
  TEMPERATURE: 0.3,
  TIMEOUT: 90000,
  MIN_CONTENT_LENGTH: 200,
  BASE_CARDS_PER_1000_WORDS: 15,
  MIN_CARDS: 8,
  MAX_CARDS: 100,
  MULTILINGUAL_SUPPORT: true,
  SUPPORTED_LANGUAGES: ['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'punjabi', 'kannada', 'malayalam']
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

// Calculate optimal number of cards based on content
const calculateOptimalCardCount = (content) => {
  const wordCount = content.split(/\s+/).length;
  const sectionCount = (content.match(/^#{1,3}\s/gm) || []).length;
  const conceptDensity = Math.max(sectionCount, 1);
  
  // Base calculation: 15 cards per 1000 words, adjusted for concept density
  let targetCards = Math.floor((wordCount / 1000) * CONFIG.BASE_CARDS_PER_1000_WORDS);
  
  // Bonus cards for high concept density
  targetCards += Math.floor(conceptDensity * 0.5);
  
  // Apply minimum for your requirement: 30 cards for 2000+ words
  if (wordCount >= 2000) {
    targetCards = Math.max(30, targetCards);
  }
  
  // Ensure within bounds
  targetCards = Math.max(CONFIG.MIN_CARDS, Math.min(CONFIG.MAX_CARDS, targetCards));
  
  console.log(`📊 Content Analysis: ${wordCount} words, ${sectionCount} sections → ${targetCards} cards`);
  return targetCards;
};

// Create pure AI prompt for flashcard generation
const createPureAIPrompt = (content, topic, targetCards) => {
  const systemPrompt = `You are an expert educational tutor with deep understanding of learning psychology and memory science. Your task is to create the most effective flashcards possible to help someone master educational content.

KEY PRINCIPLES:
- Create exactly ${targetCards} flashcards that genuinely help learning
- Use your intelligence to decide everything - no templates or patterns
- Make each flashcard test true understanding, not just memorization
- Vary your approach naturally based on the content type and complexity
- Create questions that feel like a human tutor would ask
- Include memory aids that actually make sense for the specific content

RESPONSE FORMAT:
Return a JSON array of flashcard objects. Each flashcard should have this structure:
[
  {
    "content": "The main learning content/concept (this is what the student studies)",
    "type": "your_choice_of_type", 
    "difficulty": "your_assessment",
    "section": "content_section_name",
    "topic": "specific_topic",
    "hint": "helpful_memory_aid",
    "keywords": ["relevant", "terms"]
  }
]

IMPORTANT INSTRUCTIONS:
- Read the content like an intelligent tutor
- Decide what concepts are most important to learn
- Create questions that test real understanding
- Use your judgment for difficulty levels
- Make memory aids that actually help with that specific concept
- Ensure good coverage of the material without being repetitive
- Let the content guide your approach - don't force artificial patterns

The goal is comprehensive mastery of the material through intelligent, varied, and effective study cards.`;

  const userPrompt = `Create ${targetCards} intelligent flashcards for learning this content about "${topic}":

CONTENT TO LEARN:
${content}

Remember: Use your AI intelligence to create the most effective learning experience. Every decision about question type, difficulty, and memory aids should be based on what will genuinely help someone master this material. No templates - just smart, adaptive teaching.

Return only the JSON array of ${targetCards} flashcard objects.`;

  return { systemPrompt, userPrompt };
};

// Transform AI response to match expected frontend format
const transformAIFlashcards = (aiFlashcards, topic) => {
  return aiFlashcards.map((card, index) => ({
    id: index + 1,
    content: card.content || 'AI-generated learning content',
    type: card.type || 'concept',
    difficulty: card.difficulty || 'intermediate',
    section: card.section || 'Main Content',
    topic: card.topic || topic,
    hint: card.hint || 'Focus on understanding the key concept',
    keywords: Array.isArray(card.keywords) ? card.keywords : [],
    mainTopic: topic,
    readingTime: Math.ceil(card.content ? card.content.split(' ').length / 200 : 1),
    createdAt: new Date().toISOString(),
    aiGenerated: true
  }));
};

// Calculate comprehensive quality score
const calculateQualityScore = (flashcards) => {
  if (!flashcards || flashcards.length === 0) return 0;
  
  let score = 0;
  const totalCards = flashcards.length;
  
  // Content quality (40%)
  let contentScore = 0;
  flashcards.forEach(card => {
    if (card.content && card.content.length > 20 && card.content.length < 500) {
      contentScore += 40 / totalCards;
    }
  });
  score += contentScore;
  
  // Variety scoring (30%)
  const types = new Set(flashcards.map(card => card.type));
  const difficulties = new Set(flashcards.map(card => card.difficulty));
  const varietyScore = Math.min(30, (types.size * 6) + (difficulties.size * 8));
  score += varietyScore;
  
  // Hint quality (20%)
  const hintsScore = flashcards.filter(card => 
    card.hint && card.hint.length > 10 && card.hint.length < 200
  ).length / totalCards * 20;
  score += hintsScore;
  
  // Keywords relevance (10%)
  const keywordsScore = flashcards.filter(card => 
    Array.isArray(card.keywords) && card.keywords.length > 0
  ).length / totalCards * 10;
  score += keywordsScore;
  
  return Math.round(Math.min(score, 100));
};

// Main AI-powered flashcard generation function
async function generatePureAIFlashcards(content, topic, options = {}) {
  try {
    console.log(`🧠 Starting pure AI flashcard generation for: "${topic}"`);

    // Content validation
    if (!content || content.length < CONFIG.MIN_CONTENT_LENGTH) {
      throw new Error(`Content must be at least ${CONFIG.MIN_CONTENT_LENGTH} characters for AI processing`);
    }

    // Get AI credentials
    const openrouterApiKey = await getCredential('OPENROUTER_API_KEY');
    if (!openrouterApiKey) {
      throw new Error('Openrouter API key not found in credentials');
    }

    // Calculate optimal card count
    const targetCards = calculateOptimalCardCount(content);
    
    // Create pure AI prompt
    const { systemPrompt, userPrompt } = createPureAIPrompt(content, topic, targetCards);

    console.log(`🎯 Requesting ${targetCards} AI-generated flashcards...`);

    // Call Together AI
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openrouterApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: CONFIG.PRIMARY_MODEL, 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OPENROUTER AI API error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log(`📝 AI Response length: ${aiResponse.length} characters`);

    // Parse AI response
    let parsedFlashcards;
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedFlashcards = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response
        parsedFlashcards = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('AI Response:', aiResponse.substring(0, 500) + '...');
      throw new Error('Failed to parse AI-generated flashcards. The AI response was not in valid JSON format.');
    }

    // Validate AI response
    if (!Array.isArray(parsedFlashcards)) {
      throw new Error('AI response is not a valid array of flashcards');
    }

    if (parsedFlashcards.length === 0) {
      throw new Error('AI generated zero flashcards from the content');
    }

    // Transform to expected format
    const flashcards = transformAIFlashcards(parsedFlashcards, topic);

    // Filter out invalid cards
    const validFlashcards = flashcards.filter(card => 
      card.content && 
      card.content.trim().length >= 10 && 
      card.content.trim().length <= 1000
    );

    if (validFlashcards.length === 0) {
      throw new Error('No valid flashcards were generated by AI');
    }

    // Calculate comprehensive statistics
    const contentStats = {
      total: validFlashcards.length,
      byType: {},
      byDifficulty: {},
      bySection: {}
    };

    validFlashcards.forEach(card => {
      contentStats.byType[card.type] = (contentStats.byType[card.type] || 0) + 1;
      contentStats.byDifficulty[card.difficulty] = (contentStats.byDifficulty[card.difficulty] || 0) + 1;
      contentStats.bySection[card.section] = (contentStats.bySection[card.section] || 0) + 1;
    });

    const qualityScore = calculateQualityScore(validFlashcards);

    console.log(`✅ Generated ${validFlashcards.length} pure AI flashcards (target: ${targetCards})`);
    console.log(`📊 Quality Score: ${qualityScore}%`);
    console.log(`🎨 Type Distribution:`, Object.keys(contentStats.byType).join(', '));

    return {
      success: true,
      topic: topic,
      total_cards: validFlashcards.length,
      flashcards: validFlashcards,
      content_stats: contentStats,
      processing_info: {
        content_length: content.length,
        word_count: content.split(/\s+/).length,
        target_cards: targetCards,
        generated_cards: parsedFlashcards.length,
        valid_cards: validFlashcards.length,
        ai_model: CONFIG.PRIMARY_MODEL,
        quality_score: qualityScore,
        generation_method: 'pure_ai_intelligence'
      }
    };

  } catch (error) {
    console.error('❌ Pure AI flashcard generation failed:', error);
    throw error;
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Pure AI FlashCards API',
    version: '5.0.0',
    features: [
      'pure_ai_intelligence',
      'dynamic_card_generation', 
      'adaptive_content_analysis',
      'zero_hardcoded_patterns',
      'intelligent_tutoring',
      'natural_question_variety'
    ],
    ai_model: CONFIG.PRIMARY_MODEL,
    capabilities: {
      min_content_length: CONFIG.MIN_CONTENT_LENGTH,
      cards_per_1000_words: CONFIG.BASE_CARDS_PER_1000_WORDS,
      min_cards: CONFIG.MIN_CARDS,
      max_cards: CONFIG.MAX_CARDS,
      special_requirement: '30+ cards for 2000+ words'
    },
    timestamp: new Date().toISOString()
  });
});

// Generate pure AI flashcards
router.post('/generate', async (req, res) => {
  try {
    const { content, topic, options = {} } = req.body;
    
    // Validate required inputs
    if (!content || content.trim().length < CONFIG.MIN_CONTENT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Content must be at least ${CONFIG.MIN_CONTENT_LENGTH} characters for AI analysis`,
        received_length: content ? content.length : 0,
        minimum_required: CONFIG.MIN_CONTENT_LENGTH
      });
    }

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and cannot be empty'
      });
    }

    console.log(`🚀 Pure AI Flashcard Request: "${topic}" (${content.length} chars)`);

    const startTime = Date.now();
    const result = await generatePureAIFlashcards(content, topic, options);
    const processingTime = (Date.now() - startTime) / 1000;

    res.json({
      ...result,
      processing_time: processingTime,
      generation_method: 'pure_ai_intelligence',
      ai_decisions: {
        card_count: 'AI-determined based on content richness',
        question_types: 'AI-selected for optimal learning',
        difficulty_levels: 'AI-assessed based on concept complexity',
        memory_aids: 'AI-generated for specific concepts'
      },
      api_version: '5.0.0',
      model_used: CONFIG.PRIMARY_MODEL
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI-powered flashcards',
      message: error.message,
      generation_method: 'pure_ai_intelligence',
      troubleshooting: [
        'Ensure content is substantial and educational',
        'Check Openrouter AI service availability',
        'Verify API credentials are configured'
      ]
    });
  }
});

// Get content analysis and card count estimation
router.post('/analyze', async (req, res) => {
  try {
    const { content, topic } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required for analysis'
      });
    }

    const wordCount = content.split(/\s+/).length;
    const sectionCount = (content.match(/^#{1,3}\s/gm) || []).length;
    const estimatedCards = calculateOptimalCardCount(content);
    
    const analysis = {
      content_metrics: {
        character_count: content.length,
        word_count: wordCount,
        section_count: sectionCount,
        readiness: content.length >= CONFIG.MIN_CONTENT_LENGTH ? 'ready' : 'too_short'
      },
      ai_estimation: {
        estimated_cards: estimatedCards,
        reasoning: wordCount >= 2000 ? 
          `${wordCount} words meets your 30+ card requirement` :
          `${wordCount} words will generate ${estimatedCards} quality cards`,
        processing_time_estimate: `${Math.round(estimatedCards * 1.5)}-${Math.round(estimatedCards * 2.5)} seconds`,
        quality_expectation: 'High - AI will create varied, intelligent study cards'
      },
      ai_approach: {
        card_generation: 'Pure AI intelligence - no templates',
        question_variety: 'AI determines optimal question types',
        difficulty_assessment: 'AI evaluates true concept complexity',
        memory_techniques: 'AI creates contextual learning aids'
      }
    };

    res.json({
      success: true,
      topic: topic,
      analysis: analysis,
      ai_powered: true,
      api_version: '5.0.0'
    });

  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

// Preview AI capabilities
router.post('/preview', async (req, res) => {
  try {
    const { content, topic } = req.body;
    
    if (!content || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Content and topic are required for preview'
      });
    }

    const wordCount = content.split(/\s+/).length;
    const estimatedCards = calculateOptimalCardCount(content);
    
    // Generate preview without AI call
    const preview = {
      estimated_output: {
        card_count: estimatedCards,
        content_coverage: 'Comprehensive - AI will identify all key concepts',
        question_variety: 'High - AI creates natural, varied questions',
        difficulty_range: 'Adaptive - AI assesses true complexity',
        memory_aids: 'Contextual - AI generates relevant learning techniques'
      },
      ai_intelligence: {
        content_analysis: 'AI reads and understands like a human tutor',
        question_creation: 'AI decides optimal ways to test understanding',
        adaptive_difficulty: 'AI evaluates concept complexity naturally',
        learning_optimization: 'AI focuses on genuine comprehension'
      },
      example_capabilities: [
        'Creates questions that test real understanding',
        'Generates memory aids that actually help',
        'Adapts to content type and complexity',
        'Ensures comprehensive topic coverage',
        'Varies question styles naturally'
      ]
    };

    res.json({
      success: true,
      topic: topic,
      content_length: content.length,
      word_count: wordCount,
      preview: preview,
      processing_estimate: `${Math.round(estimatedCards * 1.5)}-${Math.round(estimatedCards * 2.5)} seconds`,
      ai_model: CONFIG.PRIMARY_MODEL,
      api_version: '5.0.0'
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

// Legacy stats endpoint (for compatibility)
router.post('/stats', async (req, res) => {
  try {
    const { content, topic } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'Content is required for statistics'
      });
    }

    const wordCount = content.split(/\s+/).length;
    const estimatedCards = calculateOptimalCardCount(content);
    
    const stats = {
      content_analysis: {
        original_length: content.length,
        word_count: wordCount,
        paragraph_count: content.split(/\n\s*\n/).length,
        section_count: (content.match(/^#{1,3}\s/gm) || []).length
      },
      ai_generation_preview: {
        estimated_cards: estimatedCards,
        generation_method: 'Pure AI Intelligence',
        card_variety: 'AI-determined based on content',
        difficulty_assessment: 'AI-evaluated complexity',
        memory_techniques: 'AI-generated contextual aids'
      },
      special_features: {
        dynamic_scaling: `${CONFIG.BASE_CARDS_PER_1000_WORDS} cards per 1000 words base`,
        minimum_guarantee: `${CONFIG.MIN_CARDS} cards minimum`,
        quality_focus: 'AI ensures meaningful, testable content',
        no_templates: 'Pure AI creativity and intelligence'
      }
    };

    res.json({
      success: true,
      topic: topic,
      statistics: stats,
      ai_powered: true
    });

  } catch (error) {
    console.error('Stats generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate statistics',
      message: error.message
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Pure AI Flashcards API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'Unknown error occurred',
    service: 'pure_ai_flashcards',
    timestamp: new Date().toISOString()
  });
});

// Handle OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.sendStatus(200);
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET /health - Check API status',
      'POST /generate - Generate AI flashcards', 
      'POST /analyze - Analyze content for flashcard potential',
      'POST /preview - Preview AI capabilities',
      'POST /stats - Get generation statistics'
    ],
    service: 'pure_ai_flashcards',
    api_version: '5.0.0'
  });
});

module.exports = router;
