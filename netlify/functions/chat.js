/**
 * Netlify Function: Chat Endpoint
 * Serverless chat API voor ChatGuusPT
 */

import { GuusPersonality } from '../../src/server/guus-personality.js';
import { EmailRouter } from '../../src/server/email-router.js';
import { ServiceRequestHandler } from '../../src/server/service-request-handler.js';
import { messageSanitizer } from '../../src/utils/message-sanitizer.js';
import { 
  ChatSessionsDB, 
  connectToDatabase
} from '../../src/utils/database.js';
import { 
  processTenantRequest,
  addTenantContext,
  logTenantEvent
} from '../../src/utils/tenant-helper.js';

// Initialize services (singleton pattern for serverless)
let guusPersonality, emailRouter, serviceHandler;

function initializeServices() {
  if (!guusPersonality) {
    guusPersonality = new GuusPersonality();
    emailRouter = new EmailRouter();
    serviceHandler = new ServiceRequestHandler();
  }
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  // Only allow POST requests
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

  // Process tenant request
  const tenantResult = processTenantRequest(event);
  if (tenantResult.error) {
    return tenantResult.response;
  }

  const { tenantId, tenant, headers } = tenantResult;

  try {
    // Initialize services
    initializeServices();

    // Parse request body
    const requestData = JSON.parse(event.body || '{}');
    const { message, sessionId, userAgent, url } = requestData;

    // Validate input
    const validation = messageSanitizer.validateMessage(message);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid message', 
          details: validation.errors 
        })
      };
    }

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Session ID is required' })
      };
    }

    // Sanitize user input
    const sanitizedMessage = messageSanitizer.sanitizeMessage(message, {
      stripHTML: true,
      maxLength: 1000,
      allowMarkdown: false
    });

    // Log interaction
    console.log(`[${new Date().toISOString()}] Chat - Session: ${sessionId}, Message: ${sanitizedMessage}`);

    // Analyze message intent
    const intent = await guusPersonality.analyzeIntent(sanitizedMessage);
    
    let response;
    let action = null;

    // Handle different intent types
    switch (intent.type) {
      case 'service_request':
        response = await guusPersonality.handleServiceRequest(sanitizedMessage, intent);
        action = {
          type: 'service_request_form',
          category: intent.category
        };
        
        // Route email if enough information
        if (intent.hasCompleteInfo) {
          try {
            const routingResult = await emailRouter.routeServiceRequest(intent, {
              message: sanitizedMessage,
              sessionId,
              userAgent,
              url
            });
            action.emailSent = true;
            action.department = routingResult.department;
          } catch (emailError) {
            console.error('Email routing failed:', emailError);
            // Continue without email routing
          }
        }
        break;

      case 'event_inquiry':
        response = await guusPersonality.handleEventInquiry(sanitizedMessage, intent);
        action = {
          type: 'event_inquiry_form'
        };
        
        // Route to events team if complete
        if (intent.hasCompleteInfo) {
          try {
            await emailRouter.routeEventInquiry(intent, {
              message: sanitizedMessage,
              sessionId,
              userAgent,
              url
            });
            action.emailSent = true;
            action.department = 'Events Team';
          } catch (emailError) {
            console.error('Event email routing failed:', emailError);
          }
        }
        break;

      case 'faq':
        response = await guusPersonality.handleFAQ(sanitizedMessage, intent);
        break;

      case 'general':
      default:
        response = await guusPersonality.handleGeneral(sanitizedMessage, intent);
        break;
    }

    // Sanitize bot response (allow some formatting)
    const sanitizedResponse = messageSanitizer.sanitizeMessage(response, {
      stripHTML: false,
      maxLength: 2000,
      allowMarkdown: true
    });

    // Log to Google Sheets if configured
    if (process.env.GOOGLE_SHEETS_ID) {
      try {
        await serviceHandler.logInteraction({
          sessionId,
          message: sanitizedMessage,
          response: sanitizedResponse,
          intent: intent.type,
          timestamp: new Date().toISOString(),
          userAgent,
          url
        });
      } catch (sheetsError) {
        console.error('Google Sheets logging failed:', sheetsError);
        // Continue without logging
      }
    }

    // Log chat session to MongoDB
    try {
      await logChatSession({
        sessionId,
        tenantId: requestData.tenantId || 'default',
        userMessage: sanitizedMessage,
        aiResponse: sanitizedResponse,
        intent: intent?.type,
        action,
        metadata: {
          userAgent,
          url,
          language: requestData.language || 'nl',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Chat session logging failed:', logError);
      // Continue without logging
    }

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        message: sanitizedResponse,
        action,
        sessionId,
        timestamp: new Date().toISOString(),
        service: 'ChatGuusPT-Netlify'
      })
    };

  } catch (error) {
    console.error('Chat Function Error:', error);
    
    // Return fallback response
    const fallbackResponse = 'Sorry, er ging iets mis. Probeer het opnieuw of neem direct contact op via welcome@cupolaxs.nl';
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: fallbackResponse,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        sessionId: event.body ? JSON.parse(event.body).sessionId : null,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Helper function to log chat sessions to MongoDB
async function logChatSession(sessionData) {
  try {
    await connectToDatabase();
    
    const { sessionId, tenantId, userMessage, aiResponse, intent, action, metadata } = sessionData;
    
    // Try to find existing session
    const existingSession = await ChatSessionsDB.findOne({ sessionId });
    
    const messageEntry = {
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    const responseEntry = {
      content: aiResponse,
      sender: 'ai',
      intent,
      action,
      timestamp: new Date()
    };
    
    if (existingSession) {
      // Update existing session with new messages
      await ChatSessionsDB.updateOne(
        { sessionId },
        {
          $push: { 
            messages: { $each: [messageEntry, responseEntry] }
          },
          $set: { 
            updatedAt: new Date(),
            lastActivity: new Date()
          }
        }
      );
    } else {
      // Create new session
      const newSession = {
        sessionId,
        tenantId,
        messages: [messageEntry, responseEntry],
        metadata: {
          userAgent: metadata.userAgent,
          url: metadata.url,
          language: metadata.language,
          startTime: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date()
      };
      
      await ChatSessionsDB.create(newSession);
    }
    
    console.log(`📝 Chat session logged: ${sessionId}`);
    
  } catch (error) {
    console.error('Failed to log chat session:', error);
    throw error;
  }
}
