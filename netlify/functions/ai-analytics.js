/**
 * Netlify Function for AI Analytics & Self-Rating Data
 * Handles AI self-ratings, missing answers, and dashboard analytics
 * Now with MongoDB Atlas persistent storage
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('chatguus');
  
  cachedDb = { client, db };
  return cachedDb;
}

// Database helpers
const AIRatingsDB = {
  async create(data) {
    const { db } = await connectToDatabase();
    const result = await db.collection('ai_ratings').insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  },

  async find(query = {}, options = {}) {
    const { db } = await connectToDatabase();
    let cursor = db.collection('ai_ratings').find(query);
    
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    if (options.skip) cursor = cursor.skip(options.skip);
    
    return await cursor.toArray();
  },

  async count(query = {}) {
    const { db } = await connectToDatabase();
    return await db.collection('ai_ratings').countDocuments(query);
  },

  async getAnalytics(query = {}) {
    const { db } = await connectToDatabase();
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgOverall: { $avg: '$rating.overall' },
          avgAccuracy: { $avg: '$rating.accuracy' },
          avgHelpfulness: { $avg: '$rating.helpfulness' },
          avgCompleteness: { $avg: '$rating.completeness' },
          avgClarity: { $avg: '$rating.clarity' },
          avgRelevance: { $avg: '$rating.relevance' },
          avgConfidence: { $avg: '$rating.confidence' }
        }
      }
    ];
    
    const results = await db.collection('ai_ratings').aggregate(pipeline).toArray();
    return results[0] || { totalRatings: 0 };
  },

  async getTrends(query = {}) {
    const { db } = await connectToDatabase();
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' },
          avgConfidence: { $avg: '$rating.confidence' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ];
    
    const results = await db.collection('ai_ratings').aggregate(pipeline).toArray();
    return results.map(r => ({
      date: r._id,
      count: r.count,
      avgRating: parseFloat((r.avgRating || 0).toFixed(2)),
      avgConfidence: parseFloat(((r.avgConfidence || 0) * 100).toFixed(1))
    }));
  },

  async getCategoryBreakdown(query = {}) {
    const { db } = await connectToDatabase();
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: '$rating.category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.overall' }
        }
      }
    ];
    
    const results = await db.collection('ai_ratings').aggregate(pipeline).toArray();
    return results.map(r => ({
      category: r._id || 'unknown',
      count: r.count,
      avgRating: parseFloat((r.avgRating || 0).toFixed(2))
    }));
  }
};

const MissingAnswersDB = {
  async create(data) {
    const { db } = await connectToDatabase();
    const result = await db.collection('missing_answers').insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result.insertedId;
  },

  async find(query = {}, options = {}) {
    const { db } = await connectToDatabase();
    let cursor = db.collection('missing_answers').find(query);
    
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    if (options.skip) cursor = cursor.skip(options.skip);
    
    return await cursor.toArray();
  },

  async getAnalytics(query = {}) {
    const { db } = await connectToDatabase();
    const total = await db.collection('missing_answers').countDocuments(query);
    const highPriority = await db.collection('missing_answers').countDocuments({ ...query, priority: 'high' });
    const mediumPriority = await db.collection('missing_answers').countDocuments({ ...query, priority: 'medium' });
    const lowPriority = await db.collection('missing_answers').countDocuments({ ...query, priority: 'low' });
    
    return { total, highPriority, mediumPriority, lowPriority };
  }
};

const SatisfactionRatingsDB = {
  async getAnalytics(query = {}) {
    const { db } = await connectToDatabase();
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          satisfiedCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } }
        }
      }
    ];
    
    const results = await db.collection('satisfaction_ratings').aggregate(pipeline).toArray();
    const data = results[0] || { totalRatings: 0, avgRating: 0, satisfiedCount: 0 };
    
    return {
      totalRatings: data.totalRatings,
      avgRating: parseFloat((data.avgRating || 0).toFixed(2)),
      satisfactionRate: data.totalRatings > 0 ? Math.round((data.satisfiedCount / data.totalRatings) * 100) : 0
    };
  }
};

async function healthCheck() {
  try {
    const { db } = await connectToDatabase();
    await db.admin().ping();
    return { status: 'healthy', connected: true };
  } catch (error) {
    return { status: 'unhealthy', connected: false, error: error.message };
  }
}

// Cache for dashboard data (5 minute TTL)
let dashboardCache = null;
let cacheTimestamp = null;

// In-memory storage for missing answers (fallback)
let missingAnswers = [];
let aiRatings = [];

const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { action, ...params } = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    switch (action) {
      case 'store_ai_rating':
        return handleStoreAIRating(body, headers);
        
      case 'store_missing_answer':
        return handleStoreMissingAnswer(body, headers);
        
      case 'get_ai_ratings':
        return handleGetAIRatings(params, headers);
        
      case 'get_missing_answers':
        return handleGetMissingAnswers(params, headers);
        
      case 'get_dashboard_data':
        return handleGetDashboardData(params, headers);
        
      case 'export_data':
        return handleExportData(params, headers);
        
      case 'update_missing_answer_status':
        return handleUpdateMissingAnswerStatus(body, headers);
        
      case 'health_check':
        return handleHealthCheck(headers);
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid action. Available actions: store_ai_rating, store_missing_answer, get_ai_ratings, get_missing_answers, get_dashboard_data, export_data, update_missing_answer_status' 
          })
        };
    }

  } catch (error) {
    console.error('AI Analytics Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

/**
 * Store AI self-rating data
 */
