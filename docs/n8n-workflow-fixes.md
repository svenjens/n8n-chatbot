# n8n Workflow Fixes - Edge Cases & Error Handling

## Probleem: `propertyValues[itemName] is not iterable`

### Root Cause
De fout trad op doordat:
1. **Parallel execution naar alle Gmail nodes**: De Email Router stuurde data naar alle 3 Gmail nodes tegelijk in plaats van alleen naar de relevante node
2. **Missing null/undefined checks**: Nodes probeerden `.toLowerCase()` aan te roepen op undefined values
3. **Geen fallback handling**: Geen error handling voor ontbrekende data

## Geïmplementeerde Fixes

### 1. Email Router Node - Verbeterde Error Handling

**Toegevoegde edge cases:**
- ✅ Input validation (controleert of data bestaat)
- ✅ Null-safe message access met fallback
- ✅ Empty message handling
- ✅ Try-catch wrapper voor alle routing logic
- ✅ Safe defaults voor alle velden (sessionId, url, category)
- ✅ Timestamp toevoeging voor tracking
- ✅ Error object in output bij exceptions

**Extra keywords toegevoegd:**
- IT: `printer`, `laptop`, `monitor`
- Schoonmaak: `afval`, `vuilnis`, `smerig`
- Events: `geboekt`, `reservering`

**Code structuur:**
```javascript
try {
  // Input validation
  const inputData = $input.first()?.json;
  if (!inputData) {
    throw new Error('No input data received');
  }

  // Safe message access
  const message = (inputData.message || '').toLowerCase().trim();
  
  // Empty message handling
  if (!message) {
    return [{ json: { ...fallback data... } }];
  }
  
  // Routing logic...
  
  // Return with safe defaults
  return [{
    json: {
      ...inputData,
      routingEmail: routingEmail,
      category: category,
      message: inputData.message || '[Geen bericht]',
      sessionId: inputData.sessionId || 'unknown-' + Date.now(),
      url: inputData.url || 'Onbekend',
      timestamp: new Date().toISOString()
    }
  }];
  
} catch (error) {
  // Error fallback met logging
  return [{ json: { ...error fallback... } }];
}
```

### 2. Switch Nodes voor Conditional Routing

**Nieuwe nodes toegevoegd:**
- `Route IT Support` - Checkt of category === "IT Support"
- `Route Schoonmaak` - Checkt of category === "Schoonmaak"  
- `Route Algemeen` - Checkt of category contains "Algemeen" (met fallback)

**Waarom Switch nodes?**
- Voorkomt parallel execution naar alle Gmail nodes
- Alleen de matching node wordt aangeroepen
- Betere error handling met fallback output
- Duidelijkere workflow visualisatie

### 3. IF Nodes - Null-Safe Conditionals

**Voor:**
```javascript
"leftValue": "={{ $json.message.toLowerCase() }}"
```

**Na:**
```javascript
"leftValue": "={{ ($json.message || '').toLowerCase() }}"
```

**Verbeterde nodes:**
- ✅ Check Service Request
- ✅ Check Event Inquiry
- ✅ Determine Service Category

### 4. Google Sheets Nodes - Safe Field Values

**Toegevoegde null checks:**
```javascript
"fieldValue": "={{ $json.sessionId || 'unknown' }}"
"fieldValue": "={{ $json.message || '[Geen bericht]' }}"
"fieldValue": "={{ $json.category || 'Service Request' }}"
"fieldValue": "={{ $json.url || 'Onbekend' }}"
```

**Extra veld toegevoegd:**
- `URL` field voor tracking van bron

### 5. Gmail Nodes - Null-Safe Templates

**Alle Gmail nodes hebben nu:**
- Safe `sendTo` met fallback naar `welcome@cupolaxs.nl`
- Null-safe template variabelen
- Fallback values voor alle velden

## Edge Cases Gedekt

### ✅ Input Validation
- **Geen input data**: Fallback naar default routing
- **Leeg bericht**: Fallback met "[Geen bericht]"
- **Undefined sessionId**: Auto-generate met timestamp
- **Undefined url**: Gebruik "Onbekend"

### ✅ Message Processing
- **Null message**: Safe access met `|| ''`
- **Undefined message**: Fallback naar empty string
- **Case sensitivity**: Altijd `.toLowerCase()` met null check
- **Whitespace**: `.trim()` na null check

