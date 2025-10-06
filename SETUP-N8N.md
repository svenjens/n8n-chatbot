# n8n Email Routing Setup Guide

## ✅ Je hebt al gedaan:
1. ✅ n8n workflow aangemaakt
2. ✅ Webhook URL gekopieerd: `https://sventest.app.n8n.cloud/webhook/chatguus-email`

## 🔧 Volgende stappen:

### 1. Netlify Environment Variable Instellen

```bash
# Via Netlify CLI (als je die hebt)
netlify env:set N8N_WEBHOOK_URL "https://sventest.app.n8n.cloud/webhook/chatguus-email"

# OF via Netlify Dashboard:
# 1. Ga naar https://app.netlify.com
# 2. Selecteer je site
# 3. Ga naar Site configuration > Environment variables
# 4. Klik op "Add a variable"
# 5. Key: N8N_WEBHOOK_URL
# 6. Value: https://sventest.app.n8n.cloud/webhook/chatguus-email
# 7. Klik "Create variable"
```

### 2. n8n Gmail Credentials Configureren

In n8n:

1. **Ga naar Credentials** (links in menu)
2. **Klik "Add Credential"**
3. **Selecteer "Gmail OAuth2"**
4. **Volg de OAuth2 setup:**
   - Je hebt een Google Cloud Project nodig
   - Activeer Gmail API
   - Maak OAuth2 credentials
   - Kopieer Client ID en Client Secret naar n8n

**Quick guide:**
```
Google Cloud Console → APIs & Services → Credentials
→ Create Credentials → OAuth client ID
→ Web application
→ Authorized redirect URIs: https://sventest.app.n8n.cloud/rest/oauth2-credential/callback
→ Kopieer Client ID en Secret naar n8n
```

### 3. n8n Google Sheets Credentials (Optioneel)

Als je logging naar Google Sheets wilt:

1. **Service Account maken in Google Cloud**
2. **Download JSON key**
3. **In n8n:**
   - Add Credential → Google Service Account
   - Upload JSON key file
4. **Share Google Sheet met service account email**

### 4. Environment Variable in n8n

In n8n workflow:

1. **Ga naar Settings** (rechts boven in workflow editor)
2. **Klik "Variables"** of **"Environment Variables"**
3. **Voeg toe:**
   ```
   GOOGLE_SHEETS_ID: [jouw-sheet-id]
   ```

Of gebruik de n8n environment variables sectie in je instance settings.

### 5. Test de Flow

#### Test 1: Netlify Chat Function
```bash
curl -X POST https://jouw-site.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mijn computer doet het niet, kun je IT bellen?",
    "sessionId": "test-123",
    "url": "https://test.com"
  }'
```

Verwachte response:
```json
{
  "message": "Ik help je graag! Ik stuur dit direct door naar ons IT team...",
  "action": {
    "type": "service_request_form",
    "priority": "high"
  }
}
```

#### Test 2: Check Netlify Logs
```bash
netlify logs:function chat --follow
```

Zoek naar: `Sent to n8n for email routing: service_request_form`

#### Test 3: Check n8n Executions

1. Ga naar n8n Dashboard
2. Klik op "Executions" (links)
3. Je zou een nieuwe execution moeten zien
4. Check of email is verzonden

#### Test 4: Check Email

Kijk in je inbox (of de inbox van support@axs-ict.com) voor de test email.

### 6. Activate Workflow in n8n

**BELANGRIJK:**
1. Ga naar je workflow in n8n
2. Zorg dat de switch rechts boven op **"Active"** staat
3. Als hij op "Inactive" staat, klik hem aan!

## 🎨 Email Templates Aanpassen

De email templates zitten in de **"Send via Gmail"** node in n8n.

Om aan te passen:
1. Open de workflow in n8n
2. Klik op de "Send via Gmail" node
3. Scroll naar "Message" (HTML template)
4. Pas de HTML/CSS aan
5. Klik "Save" (rechts boven)

## 📊 Monitoring

### Check of het werkt:

**Netlify logs:**
```bash
netlify logs:function chat
```

Zoek naar:
- ✅ `Sent to n8n for email routing`
- ❌ `n8n webhook error` (als er een probleem is)

**n8n Executions:**
- Ga naar Executions tab
- Filter op "Email Webhook"
- Check status (success/failed)
- Bekijk input/output data

**Google Sheets (if enabled):**
- Open je sheet
- Check "ChatGuusPT Logs" tab
- Nieuwe rijen verschijnen na elke email

## 🐛 Troubleshooting

### "No emails received"

1. **Check n8n workflow is Active**
   - Workflow moet "Active" zijn (niet "Inactive")

2. **Check Netlify logs**
   ```bash
   netlify logs:function chat
   ```
   - Zie je "Sent to n8n for email routing"?
   - Zo nee: action wordt niet getriggerd
   - Zo ja: probleem is in n8n

3. **Check n8n executions**
   - Zie je de webhook execution?
   - Zo nee: webhook URL klopt niet
   - Zo ja: check Gmail node errors

4. **Check Gmail credentials**
   - n8n → Credentials → Gmail OAuth2
   - Klik "Test" of "Reconnect"
   - Mogelijk expired token

### "Wrong email recipient"

Check routing logic in "Determine Email Route" node:
- IT keywords: it, computer, technisch, wifi, laptop, printer
- Schoonmaak keywords: schoon, vuil, poetsen, afval
- Default: welcome@cupolaxs.nl

### "Workflow not triggering"

1. **Check action types in chat.js:**
   - service_request_form
   - event_inquiry_form
   - event_modification
   - complaint_form

2. **Check confidence scores:**
   - Must be > 0.8 for most actions
   - Adjust in chat.js if needed

## 🔒 Security

**Webhook Security:**
- Optioneel: voeg authentication toe aan webhook
- In n8n: Settings → Authentication → Header Auth
- Update chat.js om header mee te sturen

**Gmail Permissions:**
- OAuth2 scope: `https://www.googleapis.com/auth/gmail.send`
- Alleen send permission, niet read

**Google Sheets:**
- Service Account heeft alleen write access
- Sheet is niet publiek

## 📈 Performance

- **User response time:** < 2 sec (geen impact van email)
- **Email delivery:** 3-5 sec (async)
- **Fire-and-forget:** Gebruiker wacht niet op email

## 🎯 Testing Scenarios

Test deze scenario's:

1. **IT Support:**
   ```
   "Mijn laptop doet het niet"
   → Email naar: support@axs-ict.com
   ```

2. **Schoonmaak:**
   ```
   "De vergaderzaal moet schoongemaakt worden"
   → Email naar: ralphcassa@gmail.com
   ```

3. **Event Inquiry:**
   ```
   "Ik wil een bedrijfsborrel organiseren"
   → Email naar: irene@cupolaxs.nl
   ```

4. **Algemeen:**
   ```
   "Ik heb een vraag over jullie diensten"
   → Email naar: welcome@cupolaxs.nl
   ```

## ✨ Je bent klaar!

Na bovenstaande stappen:
- ✅ Netlify stuurt chat berichten naar gebruikers
- ✅ Bij belangrijke acties wordt n8n getriggerd
- ✅ n8n stuurt email naar juiste persoon
- ✅ Alles wordt gelogd in Google Sheets

Succes! 🚀


