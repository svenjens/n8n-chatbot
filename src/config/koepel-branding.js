/**
 * Koepel Branding Configuration
 * Centralized branding en styling voor ChatGuusPT
 */

export const KoepelBranding = {
  // Primary Brand Colors
  colors: {
    primary: '#2563eb',        // Koepel blauw
    primaryDark: '#1d4ed8',    // Donkerder blauw voor hover states
    secondary: '#64748b',      // Grijs voor secondary elements
    success: '#10b981',        // Groen voor success states
    warning: '#f59e0b',        // Oranje voor warnings
    error: '#ef4444',          // Rood voor errors
    
    // Neutral colors
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0'
  },

  // Typography
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px', 
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  },

  // Border radius
  radius: {
    sm: '6px',
    base: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },

  // Animations
  animations: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
    bounce: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Guus Avatar Options
  avatars: {
    emoji: '🤖',
    default: '/assets/guus-avatar.png',
    alternatives: [
      '👨‍💼', '🏢', '💼', '👋', '😊'
    ]
  },

  // Chat Widget Themes
  themes: {
    koepel: {
      name: 'Koepel Default',
      primaryColor: '#2563eb',
      headerGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      messageBackground: '#f8fafc',
      userMessageBackground: '#2563eb',
      borderColor: '#e2e8f0'
    },
    
    dark: {
      name: 'Koepel Dark',
      primaryColor: '#3b82f6',
      headerGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      messageBackground: '#334155',
      userMessageBackground: '#3b82f6',
      borderColor: '#475569',
      textColor: '#f1f5f9'
    },
    
    minimal: {
      name: 'Minimal',
      primaryColor: '#6b7280',
      headerGradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      messageBackground: '#f9fafb',
      userMessageBackground: '#6b7280',
      borderColor: '#d1d5db'
    }
  },

  // Message Templates
  messages: {
    welcome: [
      'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen? 👋',
      'Welkom bij de Koepel! Ik sta klaar om je te helpen. Wat zou je willen weten? 😊',
      'Hoi! Fijn dat je er bent. Ik help je graag met al je vragen over de Koepel! 🏢'
    ],
    
    serviceRequest: {
      general: 'Ik help je graag met je serviceverzoek! Om je goed te kunnen helpen, heb ik wat meer informatie nodig.',
      it: 'Ik zie dat je een IT-gerelateerde vraag hebt. Vertel me meer over het technische probleem!',
      cleaning: 'Ik help je graag met je schoonmaakvraag! Wat moet er geregeld worden?',
      events: 'Voor vragen over bestaande evenementen help ik je graag verder!'
    },
    
    eventInquiry: 'Wat leuk dat je een evenement wilt organiseren in de Koepel! 🎉 Vertel me meer over je plannen.',
    
    faq: {
      openingstijden: 'De Koepel is doordeweeks geopend van 8:00 tot 18:00. Voor evenementen kunnen we ook buiten deze tijden open!',
      locatie: 'We zijn uitstekend bereikbaar met zowel openbaar vervoer als de auto. Parkeren is geen probleem!',
      faciliteiten: 'We hebben moderne vergaderzalen, flexibele werkplekken en alle AV-apparatuur die je nodig hebt.',
      contact: 'Voor algemene vragen kun je terecht bij welcome@cupolaxs.nl. Ik kan je ook direct doorverbinden!'
    },
    
    fallback: [
      'Sorry, ik had even een technisch probleempje! Kun je je vraag opnieuw stellen?',
      'Oeps, er ging iets mis. Probeer het nog eens, of neem direct contact op via welcome@cupolaxs.nl',
      'Excuses voor de storing! Waar kan ik je mee helpen?'
    ]
  },

  // Quick Reply Options
  quickReplies: {
    initial: [
      '🛠️ Serviceverzoek',
      '🎉 Evenement plannen', 
      '❓ Informatie',
      '📞 Contact'
    ],
    
    serviceTypes: [
      'IT ondersteuning',
      'Schoonmaak',
      'Algemene vraag',
      'Bestaand evenement'
    ],
    
    eventTypes: [
      'Bedrijfsborrel',
      'Vergadering',
      'Workshop', 
      'Netwerkbijeenkomst',
      'Anders'
    ],
    
    faqTopics: [
      'Openingstijden',
      'Locatie',
      'Faciliteiten',
      'Prijzen',
      'Contact'
    ]
  },

  // Widget Positioning Options
  positions: {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' }
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px'
  },

  // Animation Presets
  animationPresets: {
    slideIn: 'slideIn 0.3s ease-out',
    fadeIn: 'fadeIn 0.2s ease',
    bounce: 'bounce 0.5s ease',
    typing: 'typing 1.4s infinite ease-in-out'
  }
};

// Helper function to get theme
export function getTheme(themeName = 'koepel') {
  return KoepelBranding.themes[themeName] || KoepelBranding.themes.koepel;
}

// Helper function to get random welcome message
export function getRandomWelcomeMessage() {
  const messages = KoepelBranding.messages.welcome;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Helper function to get random fallback message
export function getRandomFallbackMessage() {
  const messages = KoepelBranding.messages.fallback;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate CSS variables from branding
export function generateCSSVariables(theme = 'koepel') {
  const selectedTheme = getTheme(theme);
  const { colors, fonts, spacing, radius, shadows } = KoepelBranding;
  
  return `
    :root {
      /* Colors */
      --chatguus-primary: ${selectedTheme.primaryColor || colors.primary};
      --chatguus-primary-dark: ${colors.primaryDark};
      --chatguus-secondary: ${colors.secondary};
      --chatguus-success: ${colors.success};
      --chatguus-warning: ${colors.warning};
      --chatguus-error: ${colors.error};
      --chatguus-background: ${selectedTheme.messageBackground || colors.background};
      --chatguus-surface: ${colors.surface};
      --chatguus-text: ${selectedTheme.textColor || colors.text};
      --chatguus-text-muted: ${colors.textMuted};
      --chatguus-border: ${selectedTheme.borderColor || colors.border};
      
      /* Typography */
      --chatguus-font: ${fonts.primary};
      --chatguus-text-xs: ${fonts.sizes.xs};
      --chatguus-text-sm: ${fonts.sizes.sm};
      --chatguus-text-base: ${fonts.sizes.base};
      --chatguus-text-lg: ${fonts.sizes.lg};
      
      /* Spacing */
      --chatguus-space-xs: ${spacing.xs};
      --chatguus-space-sm: ${spacing.sm};
      --chatguus-space-base: ${spacing.base};
      --chatguus-space-lg: ${spacing.lg};
      --chatguus-space-xl: ${spacing.xl};
      
      /* Border Radius */
      --chatguus-radius-sm: ${radius.sm};
      --chatguus-radius-base: ${radius.base};
      --chatguus-radius-lg: ${radius.lg};
      --chatguus-radius-full: ${radius.full};
      
      /* Shadows */
      --chatguus-shadow-sm: ${shadows.sm};
      --chatguus-shadow-base: ${shadows.base};
      --chatguus-shadow-lg: ${shadows.lg};
      --chatguus-shadow-xl: ${shadows.xl};
      
      /* Animations */
      --chatguus-anim-fast: ${KoepelBranding.animations.fast};
      --chatguus-anim-base: ${KoepelBranding.animations.base};
      --chatguus-anim-slow: ${KoepelBranding.animations.slow};
    }
  `;
}

export default KoepelBranding;
