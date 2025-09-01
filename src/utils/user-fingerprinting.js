/**
 * User Fingerprinting Service
 * Privacy-conscious user identification for analytics and personalization
 */

export class UserFingerprinting {
  constructor(options = {}) {
    this.options = {
      enableFingerprinting: true,
      enableAnalytics: true,
      respectDNT: true, // Respect Do Not Track
      storageKey: 'chatguus_user_fp',
      sessionKey: 'chatguus_session',
      privacyCompliant: true,
      ...options
    };
    
    this.fingerprint = null;
    this.sessionData = null;
    
    this.init();
  }

  async init() {
    // Check Do Not Track preference
    if (this.options.respectDNT && this.isDNTEnabled()) {
      console.log('🔒 DNT enabled - fingerprinting disabled');
      return;
    }

    // Generate or retrieve fingerprint
    this.fingerprint = await this.generateFingerprint();
    this.sessionData = this.getSessionData();
    
    // Store for analytics
    this.storeFingerprint();
  }

  isDNTEnabled() {
    return navigator.doNotTrack === '1' || 
           navigator.doNotTrack === 'yes' || 
           navigator.msDoNotTrack === '1' ||
           window.doNotTrack === '1';
  }

  async generateFingerprint() {
    if (!this.options.enableFingerprinting) {
      return this.generateSimpleId();
    }

    const components = await this.collectFingerprintComponents();
    const fingerprint = await this.hashComponents(components);
    
    return {
      id: fingerprint,
      components,
      generated: new Date().toISOString(),
      version: '1.0'
    };
  }

  async collectFingerprintComponents() {
    const components = {};

    try {
      // Browser & System Info (privacy-safe)
      components.userAgent = navigator.userAgent;
      components.language = navigator.language;
      components.languages = navigator.languages?.slice(0, 3) || [];
      components.platform = navigator.platform;
      components.cookieEnabled = navigator.cookieEnabled;
      
      // Screen & Display
      components.screenResolution = `${screen.width}x${screen.height}`;
      components.colorDepth = screen.colorDepth;
      components.pixelRatio = window.devicePixelRatio;
      
      // Timezone & Location (privacy-safe)
      components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      components.timezoneOffset = new Date().getTimezoneOffset();
      
      // Browser Capabilities
      components.webgl = this.getWebGLInfo();
      components.canvas = await this.getCanvasFingerprint();
      components.fonts = await this.getAvailableFonts();
      components.plugins = this.getPluginInfo();
      
      // Performance & Hardware (anonymous)
      components.hardwareConcurrency = navigator.hardwareConcurrency;
      components.deviceMemory = navigator.deviceMemory;
      components.connection = this.getConnectionInfo();

    } catch (error) {
      console.warn('Fingerprinting component collection failed:', error);
    }

    return components;
  }

  getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return null;
      
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION)
      };
    } catch (error) {
      return null;
    }
  }

  async getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 200;
      canvas.height = 50;
      
      // Draw text with different fonts and styles
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('ChatGuusPT 🤖', 2, 2);
      
      ctx.font = '11px Times';
      ctx.fillText('Fingerprint Test', 2, 20);
      
      // Get canvas data
      const dataURL = canvas.toDataURL();
      return await this.simpleHash(dataURL);
    } catch (error) {
      return null;
    }
  }

  async getAvailableFonts() {
    const testFonts = [
      'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 
      'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
      'Arial Black', 'Impact'
    ];
    
    const availableFonts = [];
    
    for (const font of testFonts) {
      if (await this.isFontAvailable(font)) {
        availableFonts.push(font);
      }
    }
    
    return availableFonts.slice(0, 10); // Limit for privacy
  }

  async isFontAvailable(fontName) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const fallbackFont = 'monospace';
      
      ctx.font = `${testSize} ${fallbackFont}`;
      const fallbackWidth = ctx.measureText(testString).width;
      
      ctx.font = `${testSize} ${fontName}, ${fallbackFont}`;
      const testWidth = ctx.measureText(testString).width;
      
      return testWidth !== fallbackWidth;
    } catch (error) {
      return false;
    }
  }

  getPluginInfo() {
    if (!navigator.plugins) return [];
    
    const plugins = [];
    for (let i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
      plugins.push({
        name: navigator.plugins[i].name,
        description: navigator.plugins[i].description?.substring(0, 100)
      });
    }
    return plugins;
  }

  getConnectionInfo() {
    if (!navigator.connection) return null;
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    };
  }

  async hashComponents(components) {
    const jsonString = JSON.stringify(components, Object.keys(components).sort());
    return await this.simpleHash(jsonString);
  }

  async simpleHash(text) {
    if (crypto && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } else {
      // Fallback hash for older browsers
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16).substring(0, 16);
    }
  }

  generateSimpleId() {
    return {
      id: 'simple_' + Math.random().toString(36).substring(2, 15),
      generated: new Date().toISOString(),
      type: 'simple'
    };
  }

  getSessionData() {
    const sessionId = this.generateSessionId();
    const existingSession = this.getStoredData(this.options.sessionKey);
    
    if (existingSession && this.isSessionValid(existingSession)) {
      return existingSession;
    }

    const sessionData = {
      id: sessionId,
      created: new Date().toISOString(),
      visits: 1,
      lastSeen: new Date().toISOString(),
      pages: [window.location.pathname],
      referrer: document.referrer || null,
      utm: this.getUTMParameters()
    };

    this.storeData(this.options.sessionKey, sessionData);
    return sessionData;
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }

  isSessionValid(session) {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const lastSeen = new Date(session.lastSeen);
    return (Date.now() - lastSeen.getTime()) < maxAge;
  }

  getUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      if (urlParams.has(param)) {
        utm[param] = urlParams.get(param);
      }
    });
    
    return Object.keys(utm).length > 0 ? utm : null;
  }

  storeFingerprint() {
    if (!this.fingerprint) return;
    
    try {
      this.storeData(this.options.storageKey, {
        fingerprint: this.fingerprint,
        session: this.sessionData,
        stored: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to store fingerprint:', error);
    }
  }

  storeData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Fallback to sessionStorage
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (fallbackError) {
        console.warn('Storage not available:', fallbackError);
      }
    }
  }

  getStoredData(key) {
    try {
      const data = localStorage.getItem(key) || sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  // Analytics methods
  getAnalyticsData() {
    return {
      fingerprint: this.fingerprint?.id || null,
      session: this.sessionData?.id || null,
      visit: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      user: {
        timezone: this.fingerprint?.components?.timezone,
        language: navigator.language,
        platform: navigator.platform,
        isReturning: this.isReturningUser()
      }
    };
  }

  isReturningUser() {
    const stored = this.getStoredData(this.options.storageKey);
    return stored && stored.fingerprint;
  }

  // Privacy methods
  clearFingerprint() {
    localStorage.removeItem(this.options.storageKey);
    sessionStorage.removeItem(this.options.storageKey);
    localStorage.removeItem(this.options.sessionKey);
    sessionStorage.removeItem(this.options.sessionKey);
    
    this.fingerprint = null;
    this.sessionData = null;
  }

  getPrivacyInfo() {
    return {
      fingerprintingEnabled: this.options.enableFingerprinting,
      analyticsEnabled: this.options.enableAnalytics,
      dntRespected: this.options.respectDNT,
      dntEnabled: this.isDNTEnabled(),
      dataStored: !!this.getStoredData(this.options.storageKey),
      privacyCompliant: this.options.privacyCompliant
    };
  }

  // GDPR compliance methods
  exportUserData() {
    const stored = this.getStoredData(this.options.storageKey);
    const session = this.getStoredData(this.options.sessionKey);
    
    return {
      fingerprint: stored?.fingerprint || null,
      session: session || null,
      privacy: this.getPrivacyInfo(),
      exported: new Date().toISOString()
    };
  }

  // Personalization methods
  getUserPreferences() {
    const stored = this.getStoredData(this.options.storageKey);
    
    if (!stored || !stored.fingerprint) {
      return this.getDefaultPreferences();
    }

    const components = stored.fingerprint.components;
    
    return {
      language: components.language || 'nl',
      theme: this.detectPreferredTheme(components),
      device: this.detectDeviceType(components),
      accessibility: this.detectAccessibilityNeeds(components),
      timezone: components.timezone,
      isReturning: true
    };
  }

  getDefaultPreferences() {
    return {
      language: navigator.language.startsWith('nl') ? 'nl' : 'en',
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      device: this.detectDeviceType(),
      accessibility: this.detectAccessibilityNeeds(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isReturning: false
    };
  }

  detectPreferredTheme(components = {}) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Analyze usage patterns (simplified)
    const hour = new Date().getHours();
    if (hour < 7 || hour > 19) {
      return 'dark';
    }
    
    return 'light';
  }

  detectDeviceType(components = {}) {
    const userAgent = components.userAgent || navigator.userAgent;
    const screenWidth = components.screenResolution?.split('x')[0] || window.screen.width;
    
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      return 'mobile';
    }
    
    if (parseInt(screenWidth) < 1024) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  detectAccessibilityNeeds(components = {}) {
    const needs = [];
    
    // High contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      needs.push('high-contrast');
    }
    
    // Reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      needs.push('reduced-motion');
    }
    
    // Large text preference
    if (window.matchMedia('(prefers-reduced-data: reduce)').matches) {
      needs.push('reduced-data');
    }
    
    return needs;
  }

  // Analytics integration
  trackEvent(eventType, eventData = {}) {
    if (!this.options.enableAnalytics || this.isDNTEnabled()) {
      return;
    }

    const analyticsPayload = {
      event: eventType,
      data: eventData,
      user: {
        fingerprint: this.fingerprint?.id,
        session: this.sessionData?.id,
        isReturning: this.isReturningUser()
      },
      context: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        timezone: this.fingerprint?.components?.timezone
      }
    };

    // Send to analytics endpoint
    this.sendAnalytics(analyticsPayload);
  }

  async sendAnalytics(payload) {
    try {
      // Send to your analytics service
      await fetch('/.netlify/functions/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Personalization API
  getPersonalizedConfig(baseConfig = {}) {
    const preferences = this.getUserPreferences();
    
    return {
      ...baseConfig,
      theme: preferences.theme,
      language: preferences.language,
      accessibility: {
        highContrast: preferences.accessibility.includes('high-contrast'),
        reducedMotion: preferences.accessibility.includes('reduced-motion'),
        reducedData: preferences.accessibility.includes('reduced-data')
      },
      device: {
        type: preferences.device,
        isMobile: preferences.device === 'mobile',
        isTablet: preferences.device === 'tablet'
      },
      user: {
        isReturning: preferences.isReturning,
        timezone: preferences.timezone,
        preferredLanguage: preferences.language
      }
    };
  }

  // Privacy compliance
  getConsentStatus() {
    const consent = this.getStoredData('chatguus_consent');
    return {
      hasConsent: !!consent,
      consentDate: consent?.date || null,
      consentVersion: consent?.version || null,
      categories: consent?.categories || []
    };
  }

  setConsent(categories = ['functional'], version = '1.0') {
    const consent = {
      categories,
      version,
      date: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    this.storeData('chatguus_consent', consent);
    
    // Re-initialize with consent
    if (categories.includes('analytics')) {
      this.options.enableAnalytics = true;
      this.options.enableFingerprinting = true;
      this.init();
    }
  }

  revokeConsent() {
    this.clearFingerprint();
    localStorage.removeItem('chatguus_consent');
    sessionStorage.removeItem('chatguus_consent');
    
    this.options.enableAnalytics = false;
    this.options.enableFingerprinting = false;
  }
}

// Utility functions for easy integration
export function createUserFingerprint(options = {}) {
  return new UserFingerprinting(options);
}

export function getAnonymousUserId() {
  const stored = localStorage.getItem('chatguus_user_fp');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.fingerprint?.id || null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

export function trackChatEvent(eventType, eventData = {}) {
  if (window.chatGuusFingerprinting) {
    window.chatGuusFingerprinting.trackEvent(eventType, eventData);
  }
}

// Auto-initialize for widget
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.chatGuusFingerprinting) {
      window.chatGuusFingerprinting = new UserFingerprinting({
        enableFingerprinting: true,
        enableAnalytics: true,
        respectDNT: true,
        privacyCompliant: true
      });
    }
  });
}
