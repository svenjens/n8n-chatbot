# ChatGuusPT Email Routing Architectuur

## Overzicht

De ChatGuusPT applicatie gebruikt een **gescheiden architectuur** waarbij de chatbot functionaliteit (AI, intent analysis) volledig in Netlify draait, en n8n **alleen** wordt gebruikt voor email routing en notificaties.

## Architectuur Diagram

```
┌─────────────┐
│   Widget    │ (Frontend)
└──────┬──────┘
       │ POST /chat
       ↓
┌─────────────────────────┐
│  Netlify Function       │
│  (chat.js)              │
│                         │
│  ✓ OpenAI Chat          │
│  ✓ Intent Analysis      │
│  ✓ Guus Personality     │
│  ✓ Response Generation  │
└──────┬──────────────────┘
       │
       ↓ (if action required)
       │ Fire-and-forget webhook
       ↓
┌─────────────────────────┐
│  n8n Workflow           │
│  (email-routing)        │
│                         │
│  ✓ Email Routing        │
│  ✓ Gmail Send           │
│  ✓ Google Sheets Log    │
└─────────────────────────┘
```

## Component Verantwoordelijkheden

### Netlify Function (`chat.js`)

**Doet WEL:**
- ✅ OpenAI API calls
- ✅ Conversation management
- ✅ Intent analysis
- ✅ Guus personality & responses
- ✅ Sanitization & validation
- ✅ Session management
- ✅ Direct response naar gebruiker

**Doet NIET:**
- ❌ Email versturen
- ❌ Google Sheets logging
- ❌ Complex routing logic

### n8n Workflow (`email-routing-workflow.json`)

**Doet WEL:**
- ✅ Email routing op basis van action type
- ✅ Gmail integration (OAuth2)
- ✅ Google Sheets logging (optioneel)
- ✅ Professional email templates
- ✅ Priority & urgency handling

**Doet NIET:**
- ❌ AI/OpenAI calls
- ❌ Conversation memory
- ❌ Intent analysis
- ❌ User responses

## Data Flow

### 1. User Sends Message

```javascript
// Widget → Netlify
POST /chat
{
  "message": "Mijn computer doet het niet",
  "sessionId": "abc123",
  "url": "https://example.com"
}
```

### 2. Netlify Processes & Responds

```javascript
// Netlify verwerkt:
// - OpenAI chat
// - Intent analysis
// - Response generation

// Returns immediately:
{
  "message": "Ik help je graag! Ik stuur dit door naar IT support...",
  "action": {
    "type": "service_request_form",
    "priority": "high",
    "urgent": false
  },
  "sessionId": "abc123"
}
```

### 3. Netlify Triggers n8n (Async)

```javascript
// Netlify → n8n (fire-and-forget)
POST https://n8n.example.com/webhook/chatguus-email
{
  "action": {
    "type": "service_request_form",
    "priority": "high"
  },
  "message": "Guus response...",
  "userMessage": "Mijn computer doet het niet",
  "sessionId": "abc123",
  "url": "https://example.com",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### 4. n8n Routes Email

```javascript
// n8n determines:
// - routingEmail: "support@axs-ict.com"
// - category: "IT Support"
// - emailSubject: "🔧 IT Support aanvraag"

// Sends via Gmail
// Logs to Google Sheets
```

## Action Types die Email Triggeren

Alleen deze action types triggeren n8n:

1. **`service_request_form`**
   - Routes naar: IT / Schoonmaak / Algemeen
   - Based on: Keywords in user message

2. **`event_inquiry_form`**
   - Routes naar: `irene@cupolaxs.nl`
   - Voor: Nieuwe evenementen

3. **`event_modification`**
   - Routes naar: `welcome@cupolaxs.nl`
   - Voor: Wijzigingen bestaande events

4. **`complaint_form`**
   - Routes naar: `welcome@cupolaxs.nl`
   - Voor: Klachten

## Email Routing Logic

### Service Requests

```javascript
// Keywords bepalen routing:

IT Support (support@axs-ict.com):
- it, computer, technisch, wifi, internet
- laptop, printer, systeem

Schoonmaak (ralphcassa@gmail.com):
- schoon, vuil, poetsen, afval

Algemeen (welcome@cupolaxs.nl):
- Alles anders
```

### Event Inquiries

```javascript
Nieuwe Events (irene@cupolaxs.nl):
- action.type === 'event_inquiry_form'

Event Modificaties (welcome@cupolaxs.nl):
- action.type === 'event_modification'
```

## Environment Variables

### Netlify

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional - n8n webhook
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/chatguus-email
```