### ✅ Routing Logic
- **Geen match**: Default naar `welcome@cupolaxs.nl`
- **Multiple matches**: Eerste match wint (if-else structuur)
- **Invalid category**: Switch nodes hebben fallback output

### ✅ Email Delivery
- **Missing routingEmail**: Fallback naar default
- **Missing template vars**: Alle variabelen hebben fallback
- **Empty values**: Duidelijke placeholders zoals "[Geen bericht]"

### ✅ Error Handling
- **JavaScript errors**: Try-catch in Email Router
- **Logging**: console.warn/error voor debugging
- **Error output**: Error message in data object
- **Graceful degradation**: Workflow blijft functioneel bij fouten

## Testing Checklist

### Test Cases
- [ ] Empty message (`message: ''`)
- [ ] Null message (`message: null`)
- [ ] Undefined message (geen message field)
- [ ] Missing sessionId
- [ ] Missing url
- [ ] IT keyword match
- [ ] Schoonmaak keyword match
- [ ] Event keyword match
- [ ] Geen keyword match (default routing)
- [ ] Special characters in message
- [ ] Very long message (>1000 chars)
- [ ] Multiple spaces in message
- [ ] Mixed case keywords

### Integration Tests
- [ ] Service Request → IT Support email
- [ ] Service Request → Schoonmaak email
- [ ] Service Request → Algemeen email
- [ ] Event Inquiry → Events team email
- [ ] Google Sheets logging (beide sheets)
- [ ] Email template rendering
- [ ] Response naar webhook

## Monitoring & Debugging

### Log Points
1. **Email Router**: Console logs voor empty messages en errors
2. **Switch Nodes**: Output indices tonen welke route gekozen wordt
3. **Gmail Nodes**: n8n execution log toont email delivery status

### Troubleshooting

**Symptoom**: Geen email verzonden
- Check: Switch node output (welke route?)
- Check: Category value in data
- Check: Gmail OAuth credentials

**Symptoom**: Wrong email recipient
- Check: Email Router logic en keywords
- Check: routingEmail value in data
- Check: Switch node conditionals

**Symptoom**: Template rendering errors
- Check: Null checks in template variabelen
- Check: Data structure from previous nodes
- Check: n8n expression syntax

## Performance Optimalisaties

### Verbeteringen
- ✅ Reduced parallel executions (was 3, nu 1 per execution)
- ✅ Early returns in Email Router bij empty data
- ✅ Efficient keyword checking met if-else (niet alle conditions)

### Potentiële Verder Optimalisaties
- Caching van frequent gebruikt categorization results
- Bulk email sending voor hoge volumes
- Async logging naar Sheets (fire-and-forget)

## Security Considerations

### Implemented
- ✅ Input sanitization (trim, toLowerCase)
- ✅ No code injection via templates (escaped vars)
- ✅ Default email fallback (geen ongeautoriseerde recipients)

### Recommendations
- Rate limiting op webhook endpoint
- Email content sanitization (anti-XSS)
- PII data masking in logs
- Encryption voor gevoelige session data

## Deployment Notes

### Pre-deployment
1. Backup huidige workflow export
2. Test in development environment
3. Verify all credentials (OAuth, Service Account)
4. Update environment variables (GOOGLE_SHEETS_ID)

### Post-deployment
1. Monitor eerste 10 executions
2. Verify email delivery rates
3. Check Google Sheets logging
4. Review error logs

### Rollback Plan
Als er issues zijn:
1. Re-import oude workflow backup
2. Check n8n version compatibility
3. Verify node versions (typeVersion)
4. Restore credentials indien nodig

## Changelog

### Version 2.0 (Current)
- ✅ Fixed: `propertyValues[itemName] is not iterable` error
- ✅ Added: Comprehensive null/undefined checks
- ✅ Added: Switch nodes for conditional routing
- ✅ Added: Error handling in Email Router
- ✅ Added: Safe defaults for all fields
- ✅ Added: Extended keyword coverage
- ✅ Added: Timestamp tracking
- ✅ Improved: IF node conditionals (v2)
- ✅ Updated: Google Sheets with URL field

### Version 1.0 (Previous)
- Basic Gmail integration
- Simple routing logic
- Google Sheets logging
- Event inquiry handling