async function handleStoreAIRating(data, headers) {
  try {
    const rating = {
      id: data.id || generateId('ai_rating'),
      timestamp: data.timestamp || new Date().toISOString(),
      sessionId: data.sessionId,
      tenantId: data.tenantId,
      userQuestion: data.userQuestion,
      aiResponse: data.aiResponse,
      rating: data.rating,
      context: data.context || {},
      ...data
    };

    // Store in MongoDB
    const ratingId = await AIRatingsDB.create(rating);
    
    // Invalidate cache
    dashboardCache = null;
    
    // Check if this rating indicates a missing answer
    if (rating.rating.confidence < 0.7 || rating.rating.helpfulness < 3) {
      await checkForMissingAnswer(rating);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        ratingId: ratingId.toString(),
        message: 'AI rating stored successfully in MongoDB'
      })
    };

  } catch (error) {
    console.error('Store AI rating error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to store AI rating',
        message: error.message 
      })
    };
  }
}

/**
 * Store missing answer data
 */
async function handleStoreMissingAnswer(data, headers) {
  try {
    const missingAnswer = {
      id: data.id || generateId('missing_answer'),
      timestamp: data.timestamp || new Date().toISOString(),
      userQuestion: data.userQuestion,
      aiResponse: data.aiResponse,
      category: data.category || 'unknown',
      priority: data.priority || 'medium',
      frequency: data.frequency || 1,
      status: data.status || 'needs_review',
      tenantId: data.tenantId,
      sessionId: data.sessionId,
      rating: data.rating || null,
      ...data
    };

    // Check if similar question already exists
    const existingIndex = missingAnswers.findIndex(ma => 
      calculateSimilarity(ma.userQuestion, missingAnswer.userQuestion) > 0.8 &&
      ma.tenantId === missingAnswer.tenantId
    );
    
    if (existingIndex !== -1) {
      // Update existing entry
      missingAnswers[existingIndex].frequency += 1;
      missingAnswers[existingIndex].timestamp = missingAnswer.timestamp;
      missingAnswers[existingIndex].lastRating = missingAnswer.rating;
    } else {
      // Add new entry
      missingAnswers.push(missingAnswer);
    }
    
    // Keep only last 500 missing answers
    if (missingAnswers.length > 500) {
      missingAnswers = missingAnswers.slice(-500);
    }
    
    // Invalidate cache
    dashboardCache = null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        missingAnswerId: missingAnswer.id,
        message: 'Missing answer stored successfully'
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to store missing answer',
        message: error.message 
      })
    };
  }
}

