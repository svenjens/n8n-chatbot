/**
 * ChatGuusPT Server
 * Backend API voor chatbot functionaliteit
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GuusPersonality } from './guus-personality.js';
import { EmailRouter } from './email-router.js';
import { ServiceRequestHandler } from './service-request-handler.js';
import { TenantManager } from './tenant-manager.js';
import { WhiteLabelService } from './white-label-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../widget')));

// Initialize services
const guusPersonality = new GuusPersonality();
const emailRouter = new EmailRouter();
const serviceHandler = new ServiceRequestHandler();
const tenantManager = new TenantManager();
const whiteLabelService = new WhiteLabelService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ChatGuusPT',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve widget files
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../widget/chatguus.js'));
});

app.get('/widget.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../widget/chatguus.css'));
});

// Chat endpoint (fallback if N8N is not available)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, userAgent, url } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ 
        error: 'Message and sessionId are required' 
      });
    }

    // Log interaction
    console.log(`[${new Date().toISOString()}] Chat - Session: ${sessionId}, Message: ${message}`);

    // Analyze message intent
    const intent = await guusPersonality.analyzeIntent(message);
    
    let response;
    let action = null;

    switch (intent.type) {
      case 'service_request':
        response = await guusPersonality.handleServiceRequest(message, intent);
        action = {
          type: 'service_request_form',
          category: intent.category
        };
        
        // Route email if enough information
        if (intent.hasCompleteInfo) {
          const routingResult = await emailRouter.routeServiceRequest(intent, {
            message,
            sessionId,
            userAgent,
            url
          });
          action.emailSent = true;
          action.department = routingResult.department;
        }
        break;

      case 'event_inquiry':
        response = await guusPersonality.handleEventInquiry(message, intent);
        action = {
          type: 'event_inquiry_form'
        };
        
        // Route to events team if complete
        if (intent.hasCompleteInfo) {
          await emailRouter.routeEventInquiry(intent, {
            message,
            sessionId,
            userAgent,
            url
          });
          action.emailSent = true;
          action.department = 'Events Team';
        }
        break;

      case 'faq':
        response = await guusPersonality.handleFAQ(message, intent);
        break;

      case 'general':
      default:
        response = await guusPersonality.handleGeneral(message, intent);
        break;
    }

    // Log to Google Sheets if configured
    if (process.env.GOOGLE_SHEETS_ID) {
      await serviceHandler.logInteraction({
        sessionId,
        message,
        response,
        intent: intent.type,
        timestamp: new Date().toISOString(),
        userAgent,
        url
      });
    }

    res.json({
      message: response,
      action,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    const fallbackResponse = guusPersonality.getFallbackResponse();
    
    res.status(500).json({
      message: fallbackResponse,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sessionId: req.body.sessionId,
      timestamp: new Date().toISOString()
    });
  }
});

// N8N webhook proxy endpoint
app.post('/api/n8n-proxy', async (req, res) => {
  try {
    if (!process.env.N8N_WEBHOOK_URL) {
      return res.status(500).json({ 
        error: 'N8N webhook URL not configured' 
      });
    }

    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('N8N Proxy Error:', error);
    
    // Fallback to local chat endpoint
    return app.handle(req, res);
  }
});

// Multi-tenant chat endpoint
app.post('/api/chat/:tenantId', whiteLabelService.tenantMiddleware(), async (req, res) => {
  try {
    const { message, sessionId, userAgent, url } = req.body;
    const tenant = req.tenant;
    
    if (!message || !sessionId) {
      return res.status(400).json({ 
        error: 'Message and sessionId are required' 
      });
    }

    // Log interaction with tenant context
    console.log(`[${new Date().toISOString()}] ${tenant.name} - Session: ${sessionId}, Message: ${message}`);

    // Use tenant-specific personality
    const tenantPersonality = new GuusPersonality();
    tenantPersonality.systemPrompt = req.tenantConfig.personality.systemPrompt;

    const intent = await tenantPersonality.analyzeIntent(message);
    let response;
    let action = null;

    // Handle based on tenant features
    if (intent.type === 'service_request' && tenant.features.serviceRequests) {
      response = await tenantPersonality.handleServiceRequest(message, intent);
      action = { type: 'service_request_form', category: intent.category };
    } else if (intent.type === 'event_inquiry' && tenant.features.eventInquiries) {
      response = await tenantPersonality.handleEventInquiry(message, intent);
      action = { type: 'event_inquiry_form' };
    } else if (intent.type === 'faq' && tenant.features.faqSystem) {
      response = await tenantPersonality.handleFAQ(message, intent);
    } else {
      response = await tenantPersonality.handleGeneral(message, intent);
    }

    res.json({
      message: response,
      action,
      sessionId,
      timestamp: new Date().toISOString(),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        botName: tenant.personality.name
      }
    });

  } catch (error) {
    console.error(`Tenant ${req.tenant?.id} Chat Error:`, error);
    res.status(500).json({
      message: req.tenantConfig?.personality.fallbackMessages[0] || 'Sorry, something went wrong.',
      sessionId: req.body.sessionId,
      timestamp: new Date().toISOString()
    });
  }
});

// Dynamic widget endpoint
app.get('/api/widget/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const widget = await whiteLabelService.generateTenantWidget(tenantId, req.query);
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
    
    res.send(`
      ${widget.css}
      ${widget.js}
    `);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Tenant configuration endpoint
app.get('/api/config/:tenantId', async (req, res) => {
  try {
    const config = await whiteLabelService.getTenantConfig(req.params.tenantId);
    res.json(config);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Tenant management endpoints
app.get('/api/tenants', (req, res) => {
  const tenants = tenantManager.getAllTenants().map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    active: tenant.active,
    features: tenant.features,
    createdAt: tenant.createdAt
  }));
  
  res.json({ tenants, stats: tenantManager.getTenantStats() });
});

app.post('/api/tenants', async (req, res) => {
  try {
    const result = await whiteLabelService.createTenant(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tenants/:tenantId', async (req, res) => {
  try {
    const updated = await whiteLabelService.updateTenant(req.params.tenantId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tenants/:tenantId', async (req, res) => {
  try {
    await whiteLabelService.deleteTenant(req.params.tenantId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Example endpoint for testing
app.get('/api/test-guus', async (req, res) => {
  const testMessage = req.query.message || "Hallo Guus, kun je me helpen?";
  const tenantId = req.query.tenant || 'koepel';
  
  try {
    const tenant = tenantManager.getTenant(tenantId);
    const intent = await guusPersonality.analyzeIntent(testMessage);
    const response = await guusPersonality.handleGeneral(testMessage, intent);
    
    res.json({
      testMessage,
      intent,
      response,
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        botName: tenant.personality.name
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    message: 'Er ging iets mis op de server. Probeer het opnieuw of neem contact op via welcome@cupolaxs.nl',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint niet gevonden',
    availableEndpoints: [
      'GET /health',
      'GET /widget.js', 
      'GET /widget.css',
      'POST /api/chat',
      'POST /api/n8n-proxy',
      'GET /api/test-guus'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 ChatGuusPT Server running on port ${PORT}`);
  console.log(`📱 Widget available at: http://localhost:${PORT}/widget.js`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🔗 N8N Proxy: http://localhost:${PORT}/api/n8n-proxy`);
  console.log(`🧪 Test Guus: http://localhost:${PORT}/api/test-guus?message=hallo`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - AI features will not work');
  }
  
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn('⚠️  N8N_WEBHOOK_URL not set - using fallback chat endpoint');
  }
});

export default app;
