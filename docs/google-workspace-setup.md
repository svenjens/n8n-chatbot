# Google Workspace Integratie voor ChatGuusPT n8n Workflow

## Overzicht

Deze documentatie beschrijft hoe je Google Workspace (Gmail) kunt configureren voor de ChatGuusPT n8n workflow om automatisch emails te versturen voor verschillende scenario's.

## Vereisten

- Google Workspace account
- n8n installatie met toegang tot Google nodes
- Admin rechten voor Google Workspace configuratie

## Google Workspace Configuratie

### 1. Google Cloud Project Setup

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan of selecteer een bestaand project
3. Activeer de volgende APIs:
   - Gmail API
   - Google Sheets API (als je Google Sheets logging gebruikt)

### 2. OAuth2 Credentials Maken

1. Ga naar **APIs & Services > Credentials**
2. Klik op **Create Credentials > OAuth client ID**
3. Selecteer **Web application**
4. Voeg de volgende redirect URIs toe:
   - `https://jouw-n8n-instance.com/rest/oauth2-credential/callback`
   - `http://localhost:5678/rest/oauth2-credential/callback` (voor lokale ontwikkeling)

### 3. Service Account (Optioneel)

Voor server-to-server communicatie kun je ook een service account gebruiken:

1. Ga naar **APIs & Services > Credentials**
2. Klik op **Create Credentials > Service account**
3. Download de JSON key file
4. Configureer domain-wide delegation als nodig

## n8n Configuratie

### 1. Gmail Credentials Toevoegen

1. Ga naar n8n **Settings > Credentials**
2. Klik op **New > Gmail OAuth2 API**
3. Vul in:
   - **Client ID**: Van je Google Cloud project
   - **Client Secret**: Van je Google Cloud project
   - **Scope**: `https://www.googleapis.com/auth/gmail.send`

### 2. Google Sheets Credentials (indien gebruikt)

1. Ga naar n8n **Settings > Credentials**
2. Klik op **New > Google Sheets API**
3. Kies tussen OAuth2 of Service Account authenticatie

## Workflow Email Scenario's

### Service Requests

De workflow routeert automatisch service requests naar de juiste teams:

- **IT Support**: `support@axs-ict.com`
  - Keywords: it, technisch, computer, netwerk, software, systeem, inloggen, wifi, internet
  - Template: Technische support aanvraag met urgentie indicatie

- **Schoonmaak**: `ralphcassa@gmail.com`
  - Keywords: schoon, vuil, opruimen, poetsen, stofzuigen
  - Template: Schoonmaak opdracht met locatie details

- **Algemeen**: `welcome@cupolaxs.nl`
  - Default voor alle andere service requests
  - Template: Algemene klantvraag

### Event Inquiries

- **Nieuwe Events**: `irene@cupolaxs.nl`
  - Keywords: event, evenement, organiseren, feest, bijeenkomst
  - Template: Uitgebreide event aanvraag met CTA

## Email Templates

### Template Features

- **Responsive HTML design**: Werkt op alle email clients
- **Branded styling**: Consistent met Koepel huisstijl
- **Automatische data**: Tijdstempel, sessie ID, categorie
- **Call-to-Action buttons**: Voor snelle follow-up
- **Mobile-friendly**: Geoptimaliseerd voor mobiele devices

### Template Variabelen

Alle templates gebruiken de volgende variabelen:
- `{{ $json.message }}`: Het oorspronkelijke bericht
- `{{ $json.sessionId }}`: Unieke sessie identifier
- `{{ $now }}`: Huidige tijdstempel
- `{{ $json.url }}`: Website waar het verzoek vandaan komt
- `{{ $json.category }}`: Automatisch bepaalde categorie

## Workflow Logica

### Service Request Flow

1. **Webhook** ontvangt chatbericht
2. **Conversation Memory** beheert context
3. **Guus AI Agent** analyseert en reageert
4. **Check Service Request** detecteert service aanvragen
5. **Determine Service Category** categoriseert het type
6. **Log to Google Sheets** registreert de aanvraag
7. **Email Router** bepaalt het juiste email adres
8. **Gmail nodes** versturen gerichte emails

### Event Inquiry Flow

1. **Check Event Inquiry** detecteert event gerelateerde vragen
2. **Log Event to Sheets** registreert de event aanvraag
3. **Gmail - Event Inquiry** stuurt naar events team

## Monitoring & Troubleshooting

### Email Delivery Monitoring

- Controleer n8n execution logs voor email verzending
- Gebruik Gmail's Sent folder om verzonden emails te verifiëren
- Monitor bounce rates en delivery failures

### Common Issues

1. **Authentication Errors**
   - Verifieer OAuth2 tokens zijn niet verlopen
   - Controleer API quotas in Google Cloud Console

2. **Template Rendering**
   - Test email templates met verschillende data inputs
   - Valideer HTML syntax voor email client compatibility

3. **Routing Logic**
   - Test keyword detection met verschillende bewoordingen
   - Verifieer fallback naar default email adressen

## Testing

### Test Scenario's

1. **IT Support Test**
   ```
   Bericht: "Mijn computer doet het niet meer, ik kan niet inloggen"
   Verwacht: Email naar support@axs-ict.com
   ```

2. **Schoonmaak Test**
   ```
   Bericht: "De vergaderruimte moet schoongemaakt worden"
   Verwacht: Email naar ralphcassa@gmail.com
   ```

3. **Event Test**
   ```
   Bericht: "Ik wil graag een bedrijfsborrel organiseren"
   Verwacht: Email naar irene@cupolaxs.nl
   ```

4. **Algemeen Test**
   ```
   Bericht: "Wat zijn jullie openingstijden?"
   Verwacht: Email naar welcome@cupolaxs.nl
   ```

## Beveiliging

### Best Practices

- Gebruik OAuth2 voor authenticatie (niet service account keys)
- Implementeer rate limiting op email verzending
- Valideer en sanitize alle input data
- Monitor voor spam/abuse patronen
- Gebruik HTTPS voor alle webhook endpoints

### Data Privacy

- Bewaar geen gevoelige informatie in email templates
- Implementeer data retention policies
- Zorg voor GDPR compliance bij email logging
- Gebruik encrypted connections voor alle API calls

## Maintenance

### Regelmatige Taken

- Controleer OAuth2 token expiration
- Monitor email delivery rates
- Update email templates indien nodig
- Review en optimize routing keywords
- Backup n8n workflow configuratie

### Updates

- Test workflow changes in development environment
- Gebruik version control voor workflow exports
- Documenteer alle wijzigingen
- Communiceer updates naar stakeholders

## Support

Voor technische ondersteuning:
- n8n documentatie: https://docs.n8n.io/
- Google Workspace Admin Help: https://support.google.com/a/
- Gmail API documentatie: https://developers.google.com/gmail/api/

Voor workflow specifieke vragen, neem contact op met het ontwikkelteam.

