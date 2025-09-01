/**
 * Netlify Function: Satisfaction Rating Handler
 * Processes and stores customer satisfaction ratings
 */

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod === 'POST') {
    return await handleRatingSubmission(event);
  } else if (event.httpMethod === 'GET') {
    return await handleRatingAnalytics(event);
  }

  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

async function handleRatingSubmission(event) {
  try {
    const ratingData = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!ratingData.rating || !ratingData.sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: rating, sessionId' 
        })
      };
    }

    // Process and enrich rating data
    const processedRating = await processRatingData(ratingData);
    
    // Store rating (multiple storage options)
    const results = await Promise.allSettled([
      storeInGoogleSheets(processedRating),
      storeInAnalyticsDB(processedRating),
      sendToSlackIfLowRating(processedRating)
    ]);
    
    // Log results
    console.log('📊 Rating Submitted:', {
      rating: processedRating.rating,
      sessionId: processedRating.sessionId,
      tenantId: processedRating.tenantId,
      hasFeedback: !!processedRating.feedback,
      sentiment: processedRating.analysis.sentiment
    });

    // Send success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        ratingId: processedRating.id,
        message: getRatingResponseMessage(processedRating.rating),
        timestamp: processedRating.timestamp
      })
    };

  } catch (error) {
    console.error('Rating Submission Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to process rating',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}

async function handleRatingAnalytics(event) {
  try {
    const { tenant, period = '30d' } = event.queryStringParameters || {};
    
    // Generate analytics report
    const analytics = await generateSatisfactionAnalytics(tenant, period);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analytics)
    };
    
  } catch (error) {
    console.error('Analytics Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Analytics generation failed' })
    };
  }
}

async function processRatingData(rawRating) {
  const ratingId = generateRatingId();
  
  return {
    id: ratingId,
    sessionId: rawRating.sessionId,
    tenantId: rawRating.tenantId || 'default',
    rating: parseInt(rawRating.rating),
    feedback: rawRating.feedback || '',
    categories: rawRating.categories || [],
    timestamp: rawRating.timestamp || new Date().toISOString(),
    
    // Session context
    sessionDuration: rawRating.sessionDuration || 0,
    messageCount: rawRating.messageCount || 0,
    wasResolved: rawRating.wasResolved || false,
    wasEscalated: rawRating.wasEscalated || false,
    
    // User context (anonymous)
    userAgent: sanitizeUserAgent(rawRating.userAgent),
    url: sanitizeURL(rawRating.url),
    referrer: sanitizeURL(rawRating.referrer),
    
    // Analysis
    analysis: await analyzeRating(rawRating),
    
    // Metadata
    processed: new Date().toISOString(),
    version: '1.0'
  };
}

async function analyzeRating(ratingData) {
  const analysis = {
    sentiment: 'neutral',
    category: 'general',
    priority: 'normal',
    actionRequired: false,
    keywords: []
  };
  
  // Sentiment analysis based on rating and feedback
  if (ratingData.rating >= 4) {
    analysis.sentiment = 'positive';
  } else if (ratingData.rating <= 2) {
    analysis.sentiment = 'negative';
    analysis.priority = 'high';
    analysis.actionRequired = true;
  }
  
  // Analyze feedback text if provided
  if (ratingData.feedback) {
    analysis.keywords = extractKeywords(ratingData.feedback);
    analysis.category = categorizeIssue(ratingData.feedback);
    
    // Check for urgent issues
    if (containsUrgentKeywords(ratingData.feedback)) {
      analysis.priority = 'urgent';
      analysis.actionRequired = true;
    }
  }
  
  // Analyze categories if provided
  if (ratingData.categories && ratingData.categories.length > 0) {
    if (ratingData.categories.includes('confusing') || ratingData.categories.includes('slow')) {
      analysis.actionRequired = true;
    }
  }
  
  return analysis;
}

function extractKeywords(text) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were'];
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10); // Top 10 keywords
}

function categorizeIssue(feedback) {
  const categories = {
    technical: ['error', 'bug', 'broken', 'not working', 'crash', 'loading'],
    usability: ['confusing', 'unclear', 'difficult', 'hard to use', 'complicated'],
    performance: ['slow', 'timeout', 'delay', 'waiting', 'loading'],
    content: ['wrong', 'incorrect', 'outdated', 'missing', 'inaccurate'],
    service: ['rude', 'unhelpful', 'impatient', 'unprofessional']
  };
  
  const feedbackLower = feedback.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => feedbackLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

function containsUrgentKeywords(feedback) {
  const urgentKeywords = [
    'urgent', 'emergency', 'immediately', 'asap', 'critical',
    'terrible', 'awful', 'horrible', 'worst', 'angry',
    'refund', 'cancel', 'complaint', 'lawyer', 'legal'
  ];
  
  return urgentKeywords.some(keyword => 
    feedback.toLowerCase().includes(keyword)
  );
}

async function storeInGoogleSheets(ratingData) {
  // Store satisfaction ratings in Google Sheets
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('Google Sheets not configured for ratings');
    return;
  }
  
  try {
    // This would integrate with Google Sheets API
    console.log('📊 Would store in Google Sheets:', {
      id: ratingData.id,
      rating: ratingData.rating,
      tenant: ratingData.tenantId,
      timestamp: ratingData.timestamp,
      sentiment: ratingData.analysis.sentiment
    });
    
    // TODO: Implement actual Google Sheets integration
    // const sheets = await initializeGoogleSheets();
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    //   range: 'Satisfaction Ratings!A:Z',
    //   valueInputOption: 'RAW',
    //   resource: {
    //     values: [[
    //       ratingData.id,
    //       ratingData.sessionId,
    //       ratingData.tenantId,
    //       ratingData.rating,
    //       ratingData.feedback,
    //       ratingData.categories.join(','),
    //       ratingData.sessionDuration,
    //       ratingData.messageCount,
    //       ratingData.wasResolved,
    //       ratingData.analysis.sentiment,
    //       ratingData.analysis.category,
    //       ratingData.timestamp
    //     ]]
    //   }
    // });
    
  } catch (error) {
    console.error('Google Sheets storage failed:', error);
    throw error;
  }
}

