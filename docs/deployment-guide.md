# 🚀 ChatGuusPT Deployment Guide

## Overzicht

Deze guide helpt je bij het deployen van ChatGuusPT voor productie gebruik.

## 📋 Pre-deployment Checklist

### ✅ Vereisten
- [ ] N8N instance (cloud of self-hosted)
- [ ] OpenAI API account en key
- [ ] Google Workspace account (voor Sheets)
- [ ] SMTP email service
- [ ] Domain/subdomain voor hosting
- [ ] SSL certificaat

### ✅ Accounts & Services
- [ ] OpenAI API key gegenereerd
- [ ] Google Service Account aangemaakt
- [ ] Google Sheets document aangemaakt
- [ ] SMTP credentials geconfigureerd
- [ ] N8N workspace setup

## 🔧 Step-by-Step Deployment

### 1. N8N Workflow Setup

1. **Import Workflow**
   ```bash
   # Upload src/n8n/chatguus-workflow.json naar je N8N instance
   ```

2. **Environment Variables**
   ```bash
   OPENAI_API_KEY=sk-...
   GOOGLE_SHEETS_ID=1ABC...
   GOOGLE_SERVICE_ACCOUNT_EMAIL=chatguus@...
   GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----...
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=noreply@cupolaxs.nl
   SMTP_PASS=app-password
   EMAIL_GENERAL=welcome@cupolaxs.nl
   EMAIL_IT=support@axs-ict.com
   EMAIL_CLEANING=ralphcassa@gmail.com
   EMAIL_EVENTS=irene@cupolaxs.nl
   ```

3. **Activate Workflow**
   - Test webhook endpoint
   - Verify alle nodes zijn geconfigureerd
   - Activate workflow

### 2. Server Deployment

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Option B: Traditional Server
```bash
# Build project
npm run build

# Start production server
NODE_ENV=production npm start

# Configure reverse proxy (nginx/apache)
```

#### Option C: Docker
```dockerfile
# Dockerfile (create if needed)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. Widget CDN Setup

#### Option A: Serve from same domain
```html
<script src="https://jouw-domain.com/widget.js"></script>
```

#### Option B: CDN Distribution
```bash
# Upload widget files naar CDN
aws s3 cp dist/widget.js s3://jouw-cdn-bucket/chatguus/widget.js
aws s3 cp dist/widget.css s3://jouw-cdn-bucket/chatguus/widget.css

# Configure CloudFront distribution
```

### 4. DNS & SSL Configuration

```bash
# DNS Records
chatguus.cupolaxs.nl    A    IP_ADDRESS
api.chatguus.cupolaxs.nl A   IP_ADDRESS

# SSL via Let's Encrypt
certbot --nginx -d chatguus.cupolaxs.nl -d api.chatguus.cupolaxs.nl
```

## 🔐 Security Configuration

### 1. API Security
```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Te veel verzoeken, probeer het over een minuut opnieuw.'
});

