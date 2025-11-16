// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const youtubeRoutes = require('./routes/youtubeProxy');
const unifiedStudyHub = require('./routes/unifiedStudyHub');
const mockInterviewRoutes = require('./routes/mockInterview');
const answerEvaluationRoutes = require('./routes/answerEvaluation');
const currentAffairsRoutes = require('./routes/currentAffairs');
const schemesRoutes = require('./routes/schemes');
const mindmapRoutes = require('./routes/mindmap');
const flashcardsRoutes = require('./routes/flashcards');
const jobCollectorRoutes = require('./routes/jobCollector');

// Initialize Supabase client for credentials
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ✅ FIXED UTF-8 ENCODING MIDDLEWARE
app.use((req, res, next) => {
  // Set UTF-8 encoding for all responses
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  
  next();
});

// Initialize global variable for the API key
let YOUTUBE_API_KEY = null;

// Function to retrieve credentials from Supabase
async function getCredential(name) {
 try {
   // Define Supabase connection parameters
   const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
   const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
   
   // Create Supabase client
   const supabase = createClient(supabaseUrl, supabaseAnonKey);
   
   // Query credentials table
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
     console.log(`Successfully retrieved credential: ${name}`);
     return data.config.key;
   }
   
   console.log(`Credential ${name} found but no key property in config`);
   return null;
 } catch (err) {
   console.error(`Failed to fetch credential ${name}:`, err);
   return null;
 }
}

// Enhanced CORS with UTF-8 support
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://127.0.0.1:5173',
    'https://prepnx-web.vercel.app',
    'https://*.vercel.app',
    'https://www.prepnx.com',
    'https://prepnx.com'
    
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-api-key',
    'Accept',
    'Accept-Language',
    'Accept-Encoding'
  ],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Encoding'],
  optionsSuccessStatus: 200
}));

// Enhanced JSON parsing with UTF-8
app.use(express.json({ 
  limit: '50mb',
  type: ['application/json', 'text/plain']
}));

// Enhanced URL encoding with UTF-8
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 50000
}));

// Additional middleware for multilingual support
app.use((req, res, next) => {
  // Set additional headers for better Unicode support
  res.setHeader('Accept-Charset', 'utf-8');
  res.setHeader('Content-Language', 'en, hi, ta, te, bn, mr, gu, pa, kn, ml');
  
  // Log multilingual requests for debugging
  if (req.body && req.body.language && req.body.language !== 'english') {
    console.log(`🌍 Multilingual request detected: ${req.body.language}`);
  }
  
  next();
});

// Register routes
app.use('/api/youtube', youtubeRoutes);
app.use('/api/syllabus', unifiedStudyHub);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/answer-evaluation', answerEvaluationRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/research', require('./routes/research'));
app.use('/api/quiz', require('./routes/quiz'));       
app.use('/api/job-collector', jobCollectorRoutes);     

// Initialize API keys from Supabase
async function initializeApiKeys() {
 try {
   YOUTUBE_API_KEY = await getCredential('VITE_YOUTUBE_DATA_API');
   console.log(`YouTube API key ${YOUTUBE_API_KEY ? 'is' : 'is NOT'} configured`);
   
   // Check for Google Cloud API keys for Mock Interview
   const geminiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
   const ttsKey = await getCredential('GOOGLE_CLOUD_TTS_API_KEY');
   const sttKey = await getCredential('GOOGLE_CLOUD_STT_API_KEY');
   
   console.log(`Gemini API key ${geminiKey ? 'is' : 'is NOT'} configured`);
   console.log(`Text-to-Speech API key ${ttsKey ? 'is' : 'is NOT'} configured`);
   console.log(`Speech-to-Text API key ${sttKey ? 'is' : 'is NOT'} configured`);
   
   // Check for Answer Evaluation API keys
   const visionKey = await getCredential('GOOGLE_CLOUD_VISION_API_KEY');
   console.log(`Vision API key ${visionKey ? 'is' : 'is NOT'} configured`);
   
   // Check for OpenRouter API keys (updated)
   const openrouterKey = await getCredential('OPENROUTER_API_KEY');
   const legacyKey = await getCredential('VITE_OPENROUTER_API_KEY');
   console.log(`OpenRouter API key ${(openrouterKey || legacyKey) ? 'is' : 'is NOT'} configured`);
   
   // Make API key available to imported routes
   app.set('youtube_api_key', YOUTUBE_API_KEY);
   
   console.log('✅ YouTube routes registered at /api/youtube');
   console.log('✅ Unified Study Hub routes registered at /api/syllabus');
   console.log('✅ Mock Interview routes registered at /api/mock-interview');
   console.log('✅ Answer Evaluation routes registered at /api/answer-evaluation');
   console.log('✅ Current Affairs routes registered at /api/current-affairs');
   console.log('✅ Schemes routes registered at /api/schemes');
   console.log('✅ Mindmap routes registered at /api/mindmap');
   console.log('✅ FlashCards routes registered at /api/flashcards');
   console.log('✅ Research routes registered at /api/research');
   console.log('✅ Quiz routes registered at /api/quiz');
   console.log('✅ Job Collector routes registered at /api/job-collector');
   console.log('🌍 Multilingual support enabled (UTF-8)');
 } catch (err) {
   console.error('Error initializing API keys:', err);
 }
}

