const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Function to retrieve credentials from Supabase
async function getCredential(name) {
  try {
    const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
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
    
    if (data && data.config && data.config.key) {
      return data.config.key;
    }
    
    return null;
  } catch (err) {
    console.error(`Failed to fetch credential ${name}:`, err);
    return null;
  }
}

// OCR function using Google Vision API
async function extractTextFromImage(imageBuffer) {
  try {
    const googleCloudApiKey = await getCredential('GOOGLE_CLOUD_VISION_API_KEY');
    
    if (!googleCloudApiKey) {
      throw new Error('Google Cloud Vision API key not found');
    }

    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`,
      {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.responses && response.data.responses[0].textAnnotations) {
      return response.data.responses[0].textAnnotations[0].description || '';
    } else {
      return '';
    }
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// AI Evaluation function
async function evaluateAnswer(extractedText, marks, question = '') {
  try {
    const geminiApiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found');
    }

    const prompt = `You are an expert UPSC examiner evaluating answers. Be strict but fair.

ANSWER TO EVALUATE:
${extractedText}

QUESTION: ${question || 'General UPSC Question'}
TOTAL MARKS: ${marks}

Evaluate this answer and provide:
1. Score out of ${marks} marks (be realistic and strict)
2. Brief feedback (2-3 sentences)
3. Key missing points or improvements needed
4. Grammar/writing corrections if any

Respond in this JSON format:
{
  "score": number,
  "feedback": "string",
  "missing_points": "string",
  "corrections": "string"
}

Consider UPSC evaluation criteria:
- Content accuracy and relevance
- Analytical thinking and depth
- Structure and presentation
- Use of examples and case studies
- Balanced perspective
- Conclusion quality`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.candidates && response.data.candidates[0].content) {
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        return evaluation;
      } else {
        // Fallback if JSON parsing fails
        return {
          score: Math.floor(marks * 0.6), // Default to 60%
          feedback: generatedText,
          missing_points: "Please review the content structure and add more relevant examples.",
          corrections: "Check grammar and sentence formation."
        };
      }
    } else {
      throw new Error('No response from Gemini API');
    }
  } catch (error) {
    console.error('AI Evaluation Error:', error);
    throw new Error('Failed to evaluate answer');
  }
}

// Route: Evaluate Answer
router.post('/evaluate', upload.single('answer_image'), async (req, res) => {
  try {
    console.log('ðŸ“ Answer evaluation request received');
    
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { marks, question } = req.body;
    
    if (!marks || isNaN(marks) || marks <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid marks value is required'
      });
    }

    console.log(`ðŸ“Š Processing evaluation for ${marks} marks`);

    // Step 1: Extract text from image using OCR
    console.log('ðŸ” Extracting text from image...');
    const extractedText = await extractTextFromImage(req.file.buffer);
    
    if (!extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No text could be extracted from the image. Please ensure the image is clear and contains handwritten text.'
      });
    }

    console.log('âœ… Text extracted successfully');

    // Step 2: Evaluate answer using AI
    console.log('ðŸ¤– Evaluating answer with AI...');
    const evaluation = await evaluateAnswer(extractedText, parseInt(marks), question);

    console.log('âœ… Evaluation completed');

    // Return results
    res.json({
      success: true,
      data: {
        extracted_text: extractedText,
        score: evaluation.score,
        max_marks: parseInt(marks),
        feedback: evaluation.feedback,
        missing_points: evaluation.missing_points,
        corrections: evaluation.corrections,
        percentage: Math.round((evaluation.score / parseInt(marks)) * 100),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('âŒ Answer evaluation error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to evaluate answer',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route: Health check for answer evaluation service
router.get('/health', async (req, res) => {
  try {
    // Check if required API keys are available
    const geminiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
    const visionKey = await getCredential('GOOGLE_CLOUD_VISION_API_KEY');
    
    const status = {
      service: 'Answer Evaluation',
      status: 'operational',
      features: {
        ocr: visionKey ? 'available' : 'unavailable',
        ai_evaluation: geminiKey ? 'available' : 'unavailable'
      },
      timestamp: new Date().toISOString()
    };

    if (!geminiKey || !visionKey) {
      status.status = 'partial';
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      service: 'Answer Evaluation',
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route: Get evaluation history (if we add database later)
router.get('/history/:userId', async (req, res) => {
  try {
    // For now, return empty array
    // Later can implement database storage
    res.json({
      success: true,
      data: [],
      message: 'History feature coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
});

module.exports = router;