# Avatar Configuratie voor ChatGuus Widget

## Overzicht

De ChatGuus widget ondersteunt nu aangepaste avatars voor een persoonlijkere ervaring. Je kunt een foto van Guus of een andere afbeelding gebruiken in plaats van het standaard robot emoji.

## Standaard Configuratie

Voor de `mijn-bedrijf` en `koepel` tenants is de Guus foto standaard geconfigureerd:
- **Avatar**: `https://chatguuspt.netlify.app/assets/guus-avatar.jpg`
- **Fallback**: 🤖 (robot emoji als de foto niet laadt)

## Avatar Opties

### 1. Standaard Guus Foto (Automatisch voor mijn-bedrijf)
```javascript
ChatGuus.init({
  tenantId: 'mijn-bedrijf',
  primaryColor: '#000000',
  // Guus foto wordt automatisch geladen - geen avatar parameter nodig!
});
```

**Let op**: Voor de `mijn-bedrijf` tenant wordt de Guus foto automatisch gebruikt als standaard avatar. Je hoeft geen `avatar` parameter op te geven.

### 2. Custom Avatar URL
```javascript
ChatGuus.init({
  tenantId: 'mijn-bedrijf',
  avatar: 'https://example.com/custom-avatar.jpg',
  avatarFallback: '👨‍💼'
});
```

### 3. Absolute Path naar Lokale Afbeelding
```javascript
ChatGuus.init({
  tenantId: 'mijn-bedrijf',
  avatar: '/assets/my-custom-avatar.png',
  avatarFallback: '🤖'
});
```

### 4. Emoji Avatar
```javascript
ChatGuus.init({
  tenantId: 'mijn-bedrijf',
  avatar: '👨‍💼',
  avatarFallback: '🤖'
});
```

## Afbeelding Specificaties

### Aanbevolen Formaat
- **Aspect ratio**: 1:1 (vierkant)
- **Afmetingen**: 200x200px tot 500x500px
- **Formaten**: JPG, PNG, WebP
- **Bestandsgrootte**: < 100KB voor snelle laadtijden

### Styling
- Afbeeldingen worden automatisch rond gemaakt
- Witte rand met transparantie voor betere zichtbaarheid
- Object-fit: cover voor perfecte weergave

## Installatie Instructies

### Basis Installatie met Guus Avatar
```html
<script>
(function () {
  // Laat de widget alleen op /servicerequest laden
  var path = window.location.pathname.toLowerCase().replace(/\/+$/,'');
  if (path !== '/servicerequest') return;
  
  // Laad het widget script
  var s = document.createElement('script');
  s.src = 'https://chatguuspt.netlify.app/.netlify/functions/widget';
  s.defer = true;
  
  s.onload = function () {
    if (window.ChatGuus) {
      ChatGuus.init({
        theme: 'koepel',
        tenantId: 'mijn-bedrijf',
        primaryColor: '#000000',
        position: 'bottom-right',
        welcomeMessage: 'Hallo! Ik ben Guus. Waar kan ik je mee helpen?'
        // Avatar wordt automatisch geladen voor mijn-bedrijf tenant
      });
    }
  };
  
  document.body.appendChild(s);
})();
</script>
```

### Installatie met Custom Avatar
```html
<script>
(function () {
  var path = window.location.pathname.toLowerCase().replace(/\/+$/,'');
  if (path !== '/servicerequest') return;
  
  var s = document.createElement('script');
  s.src = 'https://chatguuspt.netlify.app/.netlify/functions/widget';
  s.defer = true;
  
  s.onload = function () {
    if (window.ChatGuus) {
      ChatGuus.init({
        theme: 'koepel',
        tenantId: 'mijn-bedrijf',
        primaryColor: '#000000',
        position: 'bottom-right',
        welcomeMessage: 'Hallo! Waar kan ik je mee helpen?',
        
        // Custom avatar configuratie
        avatar: 'https://example.com/my-avatar.jpg',
        avatarFallback: '👨‍💼'
      });
    }
  };
  
  document.body.appendChild(s);
})();
</script>
```

## Fallback Mechanisme

Het avatar systeem heeft een robuust fallback mechanisme:

1. **Primaire Avatar**: De opgegeven avatar URL of emoji
2. **Fallback Avatar**: Als de primaire avatar faalt (bijv. afbeelding laadt niet)
3. **Systeem Fallback**: 🤖 als geen fallback is opgegeven

### Voorbeeld Fallback Configuratie
```javascript
ChatGuus.init({
  avatar: 'https://example.com/avatar.jpg',      // Probeer eerst deze afbeelding
  avatarFallback: '👨‍💼',                        // Als afbeelding faalt, gebruik deze emoji
  // Als beide falen: 🤖 (systeem fallback)
});
```

## Troubleshooting

### Avatar Laadt Niet
1. **Controleer URL**: Zorg dat de avatar URL toegankelijk is
2. **CORS Issues**: Externe afbeeldingen moeten CORS headers hebben
3. **Bestandsformaat**: Gebruik ondersteunde formaten (JPG, PNG, WebP)
4. **Cache**: Voeg `?v=${Date.now()}` toe aan URL voor cache busting

### Avatar is Wazig
1. **Afmetingen**: Gebruik minimaal 200x200px
2. **Bestandskwaliteit**: Gebruik hoge kwaliteit afbeeldingen
3. **Formaat**: PNG voor scherpe randen, JPG voor foto's

### Performance Issues
1. **Bestandsgrootte**: Optimaliseer afbeeldingen < 100KB
2. **CDN**: Gebruik een CDN voor externe afbeeldingen
3. **Lazy Loading**: Widget laadt avatars alleen wanneer nodig

## Voorbeelden

### Complete Configuratie
```javascript
ChatGuus.init({
  theme: 'koepel',
  tenantId: 'mijn-bedrijf',
  primaryColor: '#000000',
  position: 'bottom-right',
  
  // Avatar configuratie
  avatar: 'https://chatguuspt.netlify.app/assets/guus-avatar.jpg',
  avatarFallback: '🤖',
  
  // Andere opties
  welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?'
});
```

### Testing Avatar Configuraties
Gebruik het test bestand om verschillende avatar configuraties te testen:
```bash
# Open in browser
open test-avatar-widget.html
```

## Deployment

Na het configureren van avatars:

1. **Test lokaal**: Gebruik `test-avatar-widget.html`
2. **Build**: `npm run build` (kopieert assets)
3. **Deploy**: `npx netlify deploy --prod --dir=dist --functions=netlify/functions`
4. **Verify**: Test op productie omgeving