// Enhanced health check with UTF-8 test
app.get('/health', async (req, res) => {
 // Make sure YouTube API key is loaded
 if (!YOUTUBE_API_KEY) {
   try {
     YOUTUBE_API_KEY = await getCredential('VITE_YOUTUBE_DATA_API');
     app.set('youtube_api_key', YOUTUBE_API_KEY);
   } catch (err) {
     console.error('Error loading YouTube API key during health check:', err);
   }
 }
 
 // Check if required API keys are available
 const missingVars = [];
 if (!YOUTUBE_API_KEY) missingVars.push('YOUTUBE_API_KEY');
 
 // Check Google Cloud API keys for Mock Interview
 try {
   const geminiKey = await getCredential('GOOGLE_GEMINI_API_KEY');
   const ttsKey = await getCredential('GOOGLE_CLOUD_TTS_API_KEY');
   const sttKey = await getCredential('GOOGLE_CLOUD_STT_API_KEY');
   
   if (!geminiKey) missingVars.push('GOOGLE_GEMINI_API_KEY');
   if (!ttsKey) missingVars.push('GOOGLE_CLOUD_TTS_API_KEY');
   if (!sttKey) missingVars.push('GOOGLE_CLOUD_STT_API_KEY');
   
   // Check Answer Evaluation API keys
   const visionKey = await getCredential('GOOGLE_CLOUD_VISION_API_KEY');
   if (!visionKey) missingVars.push('GOOGLE_CLOUD_VISION_API_KEY');
   
   // Check OpenRouter API keys (check both old and new)
   const openrouterKey = await getCredential('OPENROUTER_API_KEY');
   const legacyKey = await getCredential('VITE_OPENROUTER_API_KEY');
   if (!openrouterKey && !legacyKey) missingVars.push('OPENROUTER_API_KEY');
   
 } catch (err) {
   console.error('Error checking API keys:', err);
 }
 
 // UTF-8 Test Data
 const utf8TestData = {
   tamil: 'ஒளிச்சேர்க்கை - photosynthesis',
   hindi: 'प्रकाश संश्लेषण - photosynthesis', 
   telugu: 'కాంతిసంశ్లేషణ - photosynthesis',
   bengali: 'সালোকসংশ্লেষণ - photosynthesis',
   emoji: '🌱🔬📚✨🌍',
   symbols: '★♦●◆▲'
 };
 
 if (missingVars.length > 0) {
   return res.status(500).json({ 
     status: 'error', 
     message: 'Server is running but missing required API keys', 
     missing: missingVars,
     utf8_test: utf8TestData,
     encoding: 'UTF-8',
     services: {
       youtube: YOUTUBE_API_KEY ? 'configured' : 'missing',
       mockInterview: missingVars.some(key => key.includes('GOOGLE')) ? 'partial' : 'configured',
       answerEvaluation: missingVars.some(key => key.includes('VISION') || key.includes('GEMINI')) ? 'partial' : 'configured',
       research: missingVars.some(key => key.includes('OPENROUTER')) ? 'partial' : 'configured',
       currentAffairs: missingVars.some(key => key.includes('OPENROUTER')) ? 'partial' : 'configured',
       schemes: missingVars.some(key => key.includes('OPENROUTER')) ? 'partial' : 'configured',
       mindmap: missingVars.some(key => key.includes('OPENROUTER')) ? 'partial' : 'configured',
       flashcards: missingVars.some(key => key.includes('OPENROUTER')) ? 'partial' : 'configured'
     }
   });
 }
 
 res.status(200).json({ 
   status: 'ok', 
   message: 'Server is running correctly with UTF-8 support',
   environment: process.env.NODE_ENV || 'development',
   encoding: 'UTF-8',
   utf8_test: utf8TestData,
   multilingual_support: {
     enabled: true,
     languages: ['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'punjabi', 'kannada', 'malayalam'],
     encoding: 'UTF-8'
   },
   services: {
     youtube: 'configured',
     unifiedStudyHub: 'configured',
     mockInterview: 'configured',
     answerEvaluation: 'configured',
     research: 'configured',
     currentAffairs: 'configured',
     schemes: 'configured',
     mindmap: 'configured',
     flashcards: 'configured',
     jobCollector: 'configured'
   },
   api_info: {
     model: 'meta-llama/llama-3.3-70b-instruct:free',
     provider: 'OpenRouter',
     multilingual: true
   }
 });
});

// UTF-8 test endpoint
app.get('/test-utf8', (req, res) => {
  const testContent = {
    message: 'UTF-8 Encoding Test',
    languages: {
      english: 'Photosynthesis is the process by which plants make food',
      tamil: 'ஒளிச்சேர்க்கை என்பது தாவரங்கள் உணவு உற்பத்தி செய்யும் முறையாகும்',
      hindi: 'प्रकाश संश्लेषण वह प्रक्रिया है जिससे पौधे भोजन बनाते हैं',
      telugu: 'కాంతిసంశ్లేషణ అనేది మొక్కలు ఆహారం తయారు చేసే ప్రక్రియ',
      bengali: 'সালোকসংশ্লেষণ হল সেই প্রক্রিয়া যার মাধ্যমে গাছপালা খাদ্য তৈরি করে'
    },
    symbols: {
      emoji: '🌱🔬📚✨🌍🚀💡',
      mathematical: '∫∑∆∇∂∞±≠≤≥',
      arrows: '←→↑↓↔↕⇐⇒⇑⇓',
      special: '★♦●◆▲▼♠♥♣♧'
    },
    timestamp: new Date().toISOString(),
    encoding: 'UTF-8'
  };
  
  res.json(testContent);
});

// Handle 404 errors
app.use((req, res) => {
 res.status(404).json({ 
   status: 'error', 
   message: `Route not found: ${req.method} ${req.originalUrl}`,
   available_endpoints: [
     '/health - Server health check with UTF-8 test',
     '/test-utf8 - UTF-8 encoding test',
     '/api/research - Content generation with multilingual support',
     '/api/flashcards - Flashcard generation',
     '/api/youtube - YouTube integration',
     '/api/mock-interview - Interview practice',
     '/api/current-affairs - Current affairs content'
   ]
 });
});

// Enhanced error handler with UTF-8 support
app.use((err, req, res, next) => {
 console.error('Unhandled error:', err);
 
 // Ensure error responses are also UTF-8
 res.setHeader('Content-Type', 'application/json; charset=utf-8');
 
 const errorResponse = {
   status: 'error', 
   message: err.message || 'Internal Server Error',
   encoding: 'UTF-8',
   timestamp: new Date().toISOString()
 };
 
 // Include stack trace in development
 if (process.env.NODE_ENV !== 'production') {
   errorResponse.stack = err.stack;
 }
 
 res.status(500).json(errorResponse);
});

// Set port
const PORT = process.env.PORT || 8080;

// Initialize API keys and then start the server
initializeApiKeys().then(() => {
 app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
   console.log(`📺 YouTube API key ${YOUTUBE_API_KEY ? 'is' : 'is NOT'} configured`);
   console.log(`🌍 Multilingual support: ENABLED (UTF-8)`);
   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
   console.log(`🧪 UTF-8 test: http://localhost:${PORT}/test-utf8`);
   console.log(`🎯 Available endpoints:`);
   console.log(`   📺 YouTube: http://localhost:${PORT}/api/youtube/search?q=example`);
   console.log(`   📚 Study Hub: http://localhost:${PORT}/api/syllabus/unified-study-hub`);
   console.log(`   🎤 Mock Interview: http://localhost:${PORT}/api/mock-interview/start-session`);
   console.log(`   ✅ Answer Evaluation: http://localhost:${PORT}/api/answer-evaluation/evaluate`);
   console.log(`   📰 Current Affairs: http://localhost:${PORT}/api/current-affairs/articles`);
   console.log(`   💳 Schemes: http://localhost:${PORT}/api/schemes/find-schemes`);
   console.log(`   🗺️ Mindmap: http://localhost:${PORT}/api/mindmap/generate`);
   console.log(`   📇 FlashCards: http://localhost:${PORT}/api/flashcards/generate`);
   console.log(`   🔬 Research: http://localhost:${PORT}/api/research`);
   console.log(`   💼 Job Collector: http://localhost:${PORT}/api/job-collector/health`);
 });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
 console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
 console.error('🚨 Uncaught Exception:', err);
 process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
 console.log('📴 SIGTERM received, shutting down gracefully');
 process.exit(0);
});

process.on('SIGINT', () => {
 console.log('📴 SIGINT received, shutting down gracefully');
 process.exit(0);
});
