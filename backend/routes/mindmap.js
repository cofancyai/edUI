const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get API credentials from Supabase
async function getCredential(name) {
  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error(`Error fetching credential ${name}:`, error);
      return null;
    }
    
    return data?.config?.key || null;
  } catch (err) {
    console.error(`Failed to fetch credential ${name}:`, err);
    return null;
  }
}

// Icon options for cards
const iconOptions = ['ðŸ’Ž', 'ðŸ“¢', 'ðŸŽ¯', 'ðŸ›¡ï¸', 'ðŸ‘ï¸', 'ðŸ”', 'ðŸ“š', 'âš™ï¸', 'ðŸ†', 'ðŸ’¼', 'â¤ï¸', 'â­', 'ðŸŒŸ', 'ðŸ”¥', 'ðŸ’¡', 'ðŸš€'];

// Gradient options for cards (same as frontend)
const gradientOptions = [
  'linear-gradient(135deg, #e91e63, #ad1457)', // Pink
  'linear-gradient(135deg, #9c27b0, #6a1b9a)', // Purple
  'linear-gradient(135deg, #ff5722, #d84315)', // Orange
  'linear-gradient(135deg, #3f51b5, #283593)', // Blue
  'linear-gradient(135deg, #4caf50, #2e7d32)', // Green
  'linear-gradient(135deg, #ff9800, #f57c00)', // Amber
  'linear-gradient(135deg, #00bcd4, #0097a7)', // Cyan
  'linear-gradient(135deg, #795548, #5d4037)', // Brown
  'linear-gradient(135deg, #607d8b, #455a64)', // Blue Grey
  'linear-gradient(135deg, #e91e63, #ad1457)', // Pink (repeat)
  'linear-gradient(135deg, #9c27b0, #6a1b9a)', // Purple (repeat)
  'linear-gradient(135deg, #ff5722, #d84315)'  // Orange (repeat)
];

// Categories for content classification
const categories = ['concept', 'process', 'result', 'method', 'benefit', 'important', 'analysis', 'example', 'principle', 'application'];

// Extract key information from sentences
function extractKeyInfo(sentence, query) {
  const words = sentence.toLowerCase().split(' ');
  const queryWords = query.toLowerCase().split(' ');
  
  // Extract key points by looking for important phrases
  const keyIndicators = ['important', 'significant', 'crucial', 'essential', 'key', 'main', 'primary', 'major'];
  const processIndicators = ['process', 'method', 'step', 'procedure', 'mechanism', 'way'];
  const exampleIndicators = ['example', 'instance', 'case', 'such as', 'including', 'like'];
  const applicationIndicators = ['used', 'applied', 'application', 'utilize', 'employ', 'implement'];
  
  let hasKeyInfo = keyIndicators.some(indicator => sentence.toLowerCase().includes(indicator));
  let hasProcess = processIndicators.some(indicator => sentence.toLowerCase().includes(indicator));
  let hasExample = exampleIndicators.some(indicator => sentence.toLowerCase().includes(indicator));
  let hasApplication = applicationIndicators.some(indicator => sentence.toLowerCase().includes(indicator));
  
  return {
    isKeyPoint: hasKeyInfo,
    isProcess: hasProcess,
    isExample: hasExample,
    isApplication: hasApplication,
    relevanceScore: queryWords.filter(word => sentence.toLowerCase().includes(word)).length
  };
}

// Extract detailed information from content
function extractDetailedInfo(content, query) {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 30);
  
  const keyPoints = [];
  const examples = [];
  const applications = [];
  const processes = [];
  
  sentences.forEach(sentence => {
    const info = extractKeyInfo(sentence, query);
    
    if (info.relevanceScore > 0) {
      if (info.isKeyPoint && keyPoints.length < 3) {
        keyPoints.push(sentence);
      } else if (info.isExample && examples.length < 2) {
        examples.push(sentence);
      } else if (info.isApplication && applications.length < 2) {
        applications.push(sentence);
      } else if (info.isProcess && processes.length < 2) {
        processes.push(sentence);
      }
    }
  });
  
  return { keyPoints, examples, applications, processes };
}