### n8n

```bash
# Required
GOOGLE_SHEETS_ID=your-sheet-id

# Credentials needed:
# - Gmail OAuth2 (voor email versturen)
# - Google Service Account (voor Sheets logging)
```

## Setup Instructies

### 1. Deploy Netlify Function

```bash
# Netlify automatisch deployed uit /netlify/functions/
netlify deploy --prod
```

### 2. Setup n8n Workflow

1. Import `src/n8n/email-routing-workflow.json` in n8n
2. Configureer Gmail OAuth2 credentials
3. Configureer Google Service Account voor Sheets (optioneel)
4. Kopieer webhook URL
5. Set `GOOGLE_SHEETS_ID` environment variable

### 3. Connect Netlify → n8n

```bash
# Netlify environment variables
netlify env:set N8N_WEBHOOK_URL "https://your-n8n.com/webhook/chatguus-email"
```

### 4. Test de Flow

```bash
# Test chat endpoint
curl -X POST https://your-site.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mijn laptop doet het niet",
    "sessionId": "test123",
    "url": "https://test.com"
  }'

# Check n8n executions voor email
```

## Error Handling

### Netlify Function
- **AI Error**: Fallback naar statische response
- **n8n Webhook Error**: Logged maar blokkeert gebruiker niet
- **Validation Error**: 400 response met details

### n8n Workflow
- **No Data**: Returns empty (skip email)
- **Routing Error**: Logged, skip email
- **Gmail Error**: n8n error handling + retry

## Performance

### Response Times
- **User krijgt response**: < 2 seconden (OpenAI afhankelijk)
- **Email verzending**: 3-5 seconden (async, gebruiker wacht niet)
- **Total overhead**: ~50ms (webhook trigger)

### Fire-and-Forget
- Netlify stuurt webhook zonder te wachten op response
- Gebruiker krijgt direct antwoord van Guus
- Email wordt async afgehandeld
- Geen blocking voor gebruiker

## Monitoring

### Netlify
```bash
netlify logs:function chat --follow
```

### n8n
- Check executions tab
- Monitor email delivery rates
- Review error logs

### Google Sheets
- Manual review van logs
- Filter op priority/urgent
- Check email delivery status

## Troubleshooting

### Geen emails ontvangen

1. **Check Netlify logs**: Wordt webhook getriggerd?
   ```bash
   netlify logs:function chat
   # Zoek naar: "Sent to n8n for email routing"
   ```

2. **Check n8n executions**: Is webhook aangekomen?
   - Ga naar n8n Executions
   - Filter op "Email Webhook"

3. **Check Gmail credentials**: Zijn ze nog valid?
   - n8n → Credentials → Gmail OAuth2
   - Test connection

4. **Check routing logic**: Juiste keywords?
   - Review action.type in Netlify response
   - Check email routing in n8n code node

### Dubbele emails

- Check of oude workflow nog actief is
- Disable oude ChatGuusPT workflow in n8n
- Gebruik alleen `email-routing-workflow.json`

### Verkeerde routing

- Review keywords in n8n router code
- Check user message in logs
- Adjust routing logic indien nodig

## Migratie van Oude Workflow

Als je de oude complexe workflow hebt:

1. **Backup maken**:
   ```bash
   # Export oude workflow
   ```

2. **Deactivate oude workflow**:
   - n8n → Workflows → Old workflow → Inactive

3. **Import nieuwe workflow**:
   - Import `email-routing-workflow.json`
   - Set credentials
   - Set environment variables

4. **Update Netlify**:
   - Deploy nieuwste chat.js
   - Set N8N_WEBHOOK_URL

5. **Test**:
   - Stuur test berichten
   - Verify emails
   - Check logs

## Voordelen Nieuwe Architectuur

✅ **Simpliciteit**: Elke component doet 1 ding goed
✅ **Performance**: Fire-and-forget, geen blocking
✅ **Maintainability**: Duidelijke scheiding
✅ **Debuggability**: Makkelijk te troubleshooten
✅ **Scalability**: Components kunnen apart schalen
✅ **Reliability**: Failure in één component blokkeert andere niet

## Nadelen Oude Architectuur (nu verwijderd)

❌ **Dubbel werk**: AI in zowel Netlify als n8n
❌ **Complexiteit**: Onnodige nodes en connections
❌ **Performance**: Extra AI calls kosten tijd
❌ **Kosten**: Dubbele OpenAI API calls
❌ **Maintenance**: Twee plekken om personality te updaten
