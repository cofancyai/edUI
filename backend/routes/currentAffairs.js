const express = require('express');
const axios = require('axios');
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const cron = require('node-cron');

// Initialize RSS parser
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
  }
});

// Supabase configuration
const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// RSS Sources Configuration
const RSS_SOURCES = [
  {
    name: 'Times of India',
    feeds: [
      { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'General' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', category: 'Politics' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', category: 'Economy' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', category: 'International' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', category: 'Sports' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/5880659.cms', category: 'Science & Tech' }
    ]
  },
  {
    name: 'The Hindu',
    feeds: [
      { url: 'https://www.thehindu.com/feeder/default.rss', category: 'General' },
      { url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'Politics' },
      { url: 'https://www.thehindu.com/business/feeder/default.rss', category: 'Economy' },
      { url: 'https://www.thehindu.com/news/international/feeder/default.rss', category: 'International' },
      { url: 'https://www.thehindu.com/sport/feeder/default.rss', category: 'Sports' }
    ]
  },
  {
    name: 'Indian Express',
    feeds: [
      { url: 'https://indianexpress.com/feed/', category: 'General' },
      { url: 'https://indianexpress.com/section/india/feed/', category: 'Politics' },
      { url: 'https://indianexpress.com/section/business/feed/', category: 'Economy' },
      { url: 'https://indianexpress.com/section/world/feed/', category: 'International' },
      { url: 'https://indianexpress.com/section/sports/feed/', category: 'Sports' }
    ]
  }
];

// Together AI Configuration
const TOGETHER_AI_URL = 'https://api.together.xyz/v1/chat/completions';

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

// AI Classification function
const classifyArticle = async (title, content) => {
  try {
    const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
    
    const prompt = `
Analyze this Indian current affairs article and classify it into ONE primary category.

ARTICLE TITLE: ${title}
ARTICLE CONTENT: ${content.substring(0, 500)}...

CATEGORIES:
- Politics (Government, Parliament, Elections, Policies)
- Economy (Banking, Markets, Business, Finance)
- International (Foreign Relations, Global Events)
- Sports (Cricket, Olympics, Championships)
- Science & Tech (Space, Technology, Research)
- Environment (Climate, Conservation, Pollution)
- Legal (Court Verdicts, Laws, Justice)

Respond with only the category name (e.g., "Politics" or "Economy").
`;

    const response = await axios.post(TOGETHER_AI_URL, {
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const category = response.data.choices[0]?.message?.content?.trim();
    
    // Validate category
    const validCategories = ['Politics', 'Economy', 'International', 'Sports', 'Science & Tech', 'Environment', 'Legal'];
    return validCategories.includes(category) ? category : 'General';
    
  } catch (error) {
    console.error('AI classification error:', error);
    return 'General'; // Fallback category
  }
};

// Collect RSS articles
const collectRSSArticles = async () => {
  const articles = [];
  
  for (const source of RSS_SOURCES) {
    for (const feed of source.feeds) {
      try {
        console.log(`Fetching RSS from: ${feed.url}`);
        const rssData = await parser.parseURL(feed.url);
        
        for (const item of rssData.items.slice(0, 10)) { // Limit to 10 articles per feed
          const publishedDate = new Date(item.pubDate || item.isoDate || Date.now());
          const content = item.contentSnippet || item.summary || item.description || '';
          
          // AI classify the article
          const aiCategory = await classifyArticle(item.title, content);
          
          const article = {
            title: item.title,
            content: content,
            link: item.link,
            published_date: publishedDate.toISOString(),
            source: source.name,
            rss_category: feed.category,
            ai_category: aiCategory,
            created_at: new Date().toISOString()
          };
          
          articles.push(article);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching RSS from ${feed.url}:`, error.message);
      }
    }
  }
  
  return articles;
};

// Store articles in database
const storeArticles = async (articles) => {
  try {
    // Remove duplicates based on title
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    console.log(`Storing ${uniqueArticles.length} unique articles`);
    
    const { data, error } = await supabase
      .from('current_affairs_articles')
      .upsert(uniqueArticles, { 
        onConflict: 'title',
        ignoreDuplicates: true 
      });
    
    if (error) {
      console.error('Error storing articles:', error);
      throw error;
    }
    
    console.log(`Successfully stored ${uniqueArticles.length} articles`);
    return { success: true, count: uniqueArticles.length };
    
  } catch (error) {
    console.error('Error in storeArticles:', error);
    throw error;
  }
};

// Generate quiz from articles
const generateQuiz = async (articles, category, timeframe) => {
  try {
    console.log('ðŸ§  QUIZ GENERATION STARTED', { category, timeframe, articleCount: articles.length });
    
    const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
    
    // Prepare article content for AI
    const articleContent = articles.map(article => 
      `${article.title}: ${article.content}`
    ).join('\n\n');
    
    const prompt = `
Based on these ${category} current affairs articles from ${timeframe}, create 5 multiple choice questions for competitive exam preparation:

ARTICLES:
${articleContent.substring(0, 2000)}

Requirements:
1. Create exactly 5 questions
2. Each question should have 4 options (A, B, C, D)
3. Mark the correct answer
4. Focus on facts, dates, numbers, names mentioned in articles
5. Make questions suitable for competitive exams like UPSC, Banking, SSC

Format each question as:
Q1: [Question text]
A) [Option 1]
B) [Option 2] 
C) [Option 3]
D) [Option 4]
Correct Answer: [A/B/C/D]

---
`;

    const response = await axios.post(TOGETHER_AI_URL, {
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('=== TOGETHER AI RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    const quizContent = response.data.choices[0]?.message?.content;
    console.log('=== QUIZ CONTENT ===');
    console.log('Raw content:', quizContent);

    // Parse quiz content into structured format
    const questions = parseQuizContent(quizContent);
    console.log('=== PARSED QUESTIONS ===');
    console.log('Questions count:', questions.length);
    console.log('Questions:', questions);

    return questions;
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    return [];
  }
};

// Parse quiz content into structured format
// Parse quiz content into structured format
const parseQuizContent = (content) => {
  console.log('ðŸ“ PARSING CONTENT:', content);
  
  const questions = [];
  
  if (!content || typeof content !== 'string') {
    console.log('âŒ Invalid content for parsing');
    return questions;
  }
  
  // Split by Q1:, Q2:, Q3:, etc.
  const questionBlocks = content.split(/Q\d+:\s*/).filter(block => block.trim());
  console.log('ðŸ“ Question blocks found:', questionBlocks.length);
  
  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n').filter(line => line.trim());
    
    if (lines.length >= 5) { // At least question + 4 options + correct answer
      const questionText = lines[0].trim();
      const options = [];
      let correctAnswer = '';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^[A-D]\)/)) {
          options.push(line);
        } else if (line.startsWith('Correct Answer:')) {
          correctAnswer = line.replace('Correct Answer:', '').trim();
        }
      }
      
      if (questionText && options.length === 4 && correctAnswer) {
        questions.push({
          id: index + 1,
          question: questionText,
          options: options,
          correctAnswer: correctAnswer,
          category: 'Current Affairs'
        });
        console.log(`âœ… Parsed question ${index + 1}: ${questionText.substring(0, 50)}...`);
      } else {
        console.log(`âŒ Skipped question ${index + 1}: questionText=${!!questionText}, options=${options.length}, correctAnswer=${!!correctAnswer}`);
      }
    }
  });
  
  return questions.slice(0, 5); // Ensure only 5 questions
};

// ROUTES

// Daily collection endpoint (for cron job)
router.post('/collect', async (req, res) => {
  try {
    console.log('Starting daily current affairs collection...');
    
    const articles = await collectRSSArticles();
    const result = await storeArticles(articles);
    
    res.json({
      success: true,
      message: 'Current affairs collection completed',
      data: result
    });
    
  } catch (error) {
    console.error('Collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect current affairs'
    });
  }
});

// Get articles by timeframe and category
router.get('/articles', async (req, res) => {
  try {
    const { timeframe = 'today', category = 'all' } = req.query;
    
    // Calculate date range
    let startDate;
    const endDate = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Build query
    let query = supabase
      .from('current_affairs_articles')
      .select('*')
      .gte('published_date', startDate.toISOString())
      .lte('published_date', endDate.toISOString())
      .order('published_date', { ascending: false });
    
    if (category !== 'all') {
      query = query.eq('ai_category', category);
    }
    
    const { data: articles, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Group articles by category
    const groupedArticles = {};
    articles.forEach(article => {
      const cat = article.ai_category || 'General';
      if (!groupedArticles[cat]) {
        groupedArticles[cat] = [];
      }
      groupedArticles[cat].push(article);
    });
    
    res.json({
      success: true,
      data: {
        timeframe,
        category,
        articles: articles,
        grouped: groupedArticles,
        total: articles.length
      }
    });
    
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch articles'
    });
  }
});

// Get available categories
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('current_affairs_articles')
      .select('ai_category')
      .not('ai_category', 'is', null);
    
    if (error) {
      throw error;
    }
    
    const uniqueCategories = [...new Set(categories.map(c => c.ai_category))];
    
    res.json({
      success: true,
      data: uniqueCategories.sort()
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch categories'
    });
  }
});

// Generate/Get quiz
router.get('/quiz', async (req, res) => {
  console.log('ðŸ§  QUIZ ENDPOINT CALLED');
  console.log('Query params:', req.query);
  
  try {
    const { timeframe = 'today', category = 'Politics' } = req.query;
    console.log('Parsed params:', { timeframe, category });
    
    // Get articles for the timeframe and category
    let startDate;
    const endDate = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }
    
    const { data: articles, error } = await supabase
      .from('current_affairs_articles')
      .select('*')
      .eq('ai_category', category)
      .gte('published_date', startDate.toISOString())
      .lte('published_date', endDate.toISOString())
      .limit(10);

    console.log('ðŸ“Š DATABASE QUERY RESULT:', { 
      error: error?.message, 
      articleCount: articles?.length,
      category,
      startDate: startDate.toISOString()
    });
    
    if (error) {
      throw error;
    }
    
    if (articles.length === 0) {
      return res.json({
        success: true,
        data: {
          questions: [],
          message: `No articles found for ${category} in ${timeframe}`
        }
      });
    }
    
    // Generate quiz questions
    const questions = await generateQuiz(articles, category, timeframe);
    
    res.json({
      success: true,
      data: {
        questions,
        articleCount: articles.length,
        category,
        timeframe
      }
    });
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('current_affairs_articles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Current Affairs service is healthy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});

// Schedule daily collection at 6 AM IST
cron.schedule('0 6 * * *', async () => {
  console.log('ðŸ•°ï¸ Running scheduled current affairs collection at 6 AM IST...');
  try {
    const articles = await collectRSSArticles();
    const result = await storeArticles(articles);
    console.log('âœ… Scheduled collection completed:', result);
  } catch (error) {
    console.error('âŒ Scheduled collection failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('â° Current Affairs daily collection scheduled for 6:00 AM IST');

module.exports = router;