// Generate card-based infographic content using AI
async function generateCardContent(query, language = 'english', researchContent = '') {
  try {
    const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
    if (!togetherApiKey) {
      console.log('Together AI API key not found, using fallback content processing');
      return generateFallbackCards(query, researchContent);
    }

    const systemPrompt = `You are an expert content analyzer that creates detailed educational card-based infographics from research content.

Your task is to extract key insights and create comprehensive cards that are:
- Educational and detailed with rich information
- Properly categorized with specific details
- Include practical examples and applications
- Provide context and background information
- Show relationships and connections

Return ONLY a JSON object in this exact format:
{
  "success": true,
  "topic": "Main Topic Title",
  "cards": [
    {
      "id": 1,
      "title": "Comprehensive Card Title",
      "description": "Detailed description with specific information, examples, and context (200-300 characters)",
      "detailedInfo": "Extended explanation with technical details, processes, mechanisms, or step-by-step information (300-500 characters)",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "examples": ["Example 1", "Example 2"],
      "applications": ["Application 1", "Application 2"],
      "relatedConcepts": ["Concept 1", "Concept 2"],
      "importance": "Why this is important or significant",
      "icon": "ðŸ’Ž",
      "gradient": "linear-gradient(135deg, #e91e63, #ad1457)",
      "category": "concept",
      "difficulty": "intermediate",
      "timeToRead": 3,
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}

Extract 8-12 comprehensive insights from the content.
Make each card information-rich with multiple data points.
Use varied categories: concept, process, result, method, benefit, important, analysis, example, principle, application, mechanism, theory
Include practical examples, applications, and real-world connections.`;

    const userPrompt = `Create comprehensive educational infographic cards for: ${query}

Research content to analyze:
${researchContent ? researchContent.substring(0, 6000) : 'Create general educational content about the topic'}

Requirements:
1. Extract 8-12 key insights with DETAILED information
2. Create comprehensive card titles (3-5 words each)
3. Write detailed descriptions (200-300 characters per card)
4. Add extended explanations with technical details (300-500 characters)
5. Include 3 key points per card
6. Provide 2 practical examples per card
7. List 2 real-world applications per card
8. Mention 2 related concepts per card
9. Explain importance/significance
10. Categorize appropriately with difficulty levels
11. Add relevant tags for organization
12. Make it suitable for ${language} language understanding

Focus on creating information-rich, educational cards that provide comprehensive understanding of ${query}.
Include scientific details, processes, mechanisms, examples, applications, and connections to other concepts.`;

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${togetherApiKey}`
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 6000,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const cardData = JSON.parse(jsonMatch[0]);
      
      // Assign icons and gradients to cards if not provided
      if (cardData.cards && Array.isArray(cardData.cards)) {
        cardData.cards = cardData.cards.map((card, index) => ({
          ...card,
          icon: card.icon || iconOptions[index % iconOptions.length],
          gradient: card.gradient || gradientOptions[index % gradientOptions.length],
          // Ensure all required fields are present
          keyPoints: card.keyPoints || [],
          examples: card.examples || [],
          applications: card.applications || [],
          relatedConcepts: card.relatedConcepts || [],
          importance: card.importance || '',
          difficulty: card.difficulty || 'intermediate',
          timeToRead: card.timeToRead || 2,
          tags: card.tags || []
        }));
      }
      
      return cardData;
    } else {
      throw new Error('Could not extract JSON from AI response');
    }
    
  } catch (error) {
    console.error('Error generating card content with AI:', error);
    return generateFallbackCards(query, researchContent);
  }
}

// Generate fallback cards when AI fails
function generateFallbackCards(query, researchContent = '') {
  try {
    let cards = [];
    
    if (researchContent && researchContent.length > 100) {
      // Process research content into detailed cards
      const sentences = researchContent
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 50 && s.length < 400)
        .slice(0, 10);

      cards = sentences.map((sentence, index) => {
        // Extract title from first few words
        const words = sentence.split(' ');
        let title = words.slice(0, 4).join(' ');
        title = title.replace(/^(the|a|an|in|on|at|to|for|of|with|by)\s+/i, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        // Create detailed description
        let description = sentence.length > 200 ? 
          sentence.substring(0, 200) + '...' : 
          sentence;
        
        // Extract detailed information from surrounding content
        const startIndex = researchContent.indexOf(sentence);
        const contextStart = Math.max(0, startIndex - 300);
        const contextEnd = Math.min(researchContent.length, startIndex + sentence.length + 300);
        const context = researchContent.substring(contextStart, contextEnd);
        
        const detailedInfo = extractDetailedInfo(context, query);
        
        // Determine category based on content
        let category = 'concept';
        const lowerSentence = sentence.toLowerCase();
        if (lowerSentence.includes('process') || lowerSentence.includes('step')) category = 'process';
        else if (lowerSentence.includes('result') || lowerSentence.includes('outcome')) category = 'result';
        else if (lowerSentence.includes('method') || lowerSentence.includes('technique')) category = 'method';
        else if (lowerSentence.includes('benefit') || lowerSentence.includes('advantage')) category = 'benefit';
        else if (lowerSentence.includes('important') || lowerSentence.includes('key')) category = 'important';
        else if (lowerSentence.includes('example') || lowerSentence.includes('instance')) category = 'example';
        else if (lowerSentence.includes('application') || lowerSentence.includes('used')) category = 'application';

        // Determine difficulty
        let difficulty = 'intermediate';
        if (words.length < 15 || sentence.includes('basic') || sentence.includes('simple')) difficulty = 'beginner';
        else if (words.length > 25 || sentence.includes('complex') || sentence.includes('advanced')) difficulty = 'advanced';

        // Extract tags from content
        const tags = [];
        const commonTerms = query.toLowerCase().split(' ');
        commonTerms.forEach(term => {
          if (sentence.toLowerCase().includes(term) && term.length > 2) {
            tags.push(term);
          }
        });

        // Add technical terms as tags
        const technicalTerms = sentence.match(/\b[A-Z][a-z]*(?:[A-Z][a-z]*)*\b/g) || [];
        tags.push(...technicalTerms.slice(0, 2).map(t => t.toLowerCase()));

        return {
          id: index + 1,
          title: title,
          description: description,
          detailedInfo: `${sentence} This concept relates to the broader understanding of ${query} and its various applications in real-world scenarios.`,
          keyPoints: detailedInfo.keyPoints.slice(0, 3),
          examples: detailedInfo.examples.slice(0, 2),
          applications: detailedInfo.applications.slice(0, 2),
          relatedConcepts: detailedInfo.processes.slice(0, 2),
          importance: `This is crucial for understanding ${query} because it provides foundational knowledge for further learning.`,
          icon: iconOptions[index % iconOptions.length],
          gradient: gradientOptions[index % gradientOptions.length],
          category: category,
          difficulty: difficulty,
          timeToRead: Math.ceil(words.length / 50), // Rough reading time estimate
          tags: tags.slice(0, 3)
        };
      });
    } else {
      // Generate generic detailed cards for the topic
      const genericCards = [
        {
          title: 'Core Concept',
          description: `Understanding the fundamental principles and basic mechanisms of ${query} and how it functions in various contexts.`,
          detailedInfo: `${query} represents a fundamental concept that encompasses multiple interconnected processes and principles. This foundational understanding is essential for grasping more complex applications and theoretical frameworks.`,
          keyPoints: [`Primary mechanism of ${query}`, `Key components involved`, `Basic operational principles`],
          examples: [`Natural occurrence of ${query}`, `Laboratory demonstration`],
          applications: [`Industrial applications`, `Scientific research`],
          relatedConcepts: [`Associated processes`, `Related phenomena`],
          importance: `Essential foundation for understanding advanced concepts in this field`,
          category: 'concept',
          difficulty: 'beginner',
          timeToRead: 3,
          tags: ['fundamental', 'basic', 'concept']
        },
        {
          title: 'Main Process',
          description: `Detailed examination of how ${query} works, including step-by-step mechanisms and underlying scientific principles.`,
          detailedInfo: `The process of ${query} involves multiple sequential steps and complex interactions between various components. Understanding this process is crucial for practical applications and theoretical comprehension.`,
          keyPoints: [`Step-by-step process`, `Key interactions`, `Critical factors`],
          examples: [`Process in action`, `Real-world demonstration`],
          applications: [`Practical implementation`, `Technology applications`],
          relatedConcepts: [`Supporting processes`, `Connected mechanisms`],
          importance: `Critical for practical understanding and application`,
          category: 'process',
          difficulty: 'intermediate',
          timeToRead: 4,
          tags: ['process', 'mechanism', 'steps']
        },
        {
          title: 'Important Benefits',
          description: `Comprehensive analysis of the advantages, positive impacts, and significant benefits of ${query} in various contexts.`,
          detailedInfo: `The benefits of ${query} extend across multiple domains, providing both immediate and long-term advantages. These benefits have far-reaching implications for various fields and applications.`,
          keyPoints: [`Primary advantages`, `Long-term benefits`, `Positive impacts`],
          examples: [`Beneficial outcomes`, `Success stories`],
          applications: [`Beneficial applications`, `Positive implementations`],
          relatedConcepts: [`Associated benefits`, `Related advantages`],
          importance: `Understanding benefits drives practical applications and research`,
          category: 'benefit',
          difficulty: 'intermediate',
          timeToRead: 3,
          tags: ['benefits', 'advantages', 'positive']
        },
        {
          title: 'Practical Applications',
          description: `Real-world uses, implementations, and practical applications of ${query} across different industries and fields.`,
          detailedInfo: `The practical applications of ${query} span numerous industries and research fields, demonstrating its versatility and importance in modern technology and scientific advancement.`,
          keyPoints: [`Industrial uses`, `Research applications`, `Commercial implementations`],
          examples: [`Industry example`, `Research application`],
          applications: [`Current technologies`, `Future possibilities`],
          relatedConcepts: [`Implementation methods`, `Technical requirements`],
          importance: `Demonstrates real-world value and practical significance`,
          category: 'application',
          difficulty: 'intermediate',
          timeToRead: 4,
          tags: ['practical', 'applications', 'industry']
        },
        {
          title: 'Key Results',
          description: `Expected outcomes, measurable results, and significant achievements related to ${query} and its applications.`,
          detailedInfo: `The results and outcomes associated with ${query} provide measurable evidence of its effectiveness and importance. These results guide future research and practical implementations.`,
          keyPoints: [`Measurable outcomes`, `Expected results`, `Performance metrics`],
          examples: [`Successful results`, `Measured outcomes`],
          applications: [`Result-based applications`, `Performance-driven uses`],
          relatedConcepts: [`Outcome factors`, `Result mechanisms`],
          importance: `Results validate theoretical understanding and guide practical decisions`,
          category: 'result',
          difficulty: 'intermediate',
          timeToRead: 3,
          tags: ['results', 'outcomes', 'metrics']
        },
        {
          title: 'Research Methods',
          description: `Scientific approaches, research methodologies, and investigative techniques used to study and understand ${query}.`,
          detailedInfo: `Research methods for studying ${query} involve sophisticated techniques and methodologies that enable scientists and researchers to gain deeper insights and make new discoveries.`,
          keyPoints: [`Research techniques`, `Scientific methods`, `Investigation approaches`],
          examples: [`Laboratory methods`, `Field research`],
          applications: [`Research protocols`, `Investigation procedures`],
          relatedConcepts: [`Research tools`, `Analytical methods`],
          importance: `Essential for advancing scientific understanding and knowledge`,
          category: 'method',
          difficulty: 'advanced',
          timeToRead: 5,
          tags: ['research', 'methods', 'scientific']
        }
      ];

      cards = genericCards.map((card, index) => ({
        id: index + 1,
        title: card.title,
        description: card.description,
        detailedInfo: card.detailedInfo,
        keyPoints: card.keyPoints,
        examples: card.examples,
        applications: card.applications,
        relatedConcepts: card.relatedConcepts,
        importance: card.importance,
        icon: iconOptions[index % iconOptions.length],
        gradient: gradientOptions[index % gradientOptions.length],
        category: card.category,
        difficulty: card.difficulty,
        timeToRead: card.timeToRead,
        tags: card.tags
      }));
    }

    return {
      success: true,
      topic: query,
      cards: cards
    };

  } catch (error) {
    console.error('Error in fallback card generation:', error);
    return {
      success: false,
      error: 'Failed to generate cards',
      cards: []
    };
  }
}

// Generate HTML representation of cards
function generateCardsHtml(cards) {
  if (!cards || cards.length === 0) {
    return '<div>No cards generated</div>';
  }

  const cardsHtml = cards.map(card => `
    <div style="background: ${card.gradient}; border-radius: 20px; padding: 2rem; color: white; margin: 1rem; min-height: 200px; display: inline-block; width: 300px; vertical-align: top;">
      <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; font-size: 24px;">
        ${card.icon}
      </div>
      <h3 style="font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: white;">
        ${card.title}
      </h3>
      <p style="font-size: 0.95rem; line-height: 1.5; opacity: 0.9; color: white;">
        ${card.description}
      </p>
    </div>
  `).join('');

  return `
    <div style="padding: 2rem; background-color: #f5f5f5; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; color: #333; margin-bottom: 0.5rem;">Card-based Infographic</h1>
      </div>
      <div style="text-align: center;">
        ${cardsHtml}
      </div>
    </div>
  `;
}

// Routes

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Card-Based Infographic API',
    version: '2.0.0',
    features: ['AI-Generated Cards', 'Fallback Processing', 'Multi-language Support'],
    improvements: ['Simplified card design', 'Better content extraction', 'Faster generation'],
    timestamp: new Date().toISOString()
  });
});

// Generate card-based infographic  
router.post('/generate', async (req, res) => {
  try {
    const { query, content, language = 'english' } = req.body;
    
    if (!query && !content) {
      return res.status(400).json({
        error: 'Query or content is required'
      });
    }

    const infographicQuery = query || content.substring(0, 200) + '...';
    console.log(`ðŸŽ¨ Generating card-based infographic for: ${infographicQuery}`);

    const startTime = Date.now();
    const cardData = await generateCardContent(infographicQuery, language, content);
    const processingTime = (Date.now() - startTime) / 1000;

    // Generate simple HTML for the cards that can be used as SVG alternative
    const cardsHtml = generateCardsHtml(cardData.cards || []);

    // Store the card data for the frontend to access
    const responseData = {
      status: 'success',
      topic: infographicQuery,
      total_cards: cardData.cards ? cardData.cards.length : 0,
      flashcards: cardData.cards || [],
      processing_time: processingTime,
      svg_content: cardsHtml, // Return HTML instead of SVG
      mindmap: cardData,
      cards: cardData.cards || [], // Direct access to cards
      content_stats: {
        total: cardData.cards ? cardData.cards.length : 0,
        byType: {},
        byDifficulty: {},
        bySection: {}
      },
      processing_info: {
        original_length: content ? content.length : 0,
        cleaned_length: content ? content.length : 0,
        chunks_created: cardData.cards ? cardData.cards.length : 0,
        chunks_retained: cardData.cards ? cardData.cards.length : 0
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error in card generation:', error);
    res.status(500).json({
      error: 'Failed to generate card infographic',
      message: error.message
    });
  }
});

// Generate cards from simple data (legacy support)
router.post('/generate-cards', async (req, res) => {
  try {
    const { query, content, options = {} } = req.body;
    
    if (!query && !content) {
      return res.status(400).json({
        success: false,
        error: 'Query or content is required'
      });
    }

    console.log(`ðŸ”„ Generating simple cards for: ${query}`);

    const fallbackData = generateFallbackCards(query, content);

    res.json({
      ...fallbackData,
      query: query,
      processing_time: 0.1,
      type: 'simple-cards',
      card_count: fallbackData.cards ? fallbackData.cards.length : 0
    });

  } catch (error) {
    console.error('Error generating simple cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate simple cards',
      message: error.message
    });
  }
});

// Get available card templates
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'educational',
      name: 'Educational Content',
      description: 'Perfect for learning materials, tutorials, and explanations',
      example_cards: 6,
      best_for: ['Science topics', 'How-to guides', 'Concept explanations']
    },
    {
      id: 'process',
      name: 'Process Flow',
      description: 'Step-by-step processes and workflows',
      example_cards: 8,
      best_for: ['Procedures', 'Workflows', 'Instructions']
    },
    {
      id: 'comparison',
      name: 'Comparison',
      description: 'Compare different concepts, methods, or ideas',
      example_cards: 6,
      best_for: ['Pros vs Cons', 'Different approaches', 'Alternatives']
    },
    {
      id: 'summary',
      name: 'Content Summary',
      description: 'Key points and highlights from longer content',
      example_cards: 10,
      best_for: ['Article summaries', 'Research highlights', 'Key takeaways']
    }
  ];

  res.json({
    success: true,
    templates: templates,
    total_templates: templates.length,
    features: ['AI-powered content extraction', 'Responsive card design', 'Multi-language support']
  });
});

// Analyze content for card potential
router.post('/analyze', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Content must be at least 50 characters long'
      });
    }

    // Analyze content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = content.split(/\s+/).length;
    
    const analysis = {
      content_length: content.length,
      word_count: words,
      sentence_count: sentences.length,
      estimated_cards: Math.min(Math.max(Math.floor(sentences.length / 2), 3), 12),
      readability: words > 100 ? 'good' : 'limited',
      has_structure: content.includes('\n') || sentences.length > 5,
      suggested_template: words > 200 ? 'summary' : sentences.length > 8 ? 'educational' : 'process'
    };

    res.json({
      success: true,
      analysis: analysis,
      recommendations: {
        card_potential: analysis.estimated_cards >= 4 ? 'high' : 'medium',
        optimal_cards: analysis.estimated_cards,
        processing_approach: analysis.content_length > 1000 ? 'ai-extraction' : 'direct-processing'
      }
    });

  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

// Get API statistics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    api_stats: {
      version: '2.0.0',
      type: 'card-based-infographic',
      features: [
        'AI-powered card generation',
        'Fallback content processing', 
        'Multi-language support',
        'Responsive card design',
        'Category-based organization',
        'Icon and color coordination'
      ],
      card_types: [
        'concept',
        'process', 
        'result',
        'method',
        'benefit',
        'important',
        'analysis',
        'example',
        'principle',
        'application'
      ],
      supported_languages: ['english', 'hindi', 'spanish', 'french', 'german'],
      max_cards: 12,
      ai_model: 'mistralai/Mistral-7B-Instruct-v0.2'
    },
    performance: {
      avg_generation_time: '2-5 seconds',
      fallback_time: '< 1 second',
      max_content_length: '8000 characters',
      card_design: 'responsive-gradient-based'
    }
  });
});

module.exports = router;