/**
 * Get AI ratings with filtering
 */
async function handleGetAIRatings(params, headers) {
  try {
    // Build query filters
    const query = {};
    if (params.tenantId && params.tenantId !== 'all') {
      query.tenantId = params.tenantId;
    }
    if (params.category && params.category !== 'all') {
      query['rating.category'] = params.category;
    }

    // Build options
    const options = {
      limit: parseInt(params.limit) || 50,
      skip: ((parseInt(params.page) || 1) - 1) * (parseInt(params.limit) || 50),
      sort: { createdAt: -1 }
    };

    if (params.period) {
      options.period = params.period;
    }

    // Get ratings from MongoDB
    const ratings = await AIRatingsDB.find(query, options);
    const total = await AIRatingsDB.count(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ratings,
        total,
        page: parseInt(params.page) || 1,
        limit: parseInt(params.limit) || 50,
        totalPages: Math.ceil(total / (parseInt(params.limit) || 50))
      })
    };

  } catch (error) {
    console.error('Get AI ratings error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get AI ratings',
        message: error.message 
      })
    };
  }
}

/**
 * Get missing answers with filtering
 */
async function handleGetMissingAnswers(params, headers) {
  try {
    let filteredAnswers = [...missingAnswers];
    
    // Apply filters
    if (params.tenantId && params.tenantId !== 'all') {
      filteredAnswers = filteredAnswers.filter(ma => ma.tenantId === params.tenantId);
    }
    
    if (params.priority && params.priority !== 'all') {
      filteredAnswers = filteredAnswers.filter(ma => ma.priority === params.priority);
    }
    
    if (params.status && params.status !== 'all') {
      filteredAnswers = filteredAnswers.filter(ma => ma.status === params.status);
    }
    
    if (params.category && params.category !== 'all') {
      filteredAnswers = filteredAnswers.filter(ma => ma.category === params.category);
    }
    
    // Sort by priority and frequency
    filteredAnswers.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.frequency - a.frequency;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        missingAnswers: filteredAnswers,
        total: filteredAnswers.length,
        summary: {
          highPriority: filteredAnswers.filter(ma => ma.priority === 'high').length,
          mediumPriority: filteredAnswers.filter(ma => ma.priority === 'medium').length,
          lowPriority: filteredAnswers.filter(ma => ma.priority === 'low').length,
          needsReview: filteredAnswers.filter(ma => ma.status === 'needs_review').length
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get missing answers',
        message: error.message 
      })
    };
  }
}

/**
 * Get comprehensive dashboard data
 */
async function handleGetDashboardData(params, headers) {
  try {
    // Use cache if available and recent (5 minutes)
    if (dashboardCache && cacheTimestamp && 
        (Date.now() - cacheTimestamp) < 5 * 60 * 1000) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(dashboardCache)
      };
    }
    
    // Calculate analytics from MongoDB
    const analytics = await calculateAnalyticsFromDB(params);
    
    // Cache the result
    dashboardCache = analytics;
    cacheTimestamp = Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analytics)
    };

  } catch (error) {
    console.error('Get dashboard data error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get dashboard data',
        message: error.message 
      })
    };
  }
}

/**
 * Export all data
 */
async function handleExportData(params, headers) {
  try {
    const exportData = {
      aiRatings: aiRatings,
      missingAnswers: missingAnswers,
      analytics: calculateAnalytics(params),
      exportedAt: new Date().toISOString(),
      totalRecords: aiRatings.length + missingAnswers.length
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Disposition': 'attachment; filename="chatguus-analytics-export.json"'
      },
      body: JSON.stringify(exportData, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to export data',
        message: error.message 
      })
    };
  }
}

/**
 * Update missing answer status
 */
