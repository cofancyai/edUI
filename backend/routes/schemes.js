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

// AI processing for user input
async function processUserInput(userInput, language = 'english') {
  try {
    const openRouterKey = await getCredential('VITE_OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OpenRouter API key not found');
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured information from natural language queries about government schemes. Extract user demographics, intent, and requirements.'
          },
          {
            role: 'user',
            content: `Extract structured information from: "${userInput}" in ${language}. Return JSON with demographics (age, gender, social_category, annual_income, location), intent (primary_goal, specific_needs), and missing_info array.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse JSON from AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('Error processing user input:', error);
    throw error;
  }
}

// Routes

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Schemes API',
    timestamp: new Date().toISOString()
  });
});

// Process user requirements and find schemes
router.post('/find-schemes', async (req, res) => {
  try {
    const { query, language = 'english' } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    console.log(`Processing schemes query: "${query}" in ${language}`);

    // Step 1: AI processing to understand user requirements
    const userProfile = await processUserInput(query, language);

    // Step 2: Query schemes database (placeholder - replace with actual DB)
    const mockSchemes = [
      {
        id: 1,
        name: 'Stand-Up India Scheme',
        ministry: 'Ministry of Finance',
        category: 'Business & Entrepreneurship',
        target_beneficiaries: ['SC', 'ST', 'Women'],
        age_criteria: { min: 18, max: 65 },
        income_criteria: { max: null },
        loan_amount: { min: 1000000, max: 10000000 },
        benefits: ['No collateral for loans up to â‚¹10 lakhs', 'Mentorship support'],
        eligibility: 'SC/ST/Women entrepreneurs, First-time entrepreneur',
        application_url: 'https://www.standupmitra.in/'
      },
      {
        id: 2,
        name: 'Pradhan Mantri MUDRA Yojana',
        ministry: 'Ministry of Finance', 
        category: 'Business & Entrepreneurship',
        target_beneficiaries: ['All'],
        age_criteria: { min: 18, max: null },
        income_criteria: { max: null },
        loan_amount: { min: 50000, max: 1000000 },
        benefits: ['Three categories: Shishu, Kishore, Tarun', 'No collateral required'],
        eligibility: 'Micro business entrepreneurs',
        application_url: 'https://www.mudra.org.in/'
      }
    ];

    // Step 3: Calculate relevance scores
    const relevantSchemes = mockSchemes.map(scheme => {
      let score = 0;
      let reasons = [];

      // Demographic matching
      if (userProfile.demographics?.social_category && 
          scheme.target_beneficiaries.includes(userProfile.demographics.social_category)) {
        score += 30;
        reasons.push(`Matches ${userProfile.demographics.social_category} category`);
      }

      if (userProfile.demographics?.gender === 'female' && 
          scheme.target_beneficiaries.includes('Women')) {
        score += 25;
        reasons.push('Specifically for women');
      }

      // Intent matching
      if (userProfile.intent?.primary_goal === 'business_startup' && 
          scheme.category.includes('Business')) {
        score += 40;
        reasons.push('Perfect for business startup');
      }

      // Age eligibility
      if (userProfile.demographics?.age) {
        const age = userProfile.demographics.age;
        if ((!scheme.age_criteria.min || age >= scheme.age_criteria.min) &&
            (!scheme.age_criteria.max || age <= scheme.age_criteria.max)) {
          score += 20;
          reasons.push('Age eligible');
        }
      }

      return {
        ...scheme,
        relevance_score: Math.min(score, 100),
        match_reasons: reasons,
        why_relevant: reasons.join(', ')
      };
    }).filter(scheme => scheme.relevance_score > 50)
      .sort((a, b) => b.relevance_score - a.relevance_score);

    res.json({
      status: 'success',
      user_profile: userProfile,
      total_schemes_found: relevantSchemes.length,
      schemes: relevantSchemes,
      missing_info: userProfile.missing_info || [],
      processing_time: '2.1s'
    });

  } catch (error) {
    console.error('Error in find-schemes:', error);
    res.status(500).json({
      error: 'Failed to process schemes query',
      message: error.message
    });
  }
});

// Voice input processing
router.post('/process-voice', async (req, res) => {
  try {
    const { audioData, language = 'english' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({
        error: 'Audio data is required'
      });
    }

    // TODO: Implement Google Speech-to-Text conversion
    // For now, return placeholder
    res.json({
      status: 'success',
      transcribed_text: 'Voice processing not yet implemented',
      confidence: 0.95,
      language_detected: language
    });

  } catch (error) {
    console.error('Error processing voice:', error);
    res.status(500).json({
      error: 'Failed to process voice input',
      message: error.message
    });
  }
});

// Text-to-speech for scheme explanations
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, language = 'en-US' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    // TODO: Implement Google Text-to-Speech
    // For now, return placeholder
    res.json({
      status: 'success',
      audio_url: 'placeholder_audio_url',
      text_processed: text.length,
      language: language
    });

  } catch (error) {
    console.error('Error in text-to-speech:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      message: error.message
    });
  }
});

module.exports = router;