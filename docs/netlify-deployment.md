# 🚀 Netlify Deployment Guide voor ChatGuusPT

## Overzicht

ChatGuusPT is nu volledig compatibel met Netlify! De backend functionaliteit wordt geleverd via Netlify Functions (serverless), waardoor je geen aparte server nodig hebt.

## ✅ Wat werkt op Netlify

### ✅ **Volledig Ondersteund:**
- 💬 Chat functionaliteit via Netlify Functions
- 🤖 OpenAI integratie voor AI responses
- 📧 Email routing naar teams
- 📊 Google Sheets logging
- 🎨 Multi-tenant white labeling
- 📱 Embeddable widget
- 🔄 N8N webhook integration

### ⚠️ **Beperkingen:**
- Session storage is stateless (gebruik externe session store voor persistentie)
- Cold starts kunnen 1-2 seconden duren
- Geen real-time WebSocket ondersteuning
- Function timeout van 10 seconden

## 🚀 Deployment Stappen

### 1. Netlify CLI Installeren

```bash
npm install -g netlify-cli
netlify login
```

### 2. Project Configureren

```bash
# In je project directory
netlify init

# Kies "Create & configure a new site"
# Selecteer je team
# Geef site naam: chatguuspt-[jouw-naam]
```

### 3. Environment Variables Instellen

In Netlify Dashboard → Site Settings → Environment Variables:

```bash
# OpenAI (VERPLICHT)
OPENAI_API_KEY=sk-proj-...

# N8N Integration (OPTIONEEL)
N8N_WEBHOOK_URL=https://jouw-n8n-instance.com/webhook/chatguus

# Email Configuration (OPTIONEEL - wordt gelogd als niet ingesteld)
EMAIL_GENERAL=welcome@cupolaxs.nl
EMAIL_IT=support@axs-ict.com
EMAIL_CLEANING=ralphcassa@gmail.com
EMAIL_EVENTS=irene@cupolaxs.nl

# Google Sheets (OPTIONEEL)
GOOGLE_SHEETS_ID=1ABC123...
GOOGLE_SERVICE_ACCOUNT_EMAIL=chatguus@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Security
NODE_ENV=production
```

### 4. Deploy

```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

## 🔧 Netlify Functions Architectuur

### Function Endpoints

```
/.netlify/functions/
├── chat.js          # Main chat API
├── tenants.js       # Tenant management
├── widget.js        # Dynamic widget serving
└── health.js        # Health check
```

### API Routes

```bash
# Chat API
POST /.netlify/functions/chat
{
  "message": "Hallo Guus!",
  "sessionId": "session_123",
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com"
}

# Widget serving
GET /.netlify/functions/widget?tenant=koepel

# Tenant management
GET /.netlify/functions/tenants
POST /.netlify/functions/tenants
PUT /.netlify/functions/tenants/{id}
DELETE /.netlify/functions/tenants/{id}

# Health check
GET /.netlify/functions/health
```

## 📱 Website Integratie op Netlify

### Basis Integratie

```html
<!-- Voor Netlify deployment -->
<script src="https://jouw-site.netlify.app/.netlify/functions/widget"></script>
<script>
  ChatGuus.init({
    // Netlify Functions worden automatisch geconfigureerd
    theme: 'koepel',
    welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?'
  });
</script>
```

### Multi-Tenant Integratie

```html
<!-- Voor verschillende tenants -->
<script src="https://jouw-site.netlify.app/.netlify/functions/widget?tenant=mijn-bedrijf"></script>
<script>
  ChatGuus.init({
    tenantId: 'mijn-bedrijf',
    theme: 'custom'
  });
</script>
```

### React/Vue Integratie

```javascript
// React component
import { useEffect } from 'react';

function ChatBotProvider({ tenantId = 'koepel' }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `/.netlify/functions/widget?tenant=${tenantId}`;
    script.onload = () => {
      window.ChatGuus?.init({ tenantId });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [tenantId]);

  return null;
}
```

## 🔄 N8N Integration op Netlify

### Webhook Configuration

```json
{
  "webhookUrl": "https://jouw-site.netlify.app/.netlify/functions/chat",
  "fallbackUrl": "https://jouw-n8n-instance.com/webhook/chatguus"
}
```

### Hybrid Mode

ChatGuusPT kan in hybrid mode draaien:
1. **Primary**: N8N workflow voor complexe logic
2. **Fallback**: Netlify Functions voor basis chat

```javascript
// Automatische fallback in widget
ChatGuus.init({
  webhookUrl: 'https://n8n.example.com/webhook/chatguus', // Primary
  fallbackUrl: '/.netlify/functions/chat', // Fallback
  retryAttempts: 2,
  timeoutMs: 5000
});
```

## ⚡ Performance Optimalisatie

### 1. Function Warming

```javascript
// netlify/functions/warm.js
export const handler = async (event, context) => {
  // Keep functions warm
  return {
    statusCode: 200,
    body: JSON.stringify({ warmed: true })
  };
};

// Cron job in Netlify
// */5 * * * * curl https://jouw-site.netlify.app/.netlify/functions/warm
```

### 2. Caching Strategie

```javascript
// In chat function
const CACHE_DURATION = 5 * 60; // 5 minutes