async function handleUpdateMissingAnswerStatus(data, headers) {
  try {
    const { id, status, notes } = data;
    
    const answerIndex = missingAnswers.findIndex(ma => ma.id === id);
    if (answerIndex === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Missing answer not found' })
      };
    }
    
    missingAnswers[answerIndex].status = status;
    missingAnswers[answerIndex].notes = notes;
    missingAnswers[answerIndex].updatedAt = new Date().toISOString();
    
    // Invalidate cache
    dashboardCache = null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Missing answer status updated successfully'
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to update missing answer status',
        message: error.message 
      })
    };
  }
}

/**
 * Calculate comprehensive analytics from MongoDB
 */
async function calculateAnalyticsFromDB(filters = {}) {
  try {
    // Build query filters
    const query = {};
    if (filters.tenantId && filters.tenantId !== 'all') {
      query.tenantId = filters.tenantId;
    }

    // Get AI ratings analytics
    const aiAnalytics = await AIRatingsDB.getAnalytics(query);
    const trends = await AIRatingsDB.getTrends(query);
    const categoryBreakdown = await AIRatingsDB.getCategoryBreakdown(query);

    // Get missing answers analytics
    const missingAnswersAnalytics = await MissingAnswersDB.getAnalytics(query);
    const missingAnswersList = await MissingAnswersDB.find(query, { limit: 20 });

    // Get satisfaction analytics
    const satisfactionAnalytics = await SatisfactionRatingsDB.getAnalytics(query);

    return {
      summary: {
        totalRatings: aiAnalytics.totalRatings,
        averageAIRating: parseFloat((aiAnalytics.avgOverall || 0).toFixed(2)),
        averageConfidence: parseFloat(((aiAnalytics.avgConfidence || 0) * 100).toFixed(1)),
        userSatisfactionRate: satisfactionAnalytics.satisfactionRate || 0,
        missingAnswersCount: missingAnswersAnalytics.total
      },
      aiRatings: {
        total: aiAnalytics.totalRatings,
        averages: {
          overall: parseFloat((aiAnalytics.avgOverall || 0).toFixed(2)),
          accuracy: parseFloat((aiAnalytics.avgAccuracy || 0).toFixed(2)),
          helpfulness: parseFloat((aiAnalytics.avgHelpfulness || 0).toFixed(2)),
          completeness: parseFloat((aiAnalytics.avgCompleteness || 0).toFixed(2)),
          clarity: parseFloat((aiAnalytics.avgClarity || 0).toFixed(2)),
          relevance: parseFloat((aiAnalytics.avgRelevance || 0).toFixed(2)),
          confidence: parseFloat(((aiAnalytics.avgConfidence || 0) * 100).toFixed(1))
        },
        categoryBreakdown: categoryBreakdown.reduce((acc, cat) => {
          acc[cat.category] = {
            count: cat.count,
            avgRating: cat.avgRating
          };
          return acc;
        }, {}),
        confidenceDistribution: calculateConfidenceDistribution(aiAnalytics.categories || []),
        trends: trends
      },
      missingAnswers: {
        total: missingAnswersAnalytics.total,
        highPriority: missingAnswersAnalytics.highPriority,
        mediumPriority: missingAnswersAnalytics.mediumPriority,
        lowPriority: missingAnswersAnalytics.lowPriority,
        list: missingAnswersList,
        categories: getCategoriesFromMissingAnswers(missingAnswersAnalytics.categories || [])
      },
      satisfaction: satisfactionAnalytics,
      filters: filters,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Calculate analytics error:', error);
    // Return empty analytics on error
    return {
      summary: {
        totalRatings: 0,
        averageAIRating: 0,
        averageConfidence: 0,
        userSatisfactionRate: 0,
        missingAnswersCount: 0
      },
      aiRatings: { total: 0, averages: {}, categoryBreakdown: {}, confidenceDistribution: {}, trends: [] },
      missingAnswers: { total: 0, list: [], categories: {} },
      satisfaction: { totalRatings: 0, avgRating: 0, satisfactionRate: 0 },
      filters: filters,
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Calculate comprehensive analytics (legacy function for fallback)
 */
function calculateAnalytics(filters = {}) {
  let filteredRatings = [...aiRatings];
  let filteredMissingAnswers = [...missingAnswers];
  
  // Apply filters
  if (filters.tenantId && filters.tenantId !== 'all') {
    filteredRatings = filteredRatings.filter(r => r.tenantId === filters.tenantId);
    filteredMissingAnswers = filteredMissingAnswers.filter(ma => ma.tenantId === filters.tenantId);
  }
  
  if (filters.period) {
    const cutoffDate = getPeriodCutoff(filters.period);
    filteredRatings = filteredRatings.filter(r => new Date(r.timestamp) >= cutoffDate);
    filteredMissingAnswers = filteredMissingAnswers.filter(ma => new Date(ma.timestamp) >= cutoffDate);
  }
  
  // AI Ratings Analytics
  const totalRatings = filteredRatings.length;
  const avgRatings = totalRatings > 0 ? {
    overall: calculateAverage(filteredRatings, 'rating.overall'),
    accuracy: calculateAverage(filteredRatings, 'rating.accuracy'),
    helpfulness: calculateAverage(filteredRatings, 'rating.helpfulness'),
    completeness: calculateAverage(filteredRatings, 'rating.completeness'),
    clarity: calculateAverage(filteredRatings, 'rating.clarity'),
    relevance: calculateAverage(filteredRatings, 'rating.relevance'),
    confidence: calculateAverage(filteredRatings, 'rating.confidence') * 100
  } : {
    overall: 0, accuracy: 0, helpfulness: 0, 
    completeness: 0, clarity: 0, relevance: 0, confidence: 0
  };
  
  // Category breakdown
  const categoryBreakdown = {};
  filteredRatings.forEach(rating => {
    const category = rating.rating?.category || 'unknown';
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = { count: 0, avgRating: 0, totalRating: 0 };
    }
    categoryBreakdown[category].count++;
    categoryBreakdown[category].totalRating += rating.rating?.overall || 0;
  });
  
  // Calculate average ratings per category
  Object.keys(categoryBreakdown).forEach(category => {
    const cat = categoryBreakdown[category];
    cat.avgRating = cat.count > 0 ? (cat.totalRating / cat.count).toFixed(2) : 0;
    delete cat.totalRating;
  });
  
  // Confidence distribution
  const confidenceDistribution = { high: 0, medium: 0, low: 0 };
  filteredRatings.forEach(rating => {
    const confidence = rating.rating?.confidence || 0;
    if (confidence >= 0.8) confidenceDistribution.high++;
    else if (confidence >= 0.6) confidenceDistribution.medium++;
    else confidenceDistribution.low++;
  });
  
  // Trend data (last 30 days)
  const trendData = calculateTrendData(filteredRatings);
  
  // Missing answers analytics
  const missingAnswersAnalytics = {
    total: filteredMissingAnswers.length,
    highPriority: filteredMissingAnswers.filter(ma => ma.priority === 'high').length,
    mediumPriority: filteredMissingAnswers.filter(ma => ma.priority === 'medium').length,
    lowPriority: filteredMissingAnswers.filter(ma => ma.priority === 'low').length,
    categories: getMissingAnswerCategories(filteredMissingAnswers),
    topQuestions: getTopMissingQuestions(filteredMissingAnswers)
  };

  return {
    summary: {
      totalRatings,
      averageAIRating: parseFloat(avgRatings.overall.toFixed(2)),
      averageConfidence: parseFloat(avgRatings.confidence.toFixed(1)),
      userSatisfactionRate: calculateUserSatisfactionRate(),
      missingAnswersCount: filteredMissingAnswers.length
    },
    aiRatings: {
      total: totalRatings,
      averages: avgRatings,
      categoryBreakdown,
      confidenceDistribution,
      trends: trendData
    },
    missingAnswers: {
      ...missingAnswersAnalytics,
      list: filteredMissingAnswers.slice(0, 20) // Top 20 for dashboard
    },
    filters: filters,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Check if a rating indicates a missing answer
 */
async function checkForMissingAnswer(rating) {
  if (rating.rating.confidence < 0.7 || rating.rating.helpfulness < 3) {
    const missingAnswer = {
      id: generateId('missing_answer'),
      timestamp: rating.timestamp,
      userQuestion: rating.userQuestion,
      aiResponse: rating.aiResponse,
      category: rating.rating.category,
      priority: calculatePriority(rating.rating),
      status: 'needs_review',
      tenantId: rating.tenantId,
      sessionId: rating.sessionId,
      rating: rating.rating
    };
    
    // Store in MongoDB
    await MissingAnswersDB.create(missingAnswer);
  }
}

/**
 * Helper functions
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateAverage(items, path) {
  if (items.length === 0) return 0;
  
  const values = items.map(item => {
    const keys = path.split('.');
    let value = item;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || 0;
  });
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function calculatePriority(rating) {
  if (rating.confidence < 0.3 || rating.helpfulness < 2) return 'high';
  if (rating.confidence < 0.5 || rating.helpfulness < 3) return 'medium';
  return 'low';
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(' ');
  const words2 = str2.toLowerCase().split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function getPeriodCutoff(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;
    case 'quarter':
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(now.getMonth() - 3);
      return quarterAgo;
    default:
      return new Date(0); // Beginning of time
  }
}

function calculateTrendData(ratings) {
  const trends = {};
  
  ratings.forEach(rating => {
    const date = rating.timestamp.split('T')[0];
    if (!trends[date]) {
      trends[date] = { count: 0, totalRating: 0, totalConfidence: 0 };
    }
    trends[date].count++;
    trends[date].totalRating += rating.rating?.overall || 0;
    trends[date].totalConfidence += rating.rating?.confidence || 0;
  });
  
  return Object.keys(trends)
    .map(date => ({
      date,
      count: trends[date].count,
      avgRating: (trends[date].totalRating / trends[date].count).toFixed(2),
      avgConfidence: (trends[date].totalConfidence / trends[date].count * 100).toFixed(1)
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30); // Last 30 days
}

function getMissingAnswerCategories(missingAnswers) {
  const categories = {};
  missingAnswers.forEach(ma => {
    if (!categories[ma.category]) {
      categories[ma.category] = { count: 0, highPriority: 0 };
    }
    categories[ma.category].count++;
    if (ma.priority === 'high') {
      categories[ma.category].highPriority++;
    }
  });
  return categories;
}

function getTopMissingQuestions(missingAnswers) {
  return missingAnswers
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(ma => ({
      question: ma.userQuestion,
      frequency: ma.frequency,
      priority: ma.priority,
      category: ma.category
    }));
}

function calculateUserSatisfactionRate() {
  // Mock calculation - in real implementation, get from satisfaction ratings
  return 87; // 87% satisfaction rate
}

/**
 * Calculate confidence distribution from categories array
 */
function calculateConfidenceDistribution(categories) {
  const distribution = { high: 0, medium: 0, low: 0 };
  
  categories.forEach(cat => {
    if (cat.confidence >= 0.8) distribution.high++;
    else if (cat.confidence >= 0.6) distribution.medium++;
    else distribution.low++;
  });
  
  return distribution;
}

/**
 * Get categories breakdown from missing answers
 */
function getCategoriesFromMissingAnswers(categoriesArray) {
  const categories = {};
  categoriesArray.forEach(cat => {
    if (!categories[cat.category]) {
      categories[cat.category] = { count: 0, highPriority: 0 };
    }
    categories[cat.category].count++;
    if (cat.priority === 'high') {
      categories[cat.category].highPriority++;
    }
  });
  return categories;
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(headers) {
  try {
    const dbHealth = await healthCheck();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString(),
        version: '2.0.0-mongodb'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}

exports.handler = handler;
