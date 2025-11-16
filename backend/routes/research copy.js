const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced Configuration (matching Python exactly)
const CONFIG = {
  API_KEY: 'a1b2c3d4e5f6g7h8i9j0',
  TOGETHER_BASE_URL: 'https://api.together.xyz/v1',
  TOGETHER_MODEL: 'mistralai/Mistral-Small-24B-Instruct-2501',
  BACKUP_MODEL: 'meta-llama/Llama-2-7b-chat-hf',
  MAX_TOKENS: 12000,
  TEMPERATURE: 0.7,
  TIMEOUT: 60000, // Increased to 60 seconds
  MIN_CONTENT_LENGTH: 4000,
  EXPANSION_PASSES: 2,
  SECTION_DETAIL_LEVEL: 'comprehensive'
};

// Content quality metrics (matching Python)
const CONTENT_METRICS = {
  target_word_count: 4500,
  min_sections: 15,
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

// Calculate content quality score
const calculateContentQualityScore = (content) => {
  if (!content) return 0;
  
  const wordCount = content.split(' ').length;
  const sectionCount = (content.match(/^##\s/gm) || []).length;
  const subsectionCount = (content.match(/^###\s/gm) || []).length;
  const listCount = (content.match(/^[-*+]\s/gm) || []).length;
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  
  let score = 0;
  
  // Word count scoring (30%)
  if (wordCount >= CONFIG.MIN_CONTENT_LENGTH) score += 30;
  else score += (wordCount / CONFIG.MIN_CONTENT_LENGTH) * 30;
  
  // Structure scoring (25%)
  if (sectionCount >= CONTENT_METRICS.min_sections) score += 25;
  else score += (sectionCount / CONTENT_METRICS.min_sections) * 25;
  
  // Depth scoring (20%)
  if (subsectionCount >= CONTENT_METRICS.min_subsections) score += 20;
  else score += (subsectionCount / CONTENT_METRICS.min_subsections) * 20;
  
  // Detail scoring (15%)
  const detailRatio = listCount / Math.max(sectionCount, 1);
  score += Math.min(detailRatio * 3, 15);
  
  // Technical content (10%)
  score += Math.min(codeBlockCount * 2, 10);
  
  return Math.round(Math.min(score, 100));
};

// Calculate complexity score
const calculateComplexityScore = (content) => {
  if (!content) return 0;
  
  const sentences = content.split(/[.!?]+/).length;
  const words = content.split(' ').length;
  const avgSentenceLength = words / sentences;
  
  const complexWords = (content.match(/\b\w{8,}\b/g) || []).length;
  const complexityRatio = complexWords / words;
  
  let score = 0;
  
  // Sentence complexity (50%)
  if (avgSentenceLength > 20) score += 50;
  else if (avgSentenceLength > 15) score += 40;
  else if (avgSentenceLength > 10) score += 25;
  else score += 10;
  
  // Vocabulary complexity (50%)
  if (complexityRatio > 0.3) score += 50;
  else if (complexityRatio > 0.2) score += 40;
  else if (complexityRatio > 0.1) score += 25;
  else score += 10;
  
  return Math.round(Math.min(score, 100));
};

// Analyze topic category (simplified)
const analyzeTopicCategory = async (query) => {
  const queryLower = query.toLowerCase();
  
  const categories = {
    'history': ['war', 'historical', 'ancient', 'medieval', 'revolution', 'empire', 'civilization'],
    'science': ['physics', 'chemistry', 'biology', 'scientific', 'research', 'theory', 'experiment'],
    'technology': ['computer', 'software', 'AI', 'artificial intelligence', 'programming', 'digital'],
    'mathematics': ['math', 'equation', 'algebra', 'calculus', 'geometry', 'statistics'],
    'literature': ['literature', 'poetry', 'novel', 'author', 'writing', 'book'],
    'economics': ['economy', 'economic', 'finance', 'business', 'market', 'trade'],
    'philosophy': ['philosophy', 'ethical', 'moral', 'logic', 'metaphysics'],
    'politics': ['political', 'government', 'democracy', 'policy', 'election']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      return {
        category,
        subcategory: 'general',
        complexity: 'intermediate',
        domain_specific: true,
        key_concepts: [query],
        related_fields: [],
        content_type: 'theoretical',
        depth_requirements: 'comprehensive'
      };
    }
  }
  
  return {
    category: 'general',
    subcategory: 'general',
    complexity: 'intermediate',
    domain_specific: false,
    key_concepts: [query],
    related_fields: [],
    content_type: 'theoretical',
    depth_requirements: 'comprehensive'
  };
};

// Create comprehensive prompts (matching Python)
const createComprehensivePrompt = (query, queryType, topicAnalysis, language) => {
  let systemPrompt, userPrompt;
  
  if (queryType === 'practical') {
    systemPrompt = `You are an expert educational content creator specializing in practical, hands-on learning experiences. Create comprehensive educational content that focuses on real-world applications, step-by-step processes, and actionable knowledge.

Generate detailed content with:
- Practical examples and case studies
- Step-by-step implementation guides
- Real-world applications and use cases
- Hands-on exercises and activities
- Problem-solving approaches
- Best practices and common pitfalls
- Tools and resources for implementation

Structure your response with clear headings using ## for major sections and ### for subsections.
Aim for ${CONFIG.MIN_CONTENT_LENGTH}+ words with comprehensive coverage.`;

userPrompt = `Create comprehensive educational content about: ${query}

You are an expert educator. Analyze the topic "${query}" and create well-structured, comprehensive content of 4000+ words.

REQUIREMENTS:
- Generate content that fits the subject naturally (science, math, history, etc.)
- Create appropriate sections based on what the topic actually needs
- Use proper academic structure with ## headings
- Provide deep, detailed explanations
- Include examples, applications, and context
- CRITICAL: Generate exactly 4000+ words - this is mandatory
- Continue writing until you reach at least 4000 words
- Do not stop early - keep expanding each section
- Make it educational and engaging

Generate the most logical and comprehensive structure for this specific topic, not a generic template.`;  } else {
    systemPrompt = `You are an expert educational content creator specializing in comprehensive theoretical analysis. Create detailed academic content with deep analysis, theoretical foundations, and scholarly depth.

Generate comprehensive content with:
- Theoretical foundations and frameworks
- Academic analysis and critical thinking
- Historical context and evolution
- Interdisciplinary connections
- Research-based insights
- Comparative analysis
- Future implications and directions

Structure your response with clear headings using ## for major sections and ### for subsections.
Aim for ${CONFIG.MIN_CONTENT_LENGTH}+ words with exceptional academic depth.`;

userPrompt = `Create comprehensive educational content about: ${query}

You are an expert educator. Analyze the topic "${query}" and create well-structured, comprehensive content of 4000+ words.

REQUIREMENTS:
- Generate content that fits the subject naturally (science, math, history, etc.)
- Create appropriate sections based on what the topic actually needs
- Use proper academic structure with ## headings
- Provide deep, detailed explanations
- Include examples, applications, and context
- CRITICAL: Generate exactly 4000+ words - this is mandatory
- Continue writing until you reach at least 4000 words
- Do not stop early - keep expanding each section
- Make it educational and engaging

Generate the most logical and comprehensive structure for this specific topic, not a generic template.`;  }
  
  return { systemPrompt, userPrompt };
};

// REAL STREAMING GENERATOR - True streaming like Python
const generateRealStreamingContent = async function* (query, queryType = 'theoretical', language = 'english') {
  const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
  if (!togetherApiKey) {
    yield `data: ${JSON.stringify({type: 'error', message: 'Together AI API key not found'})}\n\n`;
    return;
  }

  const topicAnalysis = await analyzeTopicCategory(query);
  const { systemPrompt, userPrompt } = createComprehensivePrompt(query, queryType, topicAnalysis, language);
  
  // Send metadata immediately
  yield `data: ${JSON.stringify({
    type: 'metadata',
    query: query,
    topic_analysis: topicAnalysis,
    query_type: queryType,
    model: CONFIG.TOGETHER_MODEL,
    target_length: CONFIG.MIN_CONTENT_LENGTH
  })}\n\n`;

  try {
    console.log(`ðŸš€ Starting REAL streaming content generation for: ${query}`);
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.TOGETHER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE,
        stream: true  // ðŸ”‘ TRUE STREAMING
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let contentBuffer = '';
    let wordCount = 0;
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              const chunkContent = data.choices[0].delta.content;
              contentBuffer += chunkContent;
              wordCount = contentBuffer.split(' ').length;
              chunkCount++;
              
              // Send real-time chunk
              const chunkData = {
                type: 'content',
                chunk: chunkContent,
                word_count: wordCount,
                section_count: (contentBuffer.match(/^##\s/gm) || []).length,
                progress: Math.min(100, (wordCount / CONFIG.MIN_CONTENT_LENGTH) * 100),
                quality_score: calculateContentQualityScore(contentBuffer)
              };
              
              yield `data: ${JSON.stringify(chunkData)}\n\n`;
              
              // Log progress every 50 chunks
              if (chunkCount % 50 === 0) {
                console.log(`ðŸ“ Generated ${chunkCount} chunks, ${wordCount} words`);
              }
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }

    // Send completion data
    const sectionCount = (contentBuffer.match(/^##\s/gm) || []).length;
    const qualityScore = calculateContentQualityScore(contentBuffer);
    const complexityScore = calculateComplexityScore(contentBuffer);
    const targetAchieved = wordCount >= CONFIG.MIN_CONTENT_LENGTH;
    
    const completionData = {
      type: 'complete',
      total_content: contentBuffer,
      word_count: wordCount,
      section_count: sectionCount,
      quality_score: qualityScore,
      complexity_score: complexityScore,
      target_achieved: targetAchieved,
      topic_analysis: topicAnalysis,
      model: CONFIG.TOGETHER_MODEL,
      time_taken: Date.now(),
      content_metrics: {
        word_count: wordCount,
        section_count: sectionCount,
        quality_score: qualityScore,
        complexity_score: complexityScore,
        paragraphs: contentBuffer.split('\n\n').length,
        sentences: (contentBuffer.match(/[.!?]+/g) || []).length
      }
    };
    
    yield `data: ${JSON.stringify(completionData)}\n\n`;
    console.log(`âœ… Streaming completed: ${wordCount} words, ${sectionCount} sections`);
    
  } catch (error) {
    console.error('âŒ Streaming error:', error);
    yield `data: ${JSON.stringify({
      type: 'error',
      message: `Content generation failed: ${error.message}`
    })}\n\n`;
  }
};

// Non-streaming content generation for follow-ups and analysis
const generateSimpleContent = async (systemPrompt, userPrompt, maxTokens = 2000, temperature = 0.7) => {
  const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
  if (!togetherApiKey) {
    throw new Error('Together AI API key not found');
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.TOGETHER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
    
  } catch (error) {
    console.error('Error generating simple content:', error);
    throw error;
  }
};

// Generate enhanced follow-up questions
const generateEnhancedFollowUpQuestions = async (query, content, language = 'english') => {
  const systemPrompt = `You are an expert educational question generator that creates diverse, engaging follow-up questions to deepen understanding and encourage critical thinking.

Create questions that:
- Test different levels of understanding (basic, intermediate, advanced)
- Cover different question types (conceptual, practical, analytical, comparative, exploratory)
- Encourage critical thinking and analysis
- Connect to real-world applications
- Promote deeper exploration of the topic

Return ONLY a JSON array in this exact format:
[
  {
    "question": "Clear, engaging question text",
    "type": "conceptual|practical|analytical|comparative|exploratory",
    "difficulty": "basic|intermediate|advanced",
    "estimatedTime": number_in_minutes
  }
]`;

  const userPrompt = `Based on this educational content about "${query}", create 8 diverse follow-up questions:

CONTENT SUMMARY:
${content.substring(0, 2000)}...

Generate questions that:
- Cover different aspects of the topic
- Range from basic comprehension to advanced analysis
- Include both theoretical and practical applications
- Encourage critical thinking and exploration
- Are appropriate for ${language} language learners

Make each question engaging and educationally valuable.`;

  try {
    const content_response = await generateSimpleContent(systemPrompt, userPrompt, 2000, 0.8);
    
    // Extract JSON from response
    const jsonMatch = content_response.match(/\[.*\]/s);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      console.log(`âœ… Generated ${questions.length} enhanced follow-up questions`);
      return questions;
    } else {
      console.warn('âš ï¸ Could not parse enhanced follow-up questions JSON');
      return [];
    }
  } catch (error) {
    console.error('âŒ Error generating enhanced follow-up questions:', error);
    return [];
  }
};

// Analyze content depth and insights
const analyzeComprehensiveContentDepth = async (query, content) => {
  const systemPrompt = `You are an expert content analyst that provides comprehensive evaluation of educational content quality, depth, and learning value.

Analyze the content and return insights in this JSON format:
{
  "keyPoints": ["point1", "point2", "point3"],
  "relatedTopics": ["topic1", "topic2", "topic3"],
  "practicalApplications": ["app1", "app2", "app3"],
  "furtherReading": ["resource1", "resource2", "resource3"],
  "difficulty": "beginner|intermediate|advanced|expert",
  "comprehensiveness": number_0_to_100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "learningObjectives": ["objective1", "objective2"],
  "prerequisites": ["prereq1", "prereq2"]
}`;

  const userPrompt = `Analyze this educational content about "${query}" and provide comprehensive insights:

CONTENT:
${content.substring(0, 3000)}...

Evaluate:
- Key learning points and takeaways
- Related topics for further exploration
- Practical applications and use cases
- Quality and comprehensiveness of coverage
- Appropriate difficulty level
- Learning objectives achieved
- Recommendations for improvement`;

  try {
    const content_response = await generateSimpleContent(systemPrompt, userPrompt, 1500, 0.3);
    
    // Extract JSON from response
    const jsonMatch = content_response.match(/\{.*\}/s);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      console.log('âœ… Generated comprehensive content insights');
      return insights;
    } else {
      console.warn('âš ï¸ Could not parse content analysis JSON');
      return {};
    }
  } catch (error) {
    console.error('âŒ Error analyzing content:', error);
    return {};
  }
};

// ROUTES

// Health check
router.get('/health', (req, res) => {
  res.json({
    service: 'Enhanced Research API',
    status: 'healthy',
    version: '4.0.0',
    ai_provider: 'Together AI',
    model: CONFIG.TOGETHER_MODEL,
    backup_model: CONFIG.BACKUP_MODEL,
    content_targets: {
      min_words: CONFIG.MIN_CONTENT_LENGTH,
      max_tokens: CONFIG.MAX_TOKENS,
      target_sections: CONTENT_METRICS.min_sections,
      quality_threshold: 80
    },
    endpoints: [
      '/health',
      '/api/research',
      '/api/research/stream',
      '/api/research/followup-questions',
      '/api/research/analyze-content'
    ],
    features: [
      'real_streaming_generation',
      'enhanced_follow_ups',
      'comprehensive_insights',
      'quality_scoring',
      'topic_analysis'
    ],
    timestamp: Date.now()
  });
});

// Main research endpoint (non-streaming)
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

    console.log(`ðŸ” Processing research query: ${query}`);

    const startTime = Date.now();
    
    // Collect streaming content
    let fullContent = '';
    let metadata = {};
    let contentMetrics = {};
    
    for await (const chunk of generateRealStreamingContent(query, query_type, language)) {
      if (chunk.startsWith('data: ')) {
        try {
          const dataPart = JSON.parse(chunk.slice(6));
          if (dataPart.type === 'content') {
            fullContent += dataPart.chunk || '';
          } else if (dataPart.type === 'complete') {
            metadata = dataPart;
            contentMetrics = dataPart.content_metrics || {};
            break;
          } else if (dataPart.type === 'metadata') {
            Object.assign(metadata, dataPart);
          }
        } catch (e) {
          continue;
        }
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;

    res.json({
      status: 'success',
      query,
      response: fullContent,
      word_count: metadata.word_count || fullContent.split(' ').length,
      section_count: metadata.section_count || 0,
      time_taken: processingTime,
      quality_score: metadata.quality_score || 0,
      target_achieved: metadata.target_achieved || false,
      topic_analysis: metadata.topic_analysis || {},
      model: metadata.model || CONFIG.TOGETHER_MODEL,
      content_metrics: contentMetrics,
      enhanced_features: {
        real_streaming: true,
        quality_scoring: true,
        topic_analysis: true
      }
    });

  } catch (error) {
    console.error('âŒ Research endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// REAL STREAMING ENDPOINT - True SSE streaming
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

    console.log(`ðŸ“¡ Starting REAL streaming research for: ${query}`);

    // Set SSE headers
    res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache', 
    'Connection': 'keep-alive',
    
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  });

    // Stream content in real-time
    for await (const chunk of generateRealStreamingContent(query, query_type, language)) {
      res.write(chunk);
    }

    res.end();
    
  } catch (error) {
    console.error('âŒ Streaming endpoint error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

// Enhanced follow-up questions endpoint
router.post('/followup-questions', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { query, content, language = 'english' } = req.body;
    
    if (!query || !content) {
      return res.status(400).json({ error: 'Query and content are required' });
    }

    console.log(`ðŸ¤” Generating enhanced follow-up questions for: ${query}`);

    const startTime = Date.now();
    const questions = await generateEnhancedFollowUpQuestions(query, content, language);
    const processingTime = (Date.now() - startTime) / 1000;

    res.json({
      status: 'success',
      query,
      questions,
      count: questions.length,
      time_taken: Math.round(processingTime * 100) / 100,
      enhanced_features: {
        comprehensive_questions: true,
        learning_objectives: true,
        difficulty_variety: true,
        time_estimates: true
      }
    });

  } catch (error) {
    console.error('âŒ Enhanced follow-up questions error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Enhanced content analysis endpoint
router.post('/analyze-content', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!validateApiKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  try {
    const { query, content } = req.body;
    
    if (!query || !content) {
      return res.status(400).json({ error: 'Query and content are required' });
    }

    console.log(`ðŸ“Š Conducting comprehensive content analysis for: ${query}`);

    const startTime = Date.now();
    const insights = await analyzeComprehensiveContentDepth(query, content);
    const processingTime = (Date.now() - startTime) / 1000;

    // Calculate additional metrics
    const wordCount = content.split(' ').length;
    const sectionCount = (content.match(/^##\s/gm) || []).length;
    const qualityScore = calculateContentQualityScore(content);
    const complexityScore = calculateComplexityScore(content);

    res.json({
      status: 'success',
      query,
      insights,
      content_metrics: {
        word_count: wordCount,
        section_count: sectionCount,
        quality_score: qualityScore,
        complexity_score: complexityScore,
        target_achieved: wordCount >= CONFIG.MIN_CONTENT_LENGTH,
        paragraph_count: content.split('\n\n').length,
        sentence_count: (content.match(/[.!?]+/g) || []).length
      },
      analysis_quality: {
        comprehensive: true,
        multi_dimensional: true,
        actionable_insights: true,
        educational_focus: true
      },
      time_taken: Math.round(processingTime * 100) / 100
    });

  } catch (error) {
    console.error('âŒ Content analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Handle OPTIONS requests for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.sendStatus(200);
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Research API Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unknown routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET /health',
      'POST /',
      'POST /stream', 
      'POST /followup-questions',
      'POST /analyze-content'
    ]
  });
});

module.exports = router;