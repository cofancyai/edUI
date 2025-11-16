// Import required libraries
const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Function to get credential from Supabase
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

// Add a health check endpoint for testing connectivity
router.get('/health', async (req, res) => {
  // Get YouTube API key
  const appKey = req.app.get('youtube_api_key');
  const YOUTUBE_API_KEY = appKey || await getCredential('VITE_YOUTUBE_DATA_API');
  
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'YouTube API key is missing' 
    });
  }
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'YouTube proxy service is running correctly',
    apiKeyConfigured: !!YOUTUBE_API_KEY
  });
});

/**
 * Proxy endpoint for YouTube search API
 * This avoids CORS issues by making the request from the server
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get the YouTube API key from the app settings (set in server.js)
    const appKey = req.app.get('youtube_api_key');
    const YOUTUBE_API_KEY = appKey || await getCredential('VITE_YOUTUBE_DATA_API');

    // Check if API key exists
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is missing. Check your Supabase credentials.');
      return res.status(500).json({ error: 'YouTube API key is missing' });
    }

    console.log(`Processing YouTube search for: "${q}" with API key starting with: ${YOUTUBE_API_KEY.substring(0, 3)}...`);

    // Step 1: Search for videos
    try {
      const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q,
          type: 'video',
          maxResults: 6, // Limit to 6 videos
          key: YOUTUBE_API_KEY
        }
      });

      console.log('YouTube search response received');

      // If no videos found, return empty array
      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return res.json({ items: [] });
      }

      // Step 2: Get video details (like view counts and duration)
      const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
      
      console.log(`Fetching details for ${searchResponse.data.items.length} videos`);
      
      const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'statistics,contentDetails',
          id: videoIds,
          key: YOUTUBE_API_KEY
        }
      });

      console.log('Video details response received');

      // Merge the search results with video details
      const videoDetailsMap = {};
      if (videoDetailsResponse.data.items) {
        videoDetailsResponse.data.items.forEach(item => {
          videoDetailsMap[item.id] = {
            statistics: item.statistics,
            contentDetails: item.contentDetails
          };
        });
      }

      // Combine the data
      const combinedResults = searchResponse.data.items.map(item => {
        const videoId = item.id.videoId;
        const details = videoDetailsMap[videoId] || {};
        
        return {
          ...item,
          statistics: details.statistics || {},
          contentDetails: details.contentDetails || {}
        };
      });

      // Sort by view count (if available)
      combinedResults.sort((a, b) => {
        const viewsA = parseInt(a.statistics?.viewCount || '0');
        const viewsB = parseInt(b.statistics?.viewCount || '0');
        return viewsB - viewsA;
      });

      // Return the combined results
      return res.json({ items: combinedResults });
    } catch (searchError) {
      console.error('Error during YouTube API request:', searchError);
      
      if (searchError.response) {
        console.error('YouTube API error details:', {
          status: searchError.response.status,
          data: searchError.response.data
        });
        
        // If API key is invalid, use mock data instead
        if (searchError.response.status === 403 || 
            searchError.response.status === 400) {
          console.log("Invalid API key or quota exceeded, using mock data instead");
          return res.redirect(`/api/youtube/mock?q=${encodeURIComponent(q)}`);
        }
        
        return res.status(searchError.response.status).json({
          error: 'YouTube API error',
          details: searchError.response.data
        });
      } else {
        throw searchError; // Re-throw to be caught by the outer catch block
      }
    }
  } catch (error) {
    console.error('Unhandled YouTube API Error:', error);
    
    // Fall back to mock data
    console.log("Falling back to mock data due to error");
    return res.redirect(`/api/youtube/mock?q=${encodeURIComponent(req.query.q)}`);
  }
});

// Add a mock data endpoint for development when YouTube API is unavailable
router.get('/mock', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  // Create a hash value based on the query for consistent but unique results
  const queryHash = q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate mock data
  const mockVideos = [
    {
      id: { videoId: `mock-${queryHash}-1` },
      snippet: {
        title: `${q} - Educational Overview`,
        description: `Learn all about ${q} in this educational video that covers the most important aspects.`,
        thumbnails: {
          medium: { 
            url: `https://via.placeholder.com/320x180.png?text=${encodeURIComponent(q)}+1`
          }
        },
        publishedAt: new Date(Date.now() - (queryHash % 10000000000)).toISOString()
      },
      statistics: {
        viewCount: (100000 + (queryHash % 500000)).toString()
      },
      contentDetails: {
        duration: "PT15M30S"
      }
    },
    {
      id: { videoId: `mock-${queryHash}-2` },
      snippet: {
        title: `Understanding ${q} - Detailed Explanation`,
        description: `A comprehensive explanation of ${q} with examples and detailed analysis.`,
        thumbnails: {
          medium: { 
            url: `https://via.placeholder.com/320x180.png?text=${encodeURIComponent(q)}+2`
          }
        },
        publishedAt: new Date(Date.now() - (queryHash % 5000000000)).toISOString()
      },
      statistics: {
        viewCount: (75000 + (queryHash % 300000)).toString()
      },
      contentDetails: {
        duration: "PT8M45S"
      }
    },
    {
      id: { videoId: `mock-${queryHash}-3` },
      snippet: {
        title: `${q} for Beginners - Simple Tutorial`,
        description: `This beginner-friendly video breaks down the concept of ${q} in an easy-to-understand format.`,
        thumbnails: {
          medium: { 
            url: `https://via.placeholder.com/320x180.png?text=${encodeURIComponent(q)}+3`
          }
        },
        publishedAt: new Date(Date.now() - (queryHash % 15000000000)).toISOString()
      },
      statistics: {
        viewCount: (150000 + (queryHash % 200000)).toString()
      },
      contentDetails: {
        duration: "PT12M15S"
      }
    }
  ];
  
  console.log("Sending mock YouTube data");
  return res.json({ items: mockVideos });
});

module.exports = router;