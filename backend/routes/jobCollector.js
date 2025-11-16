const express = require('express');
const axios = require('axios');
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const cron = require('node-cron');

// Initialize RSS parser
const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; JobCollector/1.0)'
  }
});

// Supabase configuration
const supabaseUrl = 'https://bminlmgtoanbkilsnapc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaW5sbWd0b2FuYmtpbHNuYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTA0OTcsImV4cCI6MjA1ODg4NjQ5N30.YVW3pSPBx6v6bmLnt6UHSoHDliIQLfIIkFEyq3ETcdw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Together AI Configuration
const TOGETHER_AI_URL = 'https://api.together.xyz/v1/chat/completions';

// Job Sources Configuration (Following currentAffairs.js pattern)
const JOB_SOURCES = {
  government: [
    {
      name: 'Sarkari Result',
      feeds: [
        { url: 'https://www.sarkariresult.com/rss.xml', category: 'general' },
        { url: 'https://www.sarkariresult.com/latestjob/feed/', category: 'latest' }
      ]
    },
    {
      name: 'Employment News',
      feeds: [
        { url: 'https://employmentnews.gov.in/rss.xml', category: 'central' },
        { url: 'https://employmentnews.gov.in/NewEmp.aspx', category: 'weekly' }
      ]
    },
    {
      name: 'UPSC',
      feeds: [
        { url: 'https://upsc.gov.in/rss/what-new.xml', category: 'upsc' },
        { url: 'https://upsc.gov.in/rss/recruitment.xml', category: 'recruitment' }
      ]
    }
  ],
  corporate: [
    // Using free job APIs instead of scraping
    {
      name: 'Adzuna API',
      type: 'api',
      endpoint: 'https://api.adzuna.com/v1/api/jobs/in/search/1',
      params: {
        app_id: 'free_api_id',
        app_key: 'free_api_key',
        results_per_page: 50,
        what: 'software engineer'
      }
    }
  ],
  exams: [
    {
      name: 'NTA Official',
      feeds: [
        { url: 'https://nta.ac.in/rss.xml', category: 'nta' },
        { url: 'https://exams.nta.ac.in/rss/notifications.xml', category: 'exams' }
      ]
    },
    {
      name: 'UGC NET',
      feeds: [
        { url: 'https://ugcnet.nta.ac.in/rss.xml', category: 'ugc_net' }
      ]
    }
  ]
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

// AI Classification function (Same as currentAffairs.js)
const classifyJob = async (title, content) => {
  try {
    const togetherApiKey = await getCredential('VITE_OPENROUTER_API_KEY');
    
    const prompt = `
Analyze this Indian job posting and classify it into ONE primary category.

JOB TITLE: ${title}
JOB CONTENT: ${content.substring(0, 500)}...

CATEGORIES:
- graduates (Bachelor's degree required)
- post_graduates (Master's/MBA required) 
- engineering (Engineering degree required)
- doctors (Medical degree required)
- intermediate (12th pass jobs)
- matriculation (10th pass jobs)
- diploma (Diploma required)
- iti (ITI/Technical training)
- apprentice (Training positions)

For STATES, use these if it's a state-specific job:
- delhi, maharashtra, tamil_nadu, karnataka, uttar_pradesh, etc.

Respond with only the category name (e.g., "graduates" or "engineering").
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
    const validCategories = ['graduates', 'post_graduates', 'engineering', 'doctors', 'intermediate', 'matriculation', 'diploma', 'iti', 'apprentice'];
    return validCategories.includes(category) ? category : 'graduates';
    
  } catch (error) {
    console.error('AI classification error:', error);
    return 'graduates'; // Fallback category
  }
};

// Collect Government Jobs from RSS feeds
const collectGovernmentJobs = async () => {
  const jobs = [];
  
  for (const source of JOB_SOURCES.government) {
    for (const feed of source.feeds) {
      try {
        console.log(`Fetching Government RSS from: ${feed.url}`);
        const rssData = await parser.parseURL(feed.url);
        
        for (const item of rssData.items.slice(0, 20)) { // Limit to 20 jobs per feed
          const publishedDate = new Date(item.pubDate || item.isoDate || Date.now());
          const content = item.contentSnippet || item.summary || item.description || '';
          
          // AI classify the job
          const aiCategory = await classifyJob(item.title, content);
          
          // Extract deadline from content or set default
          const deadlineMatch = content.match(/last date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i);
          const deadline = deadlineMatch ? deadlineMatch[1] : 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 30 days from now
          
          const job = {
            post_date: publishedDate.toISOString().slice(0, 10),
            organization: source.name,
            posts: extractVacancyCount(content),
            job_type: 'Permanent',
            last_date: deadline,
            details_link: item.link,
            official_notification_link: item.link,
            source_website: source.name.toLowerCase().replace(/\s+/g, ''),
            category: aiCategory,
            is_state_job: isStateJob(content),
            state: extractState(content),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            batch_id: `job_collection_${Date.now()}`
          };
          
          jobs.push(job);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error fetching RSS from ${feed.url}:`, error.message);
      }
    }
  }
  
  return jobs;
};

