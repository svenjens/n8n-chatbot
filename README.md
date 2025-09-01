# ChatGuusPT 🤖

Een vriendelijke en gastvrije chatbot voor de Koepel zakelijke gebruikers, geïmplementeerd met N8N en OpenAI.

## ✨ Features

- 🎭 **Guus Personality**: Vriendelijk, gastvrij en behulpzaam zoals de echte Guus
- 🔄 **N8N Integration**: Seamless workflow automation
- 🤖 **OpenAI Powered**: Intelligente responses via GPT models
- 📧 **Smart Routing**: Automatisch doorsturen van verzoeken naar juiste teams
- 📊 **Service Requests**: Gestructureerde afhandeling van servicevragen
- 🎉 **Event Management**: Uitgebreide event uitvraag flows
- 💬 **Embeddable Widget**: Eenvoudig te implementeren op elke website
- 📱 **Mobile Friendly**: Responsive design voor alle apparaten

## 🚀 Quick Start

### 1. Installatie

```bash
npm install
```

### 2. Configuratie

Kopieer `.env.example` naar `.env` en vul je credentials in:

```bash
cp .env.example .env
```

### 3. Development Server

```bash
npm run dev
```

### 4. Widget Implementatie

Voeg deze code toe aan je website:

```html
<div id="chatguus-widget"></div>
<script src="https://jouw-domain.com/widget.js"></script>
<script>
  ChatGuus.init({
    target: '#chatguus-widget',
    theme: 'koepel',
    welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?'
  });
</script>
```

## 📁 Project Structuur

```
chatbot/
├── src/
│   ├── widget/          # Embeddable chat widget
│   ├── n8n/            # N8N workflow definitions
│   ├── server/         # Backend API server
│   └── config/         # Configuration files
├── docs/               # Documentatie
└── examples/           # Implementatie voorbeelden
```

## 🎯 Business Logic

### Servicevragen Routing

- **Algemeen**: welcome@cupolaxs.nl
- **IT**: support@axs-ict.com  
- **Schoonmaak**: ralphcassa@gmail.com
- **Events**: irene@cupolaxs.nl

### Event Uitvraag Flow

1. Type evenement identificeren
2. Motivatie voor Koepel uitvragen
3. Randvoorwaarden verzamelen (aantal personen, budget)
4. Doorsturen naar events team

### FAQ Systeem

Automatisch beantwoorden van vragen gebaseerd op cupolaxs.nl content.

## 🔧 N8N Workflow

De chatbot gebruikt een gestructureerde N8N workflow met:

- **Webhook Node**: Ontvangt chat berichten
- **AI Agent Node**: Verwerkt berichten met Guus personality
- **OpenAI Node**: Genereert intelligente responses
- **Memory Node**: Behoudt gesprekscontext
- **Conditional Logic**: Routeert servicevragen
- **Email Nodes**: Stuurt verzoeken door
- **Google Sheets**: Logt alle interacties

## 📱 Widget Features

- Responsive design
- Koepel branding
- Typing indicators
- File upload support
- Emoji reactions
- Conversation export

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📞 Support

Voor vragen over ChatGuusPT, neem contact op met het development team.
