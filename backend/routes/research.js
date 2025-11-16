const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced Configuration with Gemini API
const CONFIG = {
  API_KEY: 'a1b2c3d4e5f6g7h8i9j0',
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  GEMINI_MODEL: 'gemini-2.0-flash-exp',
  MAX_TOKENS: 8000,
  TEMPERATURE: 0.7,
  TIMEOUT: 90000,
  MIN_CONTENT_LENGTH: 3000,
  EXPANSION_PASSES: 2,
  SECTION_DETAIL_LEVEL: 'comprehensive',
  MULTILINGUAL_SUPPORT: true,
  SUPPORTED_LANGUAGES: ['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'punjabi', 'kannada', 'malayalam']
};

// Content quality metrics
const CONTENT_METRICS = {
  target_word_count: 4000,
  min_sections: 12,
  min_examples_per_section: 3,
  min_subsections: 8,
  depth_score_target: 85
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

// Language-specific prompting
const getLanguageInstruction = (language) => {
  const instructions = {
    tamil: 'தமிழில் பதிலளிக்கவும். தமிழ் எழுத்துக்களைப் பயன்படுத்தி, சரியான இலக்கணத்துடன் எழுதவும்.',
    hindi: 'हिंदी में उत्तर दें। देवनागरी लिपि का उपयोग करके, सही व्याकरण के साथ लिखें।',
    telugu: 'తెలుగులో సమాధానం ఇవ్వండి. తెలుగు లిపిని ఉపయోగించి, సరైన వ్యాకరణంతో రాయండి.',
    bengali: 'বাংলায় উত্তর দিন। বাংলা লিপি ব্যবহার করে, সঠিক ব্যাকরণের সাথে লিখুন।',
    marathi: 'मराठीमध्ये उत्तर द्या. देवनागरी लिपी वापरून, योग्य व्याकरणासह लिहा.',
    gujarati: 'ગુજરાતીમાં જવાબ આપો. ગુજરાતી લિપિનો ઉપયોગ કરીને, યોગ્ય વ્યાકરણ સાથે લખો.',
    punjabi: 'ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਗੁਰਮੁਖੀ ਲਿਪੀ ਦੀ ਵਰਤੋਂ ਕਰਦੇ ਹੋਏ, ਸਹੀ ਵਿਆਕਰਣ ਨਾਲ ਲਿਖੋ।',
    kannada: 'ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಕನ್ನಡ ಲಿಪಿಯನ್ನು ಬಳಸಿ, ಸರಿಯಾದ ವ್ಯಾಕರಣದೊಂದಿಗೆ ಬರೆಯಿರಿ.',
    malayalam: 'മലയാളത്തിൽ ഉത്തരം നൽകുക. മലയാളം ലിപി ഉപയോഗിച്ച്, ശരിയായ വ്യാകരണത്തോടെ എഴുതുക।'
  };
  
  return instructions[language] || '';
};

// Create comprehensive prompt for content generation
const createComprehensivePrompt = (query, queryType, topicAnalysis, language) => {
  const languageInstruction = language !== 'english' ? 
    `CRITICAL: Respond in ${language} language. ${getLanguageInstruction(language)} Use proper Unicode characters and natural grammar.` : '';

  const systemPrompt = `You are an advanced educational content generator specializing in comprehensive, well-structured learning materials. Create detailed, informative content that helps students understand complex topics thoroughly.

${languageInstruction}

Content Requirements:
- Minimum 3000 words of substantial content
- Well-organized sections with clear headings
- Practical examples and real-world applications
- Academic depth with accessible explanations
- Proper formatting with bullet points and numbered lists
- Include relevant diagrams descriptions where helpful
- Cite important concepts and principles
- Add practical exercises or questions at the end`;

  const topicContext = topicAnalysis ? `Context: ${JSON.stringify(topicAnalysis)}` : '';

  const userPrompt = `Generate comprehensive educational content about: "${query}"

Query Type: ${queryType}
${topicContext}

Structure the content as follows:
1. Introduction and Overview
2. Core Concepts and Definitions
3. Detailed Explanations with Examples
4. Historical Context and Development
5. Current Applications and Relevance
6. Key Principles and Mechanisms
7. Real-world Examples and Case Studies
8. Common Misconceptions and Clarifications
9. Advanced Topics and Recent Developments
10. Practical Applications and Exercises
11. Summary and Key Takeaways
12. Further Reading and Resources

Ensure each section is detailed, informative, and educational. Include specific examples, explanations, and practical insights that help students understand the topic comprehensively.`;

  return { systemPrompt, userPrompt };
};

// Call Gemini API
const callGeminiAPI = async (prompt) => {
  try {
    const geminiApiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found in credentials');
    }

    console.log('🧠 Calling Gemini API for content generation...');

    const response = await fetch(
      `${CONFIG.GEMINI_BASE_URL}/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: CONFIG.TEMPERATURE,
            maxOutputTokens: CONFIG.MAX_TOKENS,
          }
        }),
        timeout: CONFIG.TIMEOUT
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response structure from Gemini API');
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

// Generate content with quality enhancement
const generateEnhancedContent = async (query, queryType = 'theoretical', language = 'english') => {
  try {
    console.log(`📚 Generating content for: ${query} (${language})`);

    // Create comprehensive prompt
    const { systemPrompt, userPrompt } = createComprehensivePrompt(query, queryType, null, language);
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Generate content using Gemini
    let content = await callGeminiAPI(fullPrompt);

    // Quality enhancement - expand if too short
    if (content.length < CONFIG.MIN_CONTENT_LENGTH) {
      console.log('🔄 Content too short, enhancing...');
      
      const enhancementPrompt = `${systemPrompt}

The following content about "${query}" needs to be significantly expanded and enhanced. 
Add more detailed explanations, examples, and comprehensive coverage:

${content}

Please expand this to be much more comprehensive, detailed, and educational. Add more sections, examples, and practical insights.`;

      content = await callGeminiAPI(enhancementPrompt);
    }

    // Calculate quality metrics
    const wordCount = content.split(/\s+/).length;
    const sectionCount = (content.match(/^#+ /gm) || []).length;
    const qualityScore = Math.min(100, (wordCount / CONFIG.target_word_count) * 100);

    return {
      content,
      metadata: {
        word_count: wordCount,
        sections: sectionCount,
        quality_score: Math.round(qualityScore),
        language: language,
        query_type: queryType,
        generation_method: 'gemini_api',
        model_used: CONFIG.GEMINI_MODEL
      }
    };

  } catch (error) {
    console.error('Error in content generation:', error);
    throw error;
  }
};

// Streaming content generator
async function* generateRealStreamingContent(query, queryType = 'theoretical', language = 'english') {
  try {
    yield `data: ${JSON.stringify({ 
      type: 'status', 
      message: `Starting research on: ${query}`,
      progress: 10
    })}\n\n`;

    yield `data: ${JSON.stringify({ 
      type: 'status', 
      message: 'Analyzing topic and generating comprehensive content...',
      progress: 30
    })}\n\n`;

    // Generate content
    const result = await generateEnhancedContent(query, queryType, language);

    yield `data: ${JSON.stringify({ 
      type: 'status', 
      message: 'Processing and formatting content...',
      progress: 80
    })}\n\n`;

    // Stream the final content
    yield `data: ${JSON.stringify({
      type: 'content',
      content: result.content,
      metadata: result.metadata,
      progress: 100
    })}\n\n`;

    yield `data: ${JSON.stringify({ 
      type: 'complete',
      message: 'Research completed successfully!',
      metadata: result.metadata
    })}\n\n`;

  } catch (error) {
    console.error('❌ Streaming error:', error);
    yield `data: ${JSON.stringify({
      type: 'error',
      message: error.message || 'Content generation failed'
    })}\n\n`;
  }
}

// Routes

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Advanced Research API with Gemini',
    version: '6.0.0',
    ai_model: CONFIG.GEMINI_MODEL,
    ai_provider: 'Google Gemini',
    features: [
      'comprehensive_content_generation',
      'multilingual_support',
      'real_time_streaming',
      'quality_metrics',
      'educational_focus'
    ],
    capabilities: {
      min_content_length: CONFIG.MIN_CONTENT_LENGTH,
      max_tokens: CONFIG.MAX_TOKENS,
      supported_languages: CONFIG.SUPPORTED_LANGUAGES,
      quality_metrics: true
    },
    timestamp: new Date().toISOString()
  });
});

// Main research endpoint
router.post('/', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { query, query_type = 'theoretical', language = 'english' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔬 Research request: ${query} (${language})`);

    const result = await generateEnhancedContent(query, query_type, language);

    res.json({
      success: true,
      response: result.content,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
      api_info: {
        model: CONFIG.GEMINI_MODEL,
        provider: 'Google Gemini',
        version: '6.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Research endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate research content',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Streaming endpoint
router.post('/stream', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { query, query_type = 'theoretical', language = 'english' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`📡 Starting streaming research for: ${query} (${language})`);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Stream content
    for await (const chunk of generateRealStreamingContent(query, query_type, language)) {
      res.write(chunk);
    }

    res.end();
    
  } catch (error) {
    console.error('❌ Streaming endpoint error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

// Handle OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

module.exports = router;