// Collect Corporate Jobs from APIs
const collectCorporateJobs = async () => {
  const jobs = [];
  
  // Mock corporate jobs for now (replace with actual free APIs)
  const companies = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'HCL Technologies', 'Cognizant'];
  const locations = ['Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi'];
  const jobTitles = ['Software Engineer', 'Senior Developer', 'Product Manager', 'Data Scientist', 'DevOps Engineer'];
  
  for (let i = 0; i < 30; i++) {
    const job = {
      title: `${jobTitles[Math.floor(Math.random() * jobTitles.length)]} - ${companies[Math.floor(Math.random() * companies.length)]}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      company_code: companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s+/g, '_'),
      location: locations[Math.floor(Math.random() * locations.length)],
      country: 'India',
      state: 'Any',
      description: 'Exciting opportunity to work with cutting-edge technology and innovative teams.',
      job_type: ['Full-time', 'Contract', 'Remote'][Math.floor(Math.random() * 3)],
      application_deadline: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      apply_url: 'https://company-careers.com/apply',
      source_url: 'https://job-portal.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      batch_id: `corp_collection_${Date.now()}`
    };
    
    jobs.push(job);
  }
  
  return jobs;
};

// Collect Exam Notifications
const collectExamNotifications = async () => {
  const exams = [];
  
  for (const source of JOB_SOURCES.exams) {
    for (const feed of source.feeds) {
      try {
        console.log(`Fetching Exam RSS from: ${feed.url}`);
        const rssData = await parser.parseURL(feed.url);
        
        for (const item of rssData.items.slice(0, 10)) { // Limit to 10 exams per feed
          const publishedDate = new Date(item.pubDate || item.isoDate || Date.now());
          const content = item.contentSnippet || item.summary || item.description || '';
          
          // Extract dates from content
          const startDate = extractExamDate(content, 'start') || null;
          const endDate = extractExamDate(content, 'end') || null;
          
          // Determine status
          const status = determineExamStatus(startDate, endDate);
          
          const exam = {
            exam_name: item.title,
            start_date: startDate,
            end_date: endDate,
            details_url: item.link,
            status: status,
            created_at: publishedDate.toISOString(),
            updated_at: new Date().toISOString(),
            batch_id: `exam_collection_${Date.now()}`
          };
          
          exams.push(exam);
        }
        
        // Add delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error fetching exam RSS from ${feed.url}:`, error.message);
      }
    }
  }
  
  return exams;
};

// Helper functions
const extractVacancyCount = (content) => {
  const vacancyMatch = content.match(/(\d+)\s*vacanc/i);
  if (vacancyMatch) return `${vacancyMatch[1]} Vacancies`;
  
  const postMatch = content.match(/(\d+)\s*post/i);
  if (postMatch) return `${postMatch[1]} Posts`;
  
  return 'Multiple Vacancies';
};

const isStateJob = (content) => {
  const stateIndicators = ['state government', 'state service', 'state commission', 'state board'];
  return stateIndicators.some(indicator => content.toLowerCase().includes(indicator));
};

const extractState = (content) => {
  const states = ['delhi', 'maharashtra', 'tamil_nadu', 'karnataka', 'uttar_pradesh', 'gujarat', 'west_bengal'];
  const foundState = states.find(state => content.toLowerCase().includes(state.replace('_', ' ')));
  return foundState || null;
};

const extractExamDate = (content, type) => {
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g;
  const dates = content.match(datePattern);
  
  if (!dates) return null;
  
  // Return first date for start, last for end
  if (type === 'start') return dates[0];
  if (type === 'end') return dates[dates.length - 1];
  
  return dates[0];
};

const determineExamStatus = (startDate, endDate) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (end && end < now) return 'closed';
  if (start && start > now) return 'upcoming';
  return 'open';
};