app.use('/api/chat', limiter);
```

### 2. CORS Configuration
```javascript
const corsOptions = {
  origin: [
    'https://cupolaxs.nl',
    'https://www.cupolaxs.nl',
    'https://admin.cupolaxs.nl'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### 3. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/chat', [
  body('message').isLength({ min: 1, max: 1000 }).escape(),
  body('sessionId').isAlphanumeric().isLength({ min: 10, max: 50 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... rest of handler
});
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### 2. Error Tracking
```bash
# Sentry integration (optional)
npm install @sentry/node

# Configure in server
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
```

### 3. Analytics Dashboard
```javascript
// Google Analytics events
gtag('event', 'chat_interaction', {
  'event_category': 'chatbot',
  'event_label': intent.type,
  'session_id': sessionId
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy ChatGuusPT

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Website Integration Examples

### WordPress Integration
```php
// functions.php
function add_chatguus_widget() {
    ?>
    <script src="https://chatguus.cupolaxs.nl/widget.js"></script>
    <script>
        ChatGuus.init({
            webhookUrl: 'https://n8n.cupolaxs.nl/webhook/chatguus',
            theme: 'koepel'
        });
    </script>
    <?php
}
add_action('wp_footer', 'add_chatguus_widget');
```

### React Integration
```jsx
import { useEffect } from 'react';

function ChatGuusProvider() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://chatguus.cupolaxs.nl/widget.js';
    script.onload = () => {
      window.ChatGuus.init({
        webhookUrl: 'https://n8n.cupolaxs.nl/webhook/chatguus',
        theme: 'koepel'
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
```

### Vue.js Integration
```vue
<template>
  <div id="chatguus-container"></div>
</template>

<script>
export default {
  name: 'ChatGuusWidget',
  mounted() {
    this.loadChatGuus();
  },
  methods: {
    async loadChatGuus() {
      const script = document.createElement('script');
      script.src = 'https://chatguus.cupolaxs.nl/widget.js';
      script.onload = () => {
        window.ChatGuus.init({
          target: '#chatguus-container',
          webhookUrl: 'https://n8n.cupolaxs.nl/webhook/chatguus'
        });
      };
      document.head.appendChild(script);
    }
  }
};
</script>
```

## 🧪 Testing in Production

### 1. Smoke Tests
```bash
# Test webhook endpoint
curl -X POST https://n8n.cupolaxs.nl/webhook/chatguus \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"smoke-test"}'

# Test widget loading
curl -I https://chatguus.cupolaxs.nl/widget.js

# Test health endpoint
curl https://chatguus.cupolaxs.nl/health
```

### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Create load test config
# artillery.yml
config:
  target: 'https://chatguus.cupolaxs.nl'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Chat interactions"
    requests:
      - post:
          url: "/api/chat"
          json:
            message: "Hallo Guus"
            sessionId: "load-test-{{ $randomString() }}"

# Run load test
artillery run artillery.yml
```

### 3. End-to-End Tests
```javascript
// e2e-test.js
const puppeteer = require('puppeteer');

async function testChatWidget() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://test.cupolaxs.nl');
  
  // Wait for widget to load
  await page.waitForSelector('.chatguus-toggle');
  
  // Open chat
  await page.click('.chatguus-toggle');
  
  // Send message
  await page.type('#chatguus-input', 'Hallo Guus!');
  await page.click('.chatguus-send');
  
  // Wait for response
  await page.waitForSelector('.chatguus-message.bot', { timeout: 10000 });
  
  console.log('✅ Chat widget test passed');
  
  await browser.close();
}

testChatWidget().catch(console.error);
```

## 📈 Performance Optimization

### 1. Widget Loading
```javascript
// Lazy load widget
function loadChatGuusWhenNeeded() {
  let loaded = false;
  
  function loadWidget() {
    if (loaded) return;
    loaded = true;
    
    const script = document.createElement('script');
    script.src = 'https://chatguus.cupolaxs.nl/widget.js';
    document.head.appendChild(script);
  }
  
  // Load on user interaction
  document.addEventListener('mousemove', loadWidget, { once: true });
  document.addEventListener('scroll', loadWidget, { once: true });
  
  // Fallback: load after 5 seconds
  setTimeout(loadWidget, 5000);
}

loadChatGuusWhenNeeded();
```

### 2. CDN Configuration
```nginx
# nginx.conf
location /widget.js {
    expires 1d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

### 3. Database Optimization
```sql
-- Index voor Google Sheets queries
CREATE INDEX idx_session_timestamp ON chat_interactions(session_id, timestamp);
CREATE INDEX idx_intent_timestamp ON chat_interactions(intent, timestamp);
```

## 🔄 Maintenance

### Daily Tasks
- [ ] Check N8N workflow execution logs
- [ ] Monitor OpenAI API usage
- [ ] Review error rates in application logs

### Weekly Tasks  
- [ ] Analyze chat interaction statistics
- [ ] Review and categorize service requests
- [ ] Update FAQ database based on common questions
- [ ] Check email routing accuracy

### Monthly Tasks
- [ ] Review and optimize OpenAI prompts
- [ ] Update Guus personality based on feedback
- [ ] Analyze conversion rates (chat → booking)
- [ ] Security audit en dependency updates

## 📞 Support Contacts

- **Technical Issues**: support@axs-ict.com
- **Content Updates**: welcome@cupolaxs.nl  
- **Event Integration**: irene@cupolaxs.nl
- **Emergency**: [emergency contact]

## 🆘 Rollback Plan

In geval van kritieke issues:

1. **Disable N8N Workflow**: Stop workflow execution
2. **Fallback Mode**: Widget gebruikt local API endpoint
3. **Emergency Contact**: Toon direct contact informatie
4. **Monitoring**: Extra alerting tijdens rollback

```javascript
// Emergency fallback configuration
ChatGuus.init({
  webhookUrl: '/api/chat', // Local fallback
  fallbackMode: true,
  emergencyContact: 'welcome@cupolaxs.nl',
  emergencyMessage: 'Onze chatbot heeft tijdelijk problemen. Neem direct contact op via welcome@cupolaxs.nl'
});
```
