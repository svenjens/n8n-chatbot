/**
 * Netlify Function: Chat Endpoint
 * Standalone serverless chat API voor ChatGuusPT
 */

// Standalone OpenAI integration for Netlify
async function callOpenAI(message, sessionHistory = []) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `Je bent Guus, een vriendelijke en gastvrije assistent van de Koepel.

PERSOONLIJKHEID:
- Altijd vriendelijk, open en gastvrij
- Behulpzaam en proactief in het helpen van bezoekers
- Professioneel maar toegankelijk in communicatie
- Enthousiast over de Koepel en haar mogelijkheden
- Geduldig en begripvol, ook bij complexe vragen

HOOFDTAKEN:
1. SERVICEVRAGEN AFHANDELEN:
   - Verzamel volledige informatie volgens servicerequest formulier
   - Categoriseer verzoeken voor juiste doorverwijzing:
     * IT/Technisch → support@axs-ict.com
     * Schoonmaak → ralphcassa@gmail.com  
     * Algemeen/Overige → welcome@cupolaxs.nl
     * Bestaande/Geplande events → welcome@cupolaxs.nl

2. NIEUWE EVENEMENTEN:
   - Vraag door naar specifieke details:
     * Type evenement en doelgroep
     * Waarom gekozen voor de Koepel
     * Aantal verwachte personen
     * Budget indicatie
     * Gewenste datum/periode
     * Speciale wensen of vereisten
   - Stuur complete informatie door naar irene@cupolaxs.nl

3. FAQ ONDERSTEUNING:
   - Beantwoord vragen met informatie van cupolaxs.nl
   - Verwijs naar relevante pagina's en contactpersonen
   - Bied altijd vervolgstappen aan

COMMUNICATIESTIJL:
- Gebruik je (informeel) in plaats van u (formeel)
- Begin gesprekken warm en uitnodigend
- Stel altijd vervolgvragen om goed te kunnen helpen
- Geef concrete vervolgstappen
- Sluit af met aanbod voor verdere hulp

BELANGRIJKE REGEL - EERLIJKHEID:
- Als je iets niet zeker weet, zeg dat eerlijk: "Ik weet het niet zeker, maar..."
- Verzin NOOIT informatie of regels die je niet kent
- Bij twijfel, verwijs naar de juiste contactpersoon of website
- Beter om te zeggen "Dat moet ik even voor je uitzoeken" dan een verkeerd antwoord geven
- Voorbeelden van eerlijke responses:
  * "Daar heb ik geen specifieke informatie over, maar ik kan je doorverwijzen naar..."
  * "Ik weet niet zeker of dat mogelijk is, laat me je in contact brengen met..."
  * "Voor die specifieke vraag heb ik niet alle details, maar..."

Reageer altijd in het Nederlands en blijf in karakter als de gastvrije Guus.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...sessionHistory,
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Enhanced intent analysis with comprehensive context understanding
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for urgency indicators first (affects all other categories)
  const isUrgent = lowerMessage.includes('dringend') || lowerMessage.includes('spoed') || 
                   lowerMessage.includes('urgent') || lowerMessage.includes('zo snel mogelijk') ||
                   lowerMessage.includes('direct') || lowerMessage.includes('asap');
  
  // Check for complaints vs compliments
  const isComplaint = lowerMessage.includes('klacht') || lowerMessage.includes('ontevreden') || 
                      lowerMessage.includes('slecht') || lowerMessage.includes('problematisch') ||
                      lowerMessage.includes('irritant') || lowerMessage.includes('teleurgesteld');
  
  const isCompliment = lowerMessage.includes('compliment') || lowerMessage.includes('tevreden') || 
                       lowerMessage.includes('goed') || lowerMessage.includes('uitstekend') ||
                       lowerMessage.includes('perfect') || lowerMessage.includes('geweldig');
  
  // Handle complaints with high priority
  if (isComplaint) {
    return { 
      type: 'complaint', 
      confidence: 0.9, 
      requiresForm: true, 
      urgent: isUrgent,
      priority: isUrgent ? 'high' : 'medium'
    };
  }
  
  // Handle compliments
  if (isCompliment) {
    return { 
      type: 'compliment', 
      confidence: 0.8, 
      requiresForm: false,
      priority: 'low'
    };
  }
  
  // Check for pricing inquiries
  if (lowerMessage.includes('prijs') || lowerMessage.includes('kost') || lowerMessage.includes('tarief') ||
      lowerMessage.includes('budget') || lowerMessage.includes('kosten') || lowerMessage.includes('betalen')) {
    return { 
      type: 'pricing_inquiry', 
      confidence: 0.8, 
      requiresForm: false,
      priority: 'medium'
    };
  }
  
  // Check for accessibility needs
  if (lowerMessage.includes('rolstoel') || lowerMessage.includes('toegankelijk') || 
      lowerMessage.includes('mindervalide') || lowerMessage.includes('lift') ||
      lowerMessage.includes('gehandicapt') || lowerMessage.includes('mobility')) {
    return { 
      type: 'accessibility_inquiry', 
      confidence: 0.9, 
      requiresForm: false,
      priority: 'high'
    };
  }
  
  // Check for event cancellation/modification (high priority)
  if (lowerMessage.includes('annuleren') || lowerMessage.includes('annulering') || 
      lowerMessage.includes('afzeggen') || lowerMessage.includes('cancel') ||
      lowerMessage.includes('wijzigen') || lowerMessage.includes('verplaatsen') || 
      lowerMessage.includes('verzetten')) {
    return { 
      type: 'event_modification', 
      confidence: 0.9, 
      requiresForm: false,
      urgent: isUrgent,
      priority: isUrgent ? 'high' : 'medium'
    };
  }
  
  // Check for explicit service requests
  if ((lowerMessage.includes('probleem') || lowerMessage.includes('defect') || lowerMessage.includes('kapot')) && 
      (lowerMessage.includes('hulp') || lowerMessage.includes('repareren') || lowerMessage.includes('oplossen'))) {
    return { 
      type: 'service_request', 
      confidence: 0.9, 
      requiresForm: true,
      urgent: isUrgent,
      priority: isUrgent ? 'high' : 'medium'
    };
  } 
  
  // Check for NEW event planning (only if not cancellation/modification)
  else if ((lowerMessage.includes('evenement') || lowerMessage.includes('event')) && 
           (lowerMessage.includes('organiseren') || lowerMessage.includes('plannen') || 
            lowerMessage.includes('boeken') || lowerMessage.includes('reserveren') ||
            lowerMessage.includes('huren') || lowerMessage.includes('nieuwe'))) {
    return { 
      type: 'event_inquiry', 
      confidence: 0.9, 
      requiresForm: true,
      priority: 'medium'
    };
  }
  
  // Check for existing event questions (not planning)
  else if ((lowerMessage.includes('evenement') || lowerMessage.includes('event')) && 
           (lowerMessage.includes('wanneer') || lowerMessage.includes('tijd') || 
            lowerMessage.includes('locatie') || lowerMessage.includes('info') ||
            lowerMessage.includes('details') || lowerMessage.includes('programma') ||
            lowerMessage.includes('mijn') || lowerMessage.includes('bestaande'))) {
    return { 
      type: 'event_info', 
      confidence: 0.8, 
      requiresForm: false,
      priority: 'low'
    };
  }
  
  // Check for greetings and general conversation
  else if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('hey') ||
           lowerMessage.includes('dank') || lowerMessage.includes('bedankt')) {
    return { 
      type: 'general', 
      confidence: 0.8, 
      requiresForm: false,
      priority: 'low'
    };
  }
  
  // Check for IT/technical issues
  else if (lowerMessage.includes('computer') || lowerMessage.includes('laptop') || lowerMessage.includes('wifi') ||
           lowerMessage.includes('internet') || lowerMessage.includes('systeem')) {
    return { 
      type: 'service_request', 
      confidence: 0.7, 
      requiresForm: false,
      urgent: isUrgent,
      priority: isUrgent ? 'high' : 'medium'
    };
  }
  
  // Default to general for ambiguous messages
  else {
    return { 
      type: 'general', 
      confidence: 0.5, 
      requiresForm: false,
      priority: 'low'
    };
  }
}

// Sanitize message content
function sanitizeMessage(message, options = {}) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  let sanitized = message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized.trim();
}

// Main handler
exports.handler = async (event, context) => {
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

  try {
    // Parse request body
    const requestData = JSON.parse(event.body || '{}');
    const { message, sessionId, userAgent, url } = requestData;
    
    // Extract tenant information from headers
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-ID'] || 'default';
    
    // Log warning if no explicit tenant provided
    if (tenantId === 'default') {
      console.warn(`[${sessionId}] No tenant header provided, using 'default'. Consider adding X-Tenant-ID header.`);
    }

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid message', 
          details: ['Message is required and must be a non-empty string'] 
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
    const sanitizedMessage = sanitizeMessage(message, {
      maxLength: 1000
    });

    // Log interaction
    console.log(`[${new Date().toISOString()}] Chat - Session: ${sessionId}, Message: ${sanitizedMessage}`);

    // Analyze message intent
    const intent = analyzeIntent(sanitizedMessage);
    
    let response;
    let action = null;

    // Prepare session history for context
    const sessionHistory = requestData.history || [];
    
    // Limit history to last 10 messages for performance (5 user + 5 assistant)
    const limitedHistory = sessionHistory.slice(-10);
    
    // Log context usage for debugging
    console.log(`[${sessionId}] Context: ${limitedHistory.length} messages in history`);
    
    // Get AI response with context
    try {
      response = await callOpenAI(sanitizedMessage, limitedHistory);
    } catch (aiError) {
      console.error('AI Error:', aiError);
      response = 'Hallo! Ik ben Guus van de Koepel. Helaas kan ik je vraag nu niet direct beantwoorden, maar je kunt altijd contact opnemen via welcome@cupolaxs.nl voor persoonlijke hulp.';
    }

    // Handle special actions based on intent
    if (intent.type === 'complaint' && intent.confidence > 0.8) {
      action = {
        type: 'complaint_form',
        category: 'complaint',
        priority: intent.priority,
        urgent: intent.urgent
      };
    } else if (intent.type === 'compliment' && intent.confidence > 0.7) {
      action = {
        type: 'compliment_acknowledgment',
        category: 'positive_feedback'
      };
    } else if (intent.type === 'pricing_inquiry' && intent.confidence > 0.7) {
      action = {
        type: 'pricing_info',
        category: 'information'
      };
    } else if (intent.type === 'accessibility_inquiry' && intent.confidence > 0.8) {
      action = {
        type: 'accessibility_info',
        category: 'accessibility',
        priority: 'high'
      };
    } else if (intent.type === 'service_request' && intent.confidence > 0.8 && intent.requiresForm) {
      action = {
        type: 'service_request_form',
        category: 'general',
        priority: intent.priority,
        urgent: intent.urgent
      };
    } else if (intent.type === 'event_inquiry' && intent.confidence > 0.8 && intent.requiresForm) {
      action = {
        type: 'event_inquiry_form',
        priority: intent.priority
      };
    } else if (intent.type === 'event_modification' && intent.confidence > 0.8) {
      action = {
        type: 'event_modification',
        category: 'existing_event',
        priority: intent.priority,
        urgent: intent.urgent
      };
    } else if (intent.type === 'event_info' && intent.confidence > 0.7) {
      action = {
        type: 'event_info_request',
        category: 'information',
        priority: intent.priority
      };
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
        message: response,
        action,
        sessionId,
        tenantId,
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