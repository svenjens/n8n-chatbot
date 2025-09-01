# N8N Setup Guide voor ChatGuusPT

## 🚀 N8N Workflow Installatie

### 1. Workflow Importeren

1. Open je N8N instance
2. Klik op "Import workflow" 
3. Upload het bestand `src/n8n/chatguus-workflow.json`
4. Configureer de nodes zoals hieronder beschreven

### 2. Node Configuratie

#### Webhook Node
```
Name: Chat Webhook
Path: chatguus
HTTP Method: POST
Authentication: None (of Bearer Token voor security)
```

**Webhook URL:** `https://jouw-n8n-instance.com/webhook/chatguus`

#### AI Agent Node
```
Name: Guus AI Agent
Agent Type: Conversational Agent
Prompt: [Zie guus-personality.js voor complete prompt]
Memory: Buffer Window Memory (10 messages)
```

#### OpenAI Node
```
Name: OpenAI Chat
Model: gpt-3.5-turbo
Temperature: 0.7
Max Tokens: 500
API Key: {{ $env.OPENAI_API_KEY }}
```

#### Memory Node
```
Name: Conversation Memory
Session ID: {{ $json.sessionId }}
Context Window: 10 messages
```

### 3. Conditional Logic Nodes

#### Service Request Check
```
Condition: {{ $json.message.toLowerCase() }}
Contains: service,verzoek,aanvraag,hulp nodig,probleem
```

#### Event Inquiry Check  
```
Condition: {{ $json.message.toLowerCase() }}
Contains: event,evenement,organiseren,feest,bijeenkomst
```

### 4. Email Routing Node

```javascript
// Function Node Code voor Email Routing
const message = $json.message.toLowerCase();
let routingEmail = 'welcome@cupolaxs.nl';
let department = 'Algemeen';

// IT Keywords
const itKeywords = ['computer', 'laptop', 'internet', 'wifi', 'software', 'technisch', 'it', 'ict'];
if (itKeywords.some(keyword => message.includes(keyword))) {
  routingEmail = 'support@axs-ict.com';
  department = 'IT Support';
}

// Cleaning Keywords  
const cleaningKeywords = ['schoonmaak', 'schoon', 'opruimen', 'stofzuigen', 'cleaning'];
if (cleaningKeywords.some(keyword => message.includes(keyword))) {
  routingEmail = 'ralphcassa@gmail.com';
  department = 'Schoonmaak';
}

// Event Keywords
const eventKeywords = ['event', 'evenement', 'organiseren', 'feest', 'borrel'];
if (eventKeywords.some(keyword => message.includes(keyword))) {
  routingEmail = 'irene@cupolaxs.nl';
  department = 'Events';
}

return {
  routingEmail,
  department,
  originalMessage: $json.message,
  sessionId: $json.sessionId,
  timestamp: new Date().toISOString()
};
```

### 5. Google Sheets Node

```
Authentication: Service Account
Document ID: {{ $env.GOOGLE_SHEETS_ID }}
Sheet Name: Chat Interactions
Operation: Append

Fields:
- Timestamp: {{ $now }}
- Session ID: {{ $json.sessionId }}
- Message: {{ $json.message }}
- Intent: {{ $json.intent }}
- Routed To: {{ $json.routingEmail }}
- Status: New
```

### 6. Email Send Node

```
From: "Guus van de Koepel" <noreply@cupolaxs.nl>
To: {{ $json.routingEmail }}
Subject: Nieuwe {{ $json.department }} vraag via ChatGuusPT

Template: [Zie email-router.js voor HTML template]
```

## 🔧 Environment Variables

Configureer deze environment variables in N8N:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Google Sheets
GOOGLE_SHEETS_ID=1ABC...
GOOGLE_SERVICE_ACCOUNT_EMAIL=chatguus@...
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cupolaxs.nl
SMTP_PASS=app-specific-password

# Koepel Email Addresses
EMAIL_GENERAL=welcome@cupolaxs.nl
EMAIL_IT=support@axs-ict.com  
EMAIL_CLEANING=ralphcassa@gmail.com
EMAIL_EVENTS=irene@cupolaxs.nl
```

## 🧪 Testing

### Test Webhook
```bash
curl -X POST https://jouw-n8n-instance.com/webhook/chatguus \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hallo Guus, kun je me helpen?",
    "sessionId": "test-session-123",
    "userAgent": "Test Browser",
    "url": "https://test.cupolaxs.nl"
  }'
```

### Expected Response
```json
{
  "message": "Hallo! Leuk dat je contact opneemt. Ik help je graag verder!",
  "sessionId": "test-session-123", 
  "timestamp": "2024-01-01T12:00:00.000Z",
  "action": null
}
```

## 🔒 Security Best Practices

1. **Webhook Authentication:**
   ```
   Voeg Bearer Token toe aan webhook voor security
   Authorization: Bearer YOUR_SECRET_TOKEN
   ```

2. **Rate Limiting:**
   ```
   Implementeer rate limiting in N8N of reverse proxy
   Max: 10 requests per minuut per IP
   ```

3. **Input Validation:**
   ```javascript
   // Validatie in Function Node
   if (!$json.message || $json.message.length > 1000) {
     return { error: 'Invalid message length' };
   }
   
   if (!$json.sessionId || !/^[a-zA-Z0-9_-]+$/.test($json.sessionId)) {
     return { error: 'Invalid session ID' };
   }
   ```

4. **CORS Configuration:**
   ```
   Configureer CORS headers in webhook response:
   Access-Control-Allow-Origin: https://cupolaxs.nl
   Access-Control-Allow-Methods: POST
   Access-Control-Allow-Headers: Content-Type
   ```

## 📊 Monitoring & Analytics

### Workflow Monitoring
- Enable execution logging in N8N
- Set up error notifications
- Monitor webhook response times

### Google Sheets Dashboards
- Chat Interactions sheet voor gesprek analytics
- Service Requests sheet voor verzoek tracking  
- Event Inquiries sheet voor leads tracking

### Key Metrics
- Gesprekken per dag
- Intent distributie (service/event/faq)
- Response tijd gemiddelden
- Email routing accuracy
- Conversion rate (inquiry → booking)

## 🔄 Workflow Versioning

### Development Workflow
1. Test wijzigingen in development N8N instance
2. Export workflow als JSON
3. Update `chatguus-workflow.json` in repository
4. Deploy naar production N8N instance

### Backup Strategy
- Wekelijkse export van workflow
- Environment variables backup
- Google Sheets backup via API

## 🆘 Troubleshooting

### Common Issues

**Webhook niet bereikbaar:**
- Check N8N instance status
- Verify webhook URL en path
- Test CORS configuration

**OpenAI API Errors:**
- Verify API key geldigheid
- Check usage limits en billing
- Monitor rate limiting

**Email delivery issues:**
- Test SMTP configuratie
- Check spam filters
- Verify sender reputation

**Google Sheets sync problems:**
- Verify service account permissions
- Check sheet ID en tab names
- Test authentication

### Debug Mode
```javascript
// Voeg debug logging toe aan Function Nodes
console.log('Debug:', JSON.stringify($json, null, 2));
return $json;
```