return {
  statusCode: 200,
  headers: {
    'Cache-Control': `public, max-age=${CACHE_DURATION}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(response)
};
```

### 3. Bundle Optimalisatie

```javascript
// vite.config.js aanpassing voor Netlify
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['openai', 'uuid'],
          utils: ['src/utils/message-sanitizer.js']
        }
      }
    }
  }
});
```

## 🔐 Security op Netlify

### 1. Environment Variables

```bash
# Netlify UI → Site Settings → Environment Variables
OPENAI_API_KEY=sk-... # Encrypted by default
WEBHOOK_SECRET=random-secret-string
ALLOWED_ORIGINS=https://cupolaxs.nl,https://www.cupolaxs.nl
```

### 2. Rate Limiting

```javascript
// netlify/functions/chat.js
const rateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  
  // Remove old requests (older than 1 minute)
  const recentRequests = requests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 30) { // Max 30 requests per minute
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

### 3. Input Validation

```javascript
import { messageSanitizer } from '../../src/utils/message-sanitizer.js';

// In function handler
const validation = messageSanitizer.validateMessage(message);
if (!validation.isValid) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid input', details: validation.errors })
  };
}
```

## 📊 Monitoring & Analytics

### 1. Netlify Analytics

```javascript
// Track function usage
export const handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    // ... function logic
    
    const duration = Date.now() - startTime;
    console.log(`Function executed in ${duration}ms`);
    
  } catch (error) {
    console.error('Function error:', error);
    throw error;
  }
};
```

### 2. Custom Logging

```javascript
// netlify/functions/analytics.js
export const handler = async (event, context) => {
  const { type, data } = JSON.parse(event.body);
  
  // Log to external service (LogRocket, Sentry, etc.)
  console.log(`Analytics: ${type}`, data);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ logged: true })
  };
};
```

## 🧪 Testing op Netlify

### Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local Netlify dev server
npm run dev:netlify

# Test functions locally
curl -X POST http://localhost:8888/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test-123"}'
```

### Production Testing

```bash
# Test deployed functions
curl -X POST https://chatguuspt.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hallo Guus","sessionId":"prod-test"}'

# Test widget loading
curl -I https://chatguuspt.netlify.app/.netlify/functions/widget

# Test health endpoint
curl https://chatguuspt.netlify.app/.netlify/functions/health
```

## 🔄 CI/CD met Netlify

### Automatische Deployment

```yaml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

# Automatisch deployen bij git push naar main branch
```

### Branch Previews

```bash
# Elke branch krijgt automatisch preview URL
git checkout -b feature/nieuwe-functie
git push origin feature/nieuwe-functie

# Netlify maakt automatisch: https://feature-nieuwe-functie--jouw-site.netlify.app
```

## 📈 Schaalbaarheid

### Function Limits

```
- Execution time: 10 seconden (Background: 15 minuten)
- Memory: 1008 MB
- Payload size: 6 MB
- Concurrent executions: 1000
```

### Optimalisatie Tips

```javascript
// Lazy loading van dependencies
const loadOpenAI = async () => {
  const { default: OpenAI } = await import('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Connection pooling voor databases
let dbConnection = null;
const getDB = async () => {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  return dbConnection;
};
```

## 🆘 Troubleshooting

### Common Issues

**Function Timeout:**
```javascript
// Reduce OpenAI timeout
const response = await openai.chat.completions.create({
  // ... config
  timeout: 8000 // 8 seconds max
});
```

**Cold Start Latency:**
```javascript
// Pre-warm critical functions
export const handler = async (event, context) => {
  // Keep function warm
  if (event.source === 'aws.events') {
    return { statusCode: 200, body: 'warmed' };
  }
  
  // ... normal logic
};
```

**Environment Variables:**
```bash
# Check in function
console.log('Environment check:', {
  openai: !!process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV
});
```

## 🎯 Volgende Stappen

1. **Deploy naar Netlify:**
   ```bash
   npm run deploy:preview  # Test deployment
   npm run deploy         # Production deployment
   ```

2. **Configureer Custom Domain:**
   ```
   Netlify Dashboard → Domain Management → Add custom domain
   chatguus.cupolaxs.nl → jouw-site.netlify.app
   ```

3. **Setup Monitoring:**
   - Netlify Analytics inschakelen
   - Function logs monitoren
   - Performance metrics bijhouden

4. **Test Multi-Tenant:**
   ```
   https://chatguuspt.netlify.app/.netlify/functions/widget?tenant=demo-company
   ```

## 📞 Netlify Support

- **Documentation:** https://docs.netlify.com/functions/
- **Community:** https://answers.netlify.com/
- **Status:** https://netlifystatus.com/

## 🔄 Migratie van Express naar Netlify

Als je al een Express server hebt draaien, kun je beide parallel gebruiken:

```javascript
// Hybrid deployment
const isNetlify = process.env.NETLIFY === 'true';

if (isNetlify) {
  // Use Netlify Functions
  window.ChatGuus.init({
    webhookUrl: '/.netlify/functions/chat'
  });
} else {
  // Use Express server
  window.ChatGuus.init({
    webhookUrl: 'https://jouw-server.com/api/chat'
  });
}
```

**Voordelen Netlify vs Express:**

| Feature | Netlify Functions | Express Server |
|---------|------------------|----------------|
| 🚀 Setup | Zeer eenvoudig | Meer configuratie |
| 💰 Kosten | Pay-per-use | Vaste server kosten |
| 📈 Scaling | Automatisch | Handmatig |
| 🔧 Maintenance | Minimaal | Server onderhoud |
| ⚡ Cold Starts | 1-2 seconden | Altijd warm |
| 🔄 WebSockets | ❌ | ✅ |
| 📊 Persistent Storage | Externe service | Lokale database |

**Aanbeveling:** Start met Netlify voor eenvoud, migreer naar Express als je WebSockets of complexe state management nodig hebt.
