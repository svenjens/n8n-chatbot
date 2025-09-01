/**
 * Guus Personality Module
 * Implementeert de vriendelijke en gastvrije persoonlijkheid van Guus
 */

import OpenAI from 'openai';

export class GuusPersonality {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.personality = {
      name: 'Guus',
      role: 'Gastvrije assistent van de Koepel',
      traits: [
        'vriendelijk en open',
        'gastvrij en behulpzaam', 
        'professioneel maar toegankelijk',
        'enthousiast over de Koepel',
        'geduldig en begripvol'
      ],
      language: 'Nederlands',
      tone: 'informeel maar respectvol'
    };

    this.systemPrompt = this.buildSystemPrompt();
  }

  buildSystemPrompt() {
    return `Je bent Guus, een vriendelijke en gastvrije assistent van de Koepel.

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

VOORBEELDEN VAN GUUS RESPONSES:
- "Hallo! Leuk dat je contact opneemt. Ik help je graag verder!"
- "Dat klinkt als een interessant evenement! Vertel me meer over..."
- "Ik snap je vraag goed. Laat me je doorverbinden met het juiste team."
- "Perfect! Ik heb alle informatie. Ik stuur dit direct door naar..."

Reageer altijd in het Nederlands en blijf in karakter als de gastvrije Guus.`;
  }

  async analyzeIntent(message) {
    try {
      const intentPrompt = `Analyseer de volgende bericht en bepaal de intent:

Bericht: "${message}"

Categorieën:
- service_request: Verzoek om hulp, probleem melden, iets regelen
- event_inquiry: Vragen over evenementen organiseren, ruimte huren
- faq: Algemene vragen over faciliteiten, locatie, openingstijden
- general: Begroeting, algemene conversatie

Geef terug als JSON:
{
  "type": "category",
  "confidence": 0.0-1.0,
  "category": "subcategory if applicable",
  "hasCompleteInfo": boolean,
  "keywords": ["relevant", "keywords"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: intentPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Intent Analysis Error:', error);
      
      // Fallback intent detection
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('service') || lowerMessage.includes('hulp') || lowerMessage.includes('probleem')) {
        return { type: 'service_request', confidence: 0.7, hasCompleteInfo: false };
      } else if (lowerMessage.includes('event') || lowerMessage.includes('organiseren') || lowerMessage.includes('ruimte')) {
        return { type: 'event_inquiry', confidence: 0.7, hasCompleteInfo: false };
      } else {
        return { type: 'general', confidence: 0.5, hasCompleteInfo: false };
      }
    }
  }

  async generateResponse(message, intent, context = {}) {
    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: message }
      ];

      // Add context if available
      if (context.conversationHistory) {
        messages.splice(1, 0, ...context.conversationHistory);
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 300,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Response Error:', error);
      return this.getFallbackResponse();
    }
  }

  async handleServiceRequest(message, intent) {
    const servicePrompts = {
      it: "Ik zie dat je een IT-gerelateerde vraag hebt. Ik help je graag! Kun je me vertellen wat voor technisch probleem je hebt? Denk aan details zoals welke apparaten, software of systemen het betreft.",
      
      cleaning: "Ik help je graag met je schoonmaakvraag! Kun je me vertellen wat er geregeld moet worden? Gaat het om dagelijkse schoonmaak, een eenmalige klus, of iets speciaals?",
      
      general: "Ik help je graag met je serviceverzoek! Om je goed te kunnen helpen, heb ik wat meer informatie nodig. Kun je me vertellen:\n\n• Wat is de aard van je verzoek?\n• Wanneer moet dit uitgevoerd worden?\n• Zijn er specifieke vereisten?\n\nMet deze informatie kan ik je verzoek direct naar het juiste team doorsturen!"
    };

    const category = intent.category || 'general';
    const baseResponse = servicePrompts[category] || servicePrompts.general;

    // Generate personalized response
    return await this.generateResponse(message, intent, {
      contextPrompt: `De gebruiker heeft een serviceverzoek. Reageer als Guus met: ${baseResponse}`
    });
  }

  async handleEventInquiry(message, intent) {
    const eventPrompt = `Wat leuk dat je een evenement wilt organiseren in de Koepel! 🎉

Ik help je graag met het plannen. Om je de beste service te kunnen bieden, wil ik graag wat meer weten over je plannen:

🎯 **Type evenement:** Wat voor soort evenement ga je organiseren?
🏢 **Waarom de Koepel:** Wat spreekt je aan in onze locatie?
👥 **Aantal gasten:** Hoeveel personen verwacht je ongeveer?
💰 **Budget:** Heb je een budget indicatie?
📅 **Timing:** Wanneer wil je het evenement houden?

Vertel me meer over je plannen, dan kan ik je direct in contact brengen met ons events team!`;

    return await this.generateResponse(message, intent, {
      contextPrompt: `De gebruiker vraagt naar evenementen. Reageer als Guus met: ${eventPrompt}`
    });
  }

  async handleFAQ(message, intent) {
    // FAQ responses based on cupolaxs.nl content
    const faqDatabase = {
      openingstijden: "De Koepel is doordeweeks geopend van 8:00 tot 18:00. Voor evenementen kunnen we ook buiten deze tijden open, dat bespreken we graag persoonlijk!",
      
      locatie: "De Koepel is gevestigd op een prachtige locatie [adres van cupolaxs.nl]. We hebben uitstekende bereikbaarheid met zowel openbaar vervoer als eigen parkeervoorzieningen.",
      
      faciliteiten: "We hebben diverse ruimtes beschikbaar voor vergaderingen, evenementen en werkplekken. Denk aan moderne AV-apparatuur, catering mogelijkheden en flexibele inrichtingen.",
      
      contact: "Voor algemene vragen kun je terecht bij welcome@cupolaxs.nl. Voor specifieke zaken hebben we verschillende teams die ik je graag kan doorverbinden.",
      
      prijzen: "Voor prijsinformatie en offertes neem ik graag persoonlijk contact met je op. Elke situatie is uniek en we maken graag een passend voorstel!"
    };

    // Try to match FAQ topic
    const lowerMessage = message.toLowerCase();
    let faqResponse = null;

    for (const [topic, answer] of Object.entries(faqDatabase)) {
      if (lowerMessage.includes(topic) || lowerMessage.includes(topic.slice(0, -2))) {
        faqResponse = answer;
        break;
      }
    }

    if (faqResponse) {
      return await this.generateResponse(message, intent, {
        contextPrompt: `Beantwoord deze FAQ vraag als Guus: ${faqResponse}`
      });
    }

    // Generate general FAQ response
    return await this.generateResponse(message, intent);
  }

  async handleGeneral(message, intent) {
    const generalPrompts = [
      "Hallo! Leuk dat je contact opneemt met de Koepel. Ik ben Guus en help je graag verder. Waar kan ik je mee helpen?",
      
      "Welkom bij de Koepel! Ik sta klaar om je te helpen met al je vragen over onze faciliteiten, services of evenementen. Wat zou je willen weten?",
      
      "Hoi! Fijn dat je er bent. Als Guus van de Koepel help ik je graag met informatie, serviceverzoeken of het plannen van evenementen. Waar denk je aan?"
    ];

    // Use OpenAI for more natural responses
    return await this.generateResponse(message, intent);
  }

  getFallbackResponse() {
    const fallbackMessages = [
      "Sorry, ik had even een technisch probleempje! Kun je je vraag opnieuw stellen? Of neem direct contact op via welcome@cupolaxs.nl",
      
      "Oeps, er ging iets mis aan mijn kant. Probeer het nog eens, of bel ons direct voor snelle hulp!",
      
      "Excuses voor de storing! Ik ben er weer. Waar kan ik je mee helpen? Anders kun je altijd terecht bij welcome@cupolaxs.nl"
    ];

    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }

  // Utility method to get conversation starters
  getConversationStarters() {
    return [
      "Waar kan ik je mee helpen?",
      "Heb je vragen over onze faciliteiten?", 
      "Wil je een evenement organiseren?",
      "Kan ik je ergens mee van dienst zijn?"
    ];
  }

  // Get quick reply suggestions based on intent
  getQuickReplies(intent) {
    const quickReplies = {
      service_request: [
        "IT probleem",
        "Schoonmaak verzoek", 
        "Algemene vraag",
        "Bestaand evenement"
      ],
      event_inquiry: [
        "Bedrijfsborrel",
        "Vergadering", 
        "Workshop",
        "Netwerkbijeenkomst",
        "Anders"
      ],
      faq: [
        "Openingstijden",
        "Locatie & bereikbaarheid",
        "Faciliteiten",
        "Prijzen",
        "Contact"
      ],
      general: [
        "Serviceverzoek",
        "Evenement plannen",
        "Informatie",
        "Contact opnemen"
      ]
    };

    return quickReplies[intent.type] || quickReplies.general;
  }
}