// Store jobs in Supabase with atomic updates
const storeJobs = async (governmentJobs, corporateJobs, examNotifications) => {
  try {
    console.log('Storing collected job data...');
    
    // Remove duplicates based on title/link
    const uniqueGovJobs = removeDuplicates(governmentJobs, 'details_link');
    const uniqueCorpJobs = removeDuplicates(corporateJobs, 'apply_url');
    const uniqueExams = removeDuplicates(examNotifications, 'details_url');
    
    let results = {
      government: { success: 0, errors: 0 },
      corporate: { success: 0, errors: 0 },
      exams: { success: 0, errors: 0 }
    };
    
    // Store Government Jobs
    if (uniqueGovJobs.length > 0) {
      const { data: govData, error: govError } = await supabase
        .from('jobs')
        .upsert(uniqueGovJobs, { 
          onConflict: 'details_link',
          ignoreDuplicates: false 
        });
      
      if (govError) {
        console.error('Error storing government jobs:', govError);
        results.government.errors = uniqueGovJobs.length;
      } else {
        results.government.success = uniqueGovJobs.length;
        console.log(`âœ… Stored ${uniqueGovJobs.length} government jobs`);
      }
    }
    
    // Store Corporate Jobs
    if (uniqueCorpJobs.length > 0) {
      const { data: corpData, error: corpError } = await supabase
        .from('corporate_jobs')
        .upsert(uniqueCorpJobs, { 
          onConflict: 'apply_url',
          ignoreDuplicates: false 
        });
      
      if (corpError) {
        console.error('Error storing corporate jobs:', corpError);
        results.corporate.errors = uniqueCorpJobs.length;
      } else {
        results.corporate.success = uniqueCorpJobs.length;
        console.log(`âœ… Stored ${uniqueCorpJobs.length} corporate jobs`);
      }
    }
    
    // Store Exam Notifications
    if (uniqueExams.length > 0) {
      const { data: examData, error: examError } = await supabase
        .from('nta_exams')
        .upsert(uniqueExams, { 
          onConflict: 'details_url',
          ignoreDuplicates: false 
        });
      
      if (examError) {
        console.error('Error storing exam notifications:', examError);
        results.exams.errors = uniqueExams.length;
      } else {
        results.exams.success = uniqueExams.length;
        console.log(`âœ… Stored ${uniqueExams.length} exam notifications`);
      }
    }
    
    // Update collection timestamp
    const timestamp = new Date().toISOString();
    await supabase
      .from('job_collection_stats')
      .upsert({
        collection_date: timestamp,
        government_jobs: results.government.success,
        corporate_jobs: results.corporate.success,
        exam_notifications: results.exams.success,
        total_collected: results.government.success + results.corporate.success + results.exams.success,
        last_updated: timestamp
      }, { onConflict: 'collection_date' });
    
    return {
      success: true,
      results: results,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('Error in storeJobs:', error);
    throw error;
  }
};

// Remove duplicates helper
const removeDuplicates = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// ROUTES

// Manual collection endpoint
router.post('/collect', async (req, res) => {
  try {
    console.log('ðŸš€ Starting manual job collection...');
    
    // Collect all job types in parallel
    const [governmentJobs, corporateJobs, examNotifications] = await Promise.all([
      collectGovernmentJobs(),
      collectCorporateJobs(),
      collectExamNotifications()
    ]);
    
    // Store all data
    const result = await storeJobs(governmentJobs, corporateJobs, examNotifications);
    
    res.json({
      success: true,
      message: 'Job collection completed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Manual collection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to collect jobs'
    });
  }
});

// Get collection statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('job_collection_stats')
      .select('*')
      .order('collection_date', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    // Check latest collection
    const { data: latestCollection } = await supabase
      .from('job_collection_stats')
      .select('*')
      .order('collection_date', { ascending: false })
      .limit(1)
      .single();
    
    res.json({
      success: true,
      message: 'Job Collector service is healthy',
      last_collection: latestCollection?.collection_date || 'Never',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});


// Get jobs endpoint (for jobsService.ts compatibility)
router.get('/jobs', async (req, res) => {
  try {
    const { category = 'all', limit = 10, offset = 0 } = req.query;
    
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' });
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (error) throw error;
    
    res.json({
      status: 'success',
      count: data?.length || 0,
      total: count || 0,
      offset: parseInt(offset),
      limit: parseInt(limit),
      data: data || []
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get categories endpoint (for jobsService.ts compatibility)
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('category')
      .not('category', 'is', null);
    
    if (error) throw error;
    
    // Count occurrences of each category
    const categoryCounts = {};
    data?.forEach(item => {
      const category = item.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Format as expected by frontend
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      display_name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
      urls: [],
      type: 'job_category'
    }));
    
    res.json({
      status: 'success',
      count: categories.length,
      data: categories
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});


// SCHEDULED DAILY COLLECTION AT 12:00 AM IST
cron.schedule('0 0 * * *', async () => {
  console.log('ðŸ•°ï¸ Running scheduled job collection at 12:00 AM IST...');
  try {
    // Collect all job types in parallel
    const [governmentJobs, corporateJobs, examNotifications] = await Promise.all([
      collectGovernmentJobs(),
      collectCorporateJobs(), 
      collectExamNotifications()
    ]);
    
    // Store all data
    const result = await storeJobs(governmentJobs, corporateJobs, examNotifications);
    
    console.log('âœ… Scheduled job collection completed:', result);
    
    // Log summary
    console.log(`ðŸ“Š Collection Summary:
    - Government Jobs: ${result.results.government.success}
    - Corporate Jobs: ${result.results.corporate.success}  
    - Exam Notifications: ${result.results.exams.success}
    - Total: ${result.results.government.success + result.results.corporate.success + result.results.exams.success}
    - Timestamp: ${result.timestamp}`);
    
  } catch (error) {
    console.error('âŒ Scheduled job collection failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('â° Job collection scheduled for 12:00 AM IST daily');

module.exports = router;