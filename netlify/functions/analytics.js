/**
 * Netlify Function: Analytics Endpoint
 * Handles user fingerprinting and analytics data
 * Now with MongoDB Atlas persistent storage
 */

import { 
  connectToDatabase,
  generateId 
} from '../../src/utils/database.js';

// Analytics collection helper
const AnalyticsDB = {
  async create(eventData) {
    await connectToDatabase();
    const { db } = await connectToDatabase();
    const collection = db.collection('analytics_events');
    
    const result = await collection.insertOne({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return result.insertedId.toString();
  },

  async find(query = {}, options = {}) {
    await connectToDatabase();
    const { db } = await connectToDatabase();
    const collection = db.collection('analytics_events');
    
    return await collection.find(query, options).toArray();
  },

  async count(query = {}) {
    await connectToDatabase();
    const { db } = await connectToDatabase();
    const collection = db.collection('analytics_events');
    
    return await collection.countDocuments(query);
  }
};

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const analyticsData = JSON.parse(event.body || '{}');
    
    // Validate analytics payload
    if (!analyticsData.event || !analyticsData.context) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid analytics payload' })
      };
    }

    // Process analytics data
    const processedData = await processAnalyticsEvent(analyticsData);
    
    // Log for monitoring (in production, send to analytics service)
    console.log('📊 Analytics Event:', {
      event: analyticsData.event,
      fingerprint: analyticsData.user?.fingerprint?.substring(0, 8) + '...',
      session: analyticsData.user?.session?.substring(0, 8) + '...',
      url: analyticsData.context?.url,
      timestamp: analyticsData.context?.timestamp
    });

    // Store in analytics database (placeholder)
    await storeAnalyticsEvent(processedData);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        eventId: processedData.id,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Analytics Function Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Analytics processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

async function processAnalyticsEvent(rawData) {
  const eventId = generateEventId();
  
  return {
    id: eventId,
    event: rawData.event,
    data: sanitizeEventData(rawData.data),
    user: {
      fingerprint: hashFingerprint(rawData.user?.fingerprint),
      session: rawData.user?.session,
      isReturning: rawData.user?.isReturning || false,
      anonymousId: rawData.user?.fingerprint ? 
        await createAnonymousId(rawData.user.fingerprint) : null
    },
    context: {
      url: sanitizeURL(rawData.context?.url),
      referrer: sanitizeURL(rawData.context?.referrer),
      userAgent: sanitizeUserAgent(rawData.context?.userAgent),
      timestamp: rawData.context?.timestamp || new Date().toISOString(),
      timezone: rawData.context?.timezone
    },
    metadata: {
      processed: new Date().toISOString(),
      version: '1.0',
      platform: 'netlify-functions'
    }
  };
}

function generateEventId() {
  return 'evt_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

function sanitizeEventData(data) {
  if (!data || typeof data !== 'object') return {};
  
  // Remove sensitive information
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  delete sanitized.secret;
  
  return sanitized;
}

function sanitizeURL(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Remove sensitive query parameters
    urlObj.searchParams.delete('token');
    urlObj.searchParams.delete('api_key');
    urlObj.searchParams.delete('password');
    
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

function sanitizeUserAgent(userAgent) {
  if (!userAgent) return null;
  
  // Truncate very long user agents
  return userAgent.length > 200 ? userAgent.substring(0, 200) + '...' : userAgent;
}

function hashFingerprint(fingerprint) {
  if (!fingerprint) return null;
  
  // Hash fingerprint for privacy
  return 'fp_' + fingerprint.substring(0, 12);
}

async function createAnonymousId(fingerprint) {
  if (!fingerprint) return null;
  
  // Create stable anonymous ID from fingerprint
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint + 'chatguus_salt');
  
  if (crypto && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'anon_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }
  
  // Fallback for environments without crypto.subtle
  let hash = 0;
  const str = fingerprint + 'chatguus_salt';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'anon_' + Math.abs(hash).toString(16).substring(0, 16);
}

async function storeAnalyticsEvent(eventData) {
  try {
    // Store in MongoDB Atlas
    const eventId = await AnalyticsDB.create(eventData);
    console.log('📊 Analytics event stored in MongoDB:', eventId);
    
    // Optional: Also send to Google Sheets if configured
    if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      await logToGoogleSheets(eventData);
    }
    
    // Optional: Send to external analytics service
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      await sendToAnalyticsService(eventData);
    }
    
    return eventId;
    
  } catch (error) {
    console.error('Failed to store analytics event:', error);
    // Don't fail the request if analytics storage fails
    throw error;
  }
}

async function logToGoogleSheets(eventData) {
  // Placeholder for Google Sheets integration
  console.log('📊 Would log to Google Sheets:', {
    event: eventData.event,
    anonymousId: eventData.user.anonymousId,
    url: eventData.context.url,
    timestamp: eventData.context.timestamp
  });
}

async function sendToAnalyticsService(eventData) {
  // Placeholder for external analytics service
  console.log('📈 Would send to analytics service:', {
    event: eventData.event,
    user: eventData.user.anonymousId,
    timestamp: eventData.context.timestamp
  });
}
