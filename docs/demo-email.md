# Email Draft voor Menno en Mike

**Onderwerp:** ChatGuusPT Demo - AI Chatbot voor De Koepel

---

Hoi Menno en Mike,

We hebben een prototype ontwikkeld van **ChatGuusPT** - een AI-powered chatbot specifiek voor De Koepel zakelijke gebruikers.

## 🤖 Wat hebben we gebouwd?

**ChatGuusPT** is een vriendelijke, intelligente chatbot die:
- **Servicevragen** automatisch routeert naar de juiste teams (IT, schoonmaak, algemeen)
- **Event uitvragen** doet en doorsturt naar Irene
- **FAQ vragen** beantwoordt op basis van cupolaxs.nl content
- **Multi-tenant** is (makkelijk aan te passen voor andere organisaties)
- **Real-time analytics** biedt voor kwaliteitsmonitoring

## 🔗 Waar kunnen jullie het bekijken?

**Live Demo:** https://chatguuspt.netlify.app
- Klik op "💬 Open Chat Widget" om te testen
- Probeer vragen zoals: "Ik heb een IT probleem" of "Ik wil een event organiseren"

**Analytics Dashboard:** https://chatguuspt.netlify.app/admin/analytics-dashboard.html
- Toont AI performance, user satisfaction en missing answers
- Real-time data uit MongoDB

## ⚙️ Technische Highlights

- **N8N Workflow** integratie voor business logic
- **OpenAI GPT** voor intelligente responses
- **White-label ready** voor andere klanten
- **Netlify deployment** (serverless, schaalbaar)
- **MongoDB Atlas** voor data persistentie
- **Multi-language support** (NL/EN)

## 📱 Implementatie

Super makkelijk te implementeren op elke website:
```html
<script src="https://chatguuspt.netlify.app/.netlify/functions/widget"></script>
<script>ChatGuus.init({ theme: 'koepel' });</script>
```

---

**Feedback welkom!** Laat weten wat jullie ervan vinden en of er specifieke features zijn die jullie zouden willen zien.

Groeten,  
[Je naam]

P.S. Technische documentatie en code staat op GitHub voor transparantie.