async function storeInAnalyticsDB(ratingData) {
  // Store in analytics database (could be Supabase, Firebase, etc.)
  try {
    console.log('📈 Would store in Analytics DB:', {
      id: ratingData.id,
      rating: ratingData.rating,
      tenant: ratingData.tenantId,
      sentiment: ratingData.analysis.sentiment
    });
    
    // TODO: Implement actual database storage
    
  } catch (error) {
    console.error('Analytics DB storage failed:', error);
  }
}

async function sendToSlackIfLowRating(ratingData) {
  // Send Slack notification for low ratings
  if (ratingData.rating <= 2 && process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `🚨 Low Satisfaction Rating Alert`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Low Rating Alert* 🚨\n\n*Rating:* ${ratingData.rating}/5 ⭐\n*Tenant:* ${ratingData.tenantId}\n*Session:* ${ratingData.sessionId}`
            }
          }
        ]
      };
      
      if (ratingData.feedback) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Feedback:* "${ratingData.feedback}"`
          }
        });
      }
      
      slackMessage.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Session Details:*\n• Duration: ${Math.round(ratingData.sessionDuration / 1000)}s\n• Messages: ${ratingData.messageCount}\n• Resolved: ${ratingData.wasResolved ? 'Yes' : 'No'}\n• Escalated: ${ratingData.wasEscalated ? 'Yes' : 'No'}`
        }
      });
      
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
      
    } catch (error) {
      console.error('Slack notification failed:', error);
    }
  }
}

async function generateSatisfactionAnalytics(tenant, period) {
  // Generate analytics report for dashboard
  const analytics = {
    summary: {
      averageRating: 4.2,
      totalRatings: 127,
      responseRate: 23, // % of sessions that provided ratings
      satisfactionRate: 78, // % of ratings >= 4
      nps: 45 // Net Promoter Score
    },
    
    distribution: {
      5: 45,
      4: 32,
      3: 18,
      2: 8,
      1: 5
    },
    
    trends: {
      daily: generateTrendData(period, 'daily'),
      weekly: generateTrendData(period, 'weekly')
    },
    
    insights: {
      topIssues: [
        { category: 'performance', count: 12, impact: 'medium' },
        { category: 'usability', count: 8, impact: 'high' },
        { category: 'content', count: 5, impact: 'low' }
      ],
      
      improvements: [
        'Reduce response time for product searches',
        'Improve size guide explanations',
        'Add more payment options information'
      ],
      
      strengths: [
        'Friendly and helpful personality',
        'Accurate product recommendations', 
        'Quick order status updates'
      ]
    },
    
    segmentation: {
      byTenant: tenant ? filterByTenant(tenant) : getAllTenants(),
      byDevice: {
        mobile: { average: 4.1, count: 78 },
        desktop: { average: 4.3, count: 49 }
      },
      byIssueType: {
        product_inquiry: { average: 4.4, count: 45 },
        order_support: { average: 4.0, count: 32 },
        technical_issue: { average: 3.2, count: 18 }
      }
    }
  };
  
  return analytics;
}

function generateTrendData(period, granularity) {
  // Generate sample trend data (in production, query actual database)
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      averageRating: 3.8 + Math.random() * 1.4, // Random between 3.8-5.2
      totalRatings: Math.floor(Math.random() * 20) + 5,
      satisfactionRate: Math.floor(Math.random() * 30) + 70 // 70-100%
    });
  }
  
  return data;
}

function getRatingResponseMessage(rating) {
  const messages = {
    5: "Thank you for the excellent rating! We're thrilled we could help! 🌟",
    4: "Thanks for the great feedback! We're glad we could assist you! 😊", 
    3: "Thank you for your feedback! We'll keep working to improve! 👍",
    2: "Thanks for your honest feedback. We'll work harder to improve your experience! 💪",
    1: "We're sorry we didn't meet your expectations. Your feedback is valuable and we'll do better! 🙏"
  };
  
  return messages[rating] || "Thank you for your feedback!";
}

function generateRatingId() {
  return 'rating_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

function sanitizeUserAgent(userAgent) {
  if (!userAgent) return null;
  return userAgent.length > 200 ? userAgent.substring(0, 200) + '...' : userAgent;
}

function sanitizeURL(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Remove sensitive parameters
    ['token', 'api_key', 'password', 'auth'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}
