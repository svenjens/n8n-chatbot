/**
 * ChatGuusPT - Embeddable Chat Widget
 * Vriendelijke chatbot voor de Koepel zakelijke gebruikers
 */

import { UserFingerprinting, trackChatEvent } from '../utils/user-fingerprinting.js';
import { SatisfactionRating } from '../utils/satisfaction-rating.js';

class ChatGuusWidget {
  constructor(options = {}) {
    // Auto-detect deployment environment
    const isNetlify = window.location.hostname.includes('netlify.app') || 
                     window.location.hostname.includes('.netlify.com') ||
                     window.CHATGUUS_CONFIG?.platform === 'netlify';
    
    const defaultWebhookUrl = isNetlify ? 
      '/.netlify/functions/chat' : 
      (options.webhookUrl || process.env.N8N_WEBHOOK_URL || '/api/chat');

    this.options = {
      target: '#chatguus-widget',
      webhookUrl: defaultWebhookUrl,
      fallbackUrl: isNetlify ? null : '/api/chat',
      theme: 'koepel',
      welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?',
      position: 'bottom-right',
      primaryColor: '#2563eb',
      avatar: '/assets/guus-avatar.png',
      tenantId: 'koepel',
      retryAttempts: 2,
      timeoutMs: 8000,
      isNetlify,
      ...options
    };
    
    this.isOpen = false;
    this.sessionId = this.generateSessionId();
    this.messages = [];
    this.isTyping = false;
    
    // Initialize user fingerprinting
    this.userFingerprinting = new UserFingerprinting({
      enableFingerprinting: options.enableFingerprinting !== false,
      enableAnalytics: options.enableAnalytics !== false,
      respectDNT: true,
      privacyCompliant: true
    });
    
    // Initialize satisfaction rating system with language detection
    this.satisfactionRating = new SatisfactionRating({
      enableRating: options.enableRating !== false,
      autoPrompt: options.autoPromptRating !== false,
      collectFeedback: options.collectFeedback !== false,
      minMessages: options.minMessagesForRating || 3,
      language: options.language || this.detectLanguage(options.tenantId)
    });
    
    this.init();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  detectLanguage(tenantId) {
    // Check tenant-specific language settings
    const tenantLanguages = {
      'koepel': 'nl',
      'fashionstore': 'en',
      'healthcare': 'en'
    };
    
    if (tenantLanguages[tenantId]) {
      return tenantLanguages[tenantId];
    }
    
    // Fallback to browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('nl')) return 'nl';
    if (browserLang.startsWith('en')) return 'en';
    
    return 'nl'; // Default to Dutch
  }

  async init() {
    this.createStyles();
    this.createWidget();
    this.bindEvents();
    
    // Apply personalized configuration BEFORE adding welcome message
    await this.applyPersonalization();
    
    // Initialize satisfaction rating for this session
    this.satisfactionRating.initializeSession(this.sessionId, this.options.tenantId);
    this.satisfactionRating.integrateWithChatWidget(this);
    
    // Add welcome message only once, after personalization
    this.addWelcomeMessage();
    
    // Track widget initialization
    this.trackEvent('widget_initialized', {
      tenantId: this.options.tenantId,
      theme: this.options.theme,
      position: this.options.position
    });
  }

  createStyles() {
    const styles = `
      .chatguus-widget {
        position: fixed;
        ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10000;
        transition: all 0.3s ease;
        overflow: hidden;
        display: none;
      }

      .chatguus-widget.open {
        display: flex;
        flex-direction: column;
      }

      .chatguus-toggle {
        position: fixed;
        ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        width: 60px;
        height: 60px;
        background: ${this.options.primaryColor};
        border-radius: 50%;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        transition: all 0.3s ease;
      }

      .chatguus-toggle:hover {
        transform: scale(1.1);
      }

      .chatguus-toggle.hidden {
        display: none;
      }

      .chatguus-header {
        background: ${this.options.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatguus-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .chatguus-title {
        flex: 1;
      }

      .chatguus-title h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .chatguus-title p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }

      .chatguus-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 4px;
        border-radius: 4px;
      }

      .chatguus-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .chatguus-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chatguus-message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
      }

      .chatguus-message.user {
        background: ${this.options.primaryColor};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }

      .chatguus-message.bot {
        background: #f1f5f9;
        color: #334155;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }

      .chatguus-typing {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #f1f5f9;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        max-width: 80%;
        align-self: flex-start;
      }

      .chatguus-typing-dots {
        display: flex;
        gap: 4px;
      }

      .chatguus-typing-dot {
        width: 6px;
        height: 6px;
        background: #64748b;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .chatguus-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .chatguus-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.5;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }

      .chatguus-input {
        padding: 16px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
      }

      .chatguus-input input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        outline: none;
        font-size: 14px;
      }

      .chatguus-input input:focus {
        border-color: ${this.options.primaryColor};
      }

      .chatguus-send {
        background: ${this.options.primaryColor};
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .chatguus-send:hover {
        transform: scale(1.1);
      }

      .chatguus-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      @media (max-width: 480px) {
        .chatguus-widget {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  createWidget() {
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'chatguus-toggle';
    this.toggleButton.innerHTML = '💬';
    this.toggleButton.title = 'Chat met Guus';

    // Create widget container
    this.widget = document.createElement('div');
    this.widget.className = 'chatguus-widget';
    this.widget.innerHTML = `
      <div class="chatguus-header">
        <div class="chatguus-avatar">🤖</div>
        <div class="chatguus-title">
          <h3>Guus van de Koepel</h3>
          <p>Online • Klaar om te helpen</p>
        </div>
        <button class="chatguus-close">×</button>
      </div>
      <div class="chatguus-messages" id="chatguus-messages"></div>
      <div class="chatguus-input">
        <input type="text" id="chatguus-input" placeholder="Typ je vraag hier..." />
        <button class="chatguus-send" id="chatguus-send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;

    // Append to target or body
    const target = document.querySelector(this.options.target);
    if (target) {
      target.appendChild(this.widget);
      target.appendChild(this.toggleButton);
    } else {
      document.body.appendChild(this.widget);
      document.body.appendChild(this.toggleButton);
    }

    // Get references to interactive elements
    this.messagesContainer = document.getElementById('chatguus-messages');
    this.inputField = document.getElementById('chatguus-input');
    this.sendButton = document.getElementById('chatguus-send');
    this.closeButton = this.widget.querySelector('.chatguus-close');
  }

  bindEvents() {
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.closeButton.addEventListener('click', () => this.close());
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.inputField.addEventListener('input', () => {
      this.sendButton.disabled = !this.inputField.value.trim();
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.widget.classList.toggle('open', this.isOpen);
    this.toggleButton.classList.toggle('hidden', this.isOpen);
    
    if (this.isOpen) {
      this.inputField.focus();
      this.trackEvent('widget_opened', {
        method: 'toggle_button',
        messagesCount: this.messages.length
      });
    } else {
      this.trackEvent('widget_closed', {
        method: 'toggle_button',
        sessionDuration: this.getSessionDuration()
      });
    }
  }

  open() {
    this.isOpen = true;
    this.widget.classList.add('open');
    this.toggleButton.classList.add('hidden');
    this.inputField.focus();
  }

  close() {
    this.isOpen = false;
    this.widget.classList.remove('open');
    this.toggleButton.classList.remove('hidden');
  }

  addWelcomeMessage() {
    // Prevent duplicate welcome messages
    if (this.messages.length === 0) {
      this.addMessage(this.options.welcomeMessage, 'bot');
    }
  }

  addMessage(content, sender, options = {}) {
    const message = {
      id: Date.now(),
      content,
      sender,
      timestamp: new Date(),
      ...options
    };

    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `chatguus-message ${message.sender}`;
    
    // Clean and format message content
    const cleanContent = this.formatMessageContent(message.content);
    messageElement.innerHTML = cleanContent;
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'chatguus-message-time';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
    messageElement.appendChild(timestamp);
    
    this.messagesContainer.appendChild(messageElement);
  }

  formatMessageContent(content) {
    // Strip HTML tags but preserve some formatting
    let cleaned = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, '') // Remove all other HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");

    // Convert common patterns to proper formatting
    cleaned = cleaned
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>') // `code`
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/• /g, '• ') // Bullet points
      .replace(/\d+\. /g, (match) => `<strong>${match}</strong>`); // Numbered lists

    // Handle emoji and special characters
    cleaned = this.processEmojis(cleaned);

    return cleaned;
  }

  processEmojis(text) {
    // Ensure emojis are properly displayed
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, 
      (emoji) => `<span class="emoji">${emoji}</span>`);
  }

  showTyping() {
    if (this.isTyping) return;
    
    this.isTyping = true;
    const typingElement = document.createElement('div');
    typingElement.className = 'chatguus-typing';
    typingElement.id = 'chatguus-typing-indicator';
    typingElement.innerHTML = `
      <span>Guus typt</span>
      <div class="chatguus-typing-dots">
        <div class="chatguus-typing-dot"></div>
        <div class="chatguus-typing-dot"></div>
        <div class="chatguus-typing-dot"></div>
      </div>
    `;
    
    this.messagesContainer.appendChild(typingElement);
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    const typingElement = document.getElementById('chatguus-typing-indicator');
    if (typingElement) {
      typingElement.remove();
    }
  }

  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;

    // Track message sending
    this.trackEvent('message_sent', {
      messageLength: message.length,
      messagesInSession: this.messages.length,
      sessionDuration: this.getSessionDuration()
    });

    // Add user message
    this.addMessage(message, 'user');
    this.inputField.value = '';
    this.sendButton.disabled = true;

    // Show typing indicator
    this.showTyping();

    const startTime = Date.now();

    try {
      // Send to N8N webhook
      const response = await this.sendToN8N(message);
      
      const responseTime = Date.now() - startTime;
      
      // Track successful response
      this.trackEvent('message_received', {
        responseTime,
        hasAction: !!response.action,
        actionType: response.action?.type || null
      });
      
      // Hide typing and show response
      this.hideTyping();
      this.addMessage(response.message, 'bot');
      
      // Handle any special actions (email routing, etc.)
      if (response.action) {
        this.handleSpecialAction(response.action);
        this.trackEvent('action_triggered', {
          actionType: response.action.type,
          category: response.action.category
        });
      }
      
    } catch (error) {
      console.error('ChatGuus Error:', error);
      
      // Track error
      this.trackEvent('message_error', {
        error: error.message,
        responseTime: Date.now() - startTime
      });
      
      this.hideTyping();
      this.addMessage('Sorry, er ging iets mis. Probeer het opnieuw of neem direct contact op via welcome@cupolaxs.nl', 'bot');
    }
  }

  async sendToN8N(message) {
    const payload = {
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      tenantId: this.options.tenantId
    };

    // Try primary webhook URL first
    try {
      const response = await this.makeRequest(this.options.webhookUrl, payload);
      return response;
    } catch (error) {
      console.warn('Primary webhook failed:', error);
      
      // Try fallback URL if available
      if (this.options.fallbackUrl && this.options.fallbackUrl !== this.options.webhookUrl) {
        try {
          console.log('Trying fallback URL...');
          const response = await this.makeRequest(this.options.fallbackUrl, payload);
          return response;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  async makeRequest(url, payload, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry logic
      if (attempt < this.options.retryAttempts && 
          (error.name === 'AbortError' || error.message.includes('fetch'))) {
        
        console.log(`Retrying request (attempt ${attempt + 1}/${this.options.retryAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        
        return this.makeRequest(url, payload, attempt + 1);
      }
      
      throw error;
    }
  }

  handleSpecialAction(action) {
    switch (action.type) {
      case 'service_request_form':
        this.showServiceRequestForm();
        break;
      case 'event_inquiry_form':
        this.showEventInquiryForm();
        break;
      case 'contact_redirect':
        this.addMessage(`Ik stuur je vraag door naar ${action.department}. Je krijgt binnen 24 uur een reactie.`, 'bot');
        break;
    }
  }

  showServiceRequestForm() {
    const formMessage = `**Serviceverzoek Formulier**

Ik help je graag met je serviceverzoek. Kun je me de volgende informatie geven?

• Wat is de aard van je verzoek?
• Wanneer moet dit uitgevoerd worden?
• Zijn er specifieke vereisten?

Geef zoveel mogelijk details, dan kan ik je verzoek direct naar het juiste team doorsturen! 🛠️`;
    
    this.addMessage(formMessage, 'bot');
  }

  showEventInquiryForm() {
    const eventMessage = `**Nieuwe Event Uitvraag** 🎉

Leuk dat je een evenement wilt organiseren in de Koepel! Ik heb wat informatie nodig:

🎉 **Type evenement:** Wat voor soort evenement is het?
🏢 **Waarom de Koepel:** Wat trekt je aan in onze locatie?
👥 **Aantal personen:** Hoeveel gasten verwacht je?
💰 **Budget:** Wat is je budget indicatie?
📅 **Datum:** Wanneer wil je het evenement houden?

Vertel me meer over je plannen!`;
    
    this.addMessage(eventMessage, 'bot');
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // Personalization methods
  async applyPersonalization() {
    try {
      const personalizedConfig = this.userFingerprinting.getPersonalizedConfig(this.options);
      
      // Apply theme preferences
      if (personalizedConfig.theme === 'dark') {
        this.widget.classList.add('dark-theme');
      }
      
      // Apply accessibility preferences
      if (personalizedConfig.accessibility.reducedMotion) {
        this.widget.classList.add('reduced-motion');
      }
      
      if (personalizedConfig.accessibility.highContrast) {
        this.widget.classList.add('high-contrast');
      }
      
      // Adjust for device type
      if (personalizedConfig.device.isMobile) {
        this.widget.classList.add('mobile-optimized');
      }
      
      // Personalized welcome message for returning users
      if (personalizedConfig.user.isReturning) {
        this.options.welcomeMessage = 'Welkom terug! Waar kan ik je mee helpen? 😊';
      }
      
    } catch (error) {
      console.warn('Personalization failed:', error);
    }
  }

  // Analytics and tracking methods
  trackEvent(eventType, eventData = {}) {
    if (this.userFingerprinting) {
      this.userFingerprinting.trackEvent(eventType, {
        ...eventData,
        tenantId: this.options.tenantId,
        widgetVersion: '1.0.0'
      });
    }
  }

  getSessionDuration() {
    if (!this.sessionStartTime) {
      this.sessionStartTime = Date.now();
      return 0;
    }
    return Date.now() - this.sessionStartTime;
  }

  // Privacy methods
  showPrivacyNotice() {
    const privacyNotice = `
      **Privacy & Cookies** 🔒
      
      We gebruiken functionele cookies en anonyme analytics om je ervaring te verbeteren.
      
      • **Functioneel**: Chat functionaliteit en voorkeuren
      • **Analytics**: Anonieme gebruiksstatistieken  
      • **Geen tracking**: We verkopen geen data aan derden
      
      Door te chatten ga je akkoord met ons privacy beleid.
    `;
    
    this.addMessage(privacyNotice, 'bot');
  }

  getUserPrivacyInfo() {
    return this.userFingerprinting?.getPrivacyInfo() || {
      fingerprintingEnabled: false,
      analyticsEnabled: false,
      dntRespected: true
    };
  }

  clearUserData() {
    if (this.userFingerprinting) {
      this.userFingerprinting.clearFingerprint();
    }
    
    // Clear chat history
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    this.addWelcomeMessage();
    
    this.trackEvent('user_data_cleared');
  }

  exportUserData() {
    const chatHistory = this.messages.map(msg => ({
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp
    }));
    
    const userData = {
      chatHistory,
      session: {
        id: this.sessionId,
        duration: this.getSessionDuration(),
        messagesCount: this.messages.length
      },
      privacy: this.getUserPrivacyInfo(),
      exported: new Date().toISOString()
    };
    
    // Download as JSON
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `chatguus-data-${this.sessionId}.json`;
    link.click();
    
    this.trackEvent('user_data_exported');
  }

  // Enhanced payload for N8N with fingerprinting data
  async sendToN8N(message) {
    const analyticsData = this.userFingerprinting?.getAnalyticsData() || {};
    
    const payload = {
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      tenantId: this.options.tenantId,
      
      // Enhanced analytics data
      user: {
        fingerprint: analyticsData.fingerprint,
        session: analyticsData.session,
        isReturning: analyticsData.user?.isReturning || false,
        timezone: analyticsData.user?.timezone,
        language: analyticsData.user?.language,
        device: analyticsData.user?.platform
      },
      
      // Context data
      context: {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        pageTitle: document.title,
        messagesInSession: this.messages.length,
        sessionDuration: this.getSessionDuration()
      }
    };

    // Try primary webhook URL first
    try {
      const response = await this.makeRequest(this.options.webhookUrl, payload);
      return response;
    } catch (error) {
      console.warn('Primary webhook failed:', error);
      
      // Try fallback URL if available
      if (this.options.fallbackUrl && this.options.fallbackUrl !== this.options.webhookUrl) {
        try {
          console.log('Trying fallback URL...');
          const response = await this.makeRequest(this.options.fallbackUrl, payload);
          return response;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  // Satisfaction rating methods
  promptSatisfactionRating() {
    if (this.satisfactionRating.ratingPromptShown) return;
    
    const ratingPrompt = this.satisfactionRating.createRatingPrompt();
    this.addMessage(ratingPrompt.message, 'bot', { showRating: true });
  }

  markIssueResolved() {
    this.satisfactionRating.trackInteraction('issue_resolved');
    
    // Auto-prompt rating after issue resolution
    setTimeout(() => {
      this.promptSatisfactionRating();
    }, 2000);
  }

  escalateToHuman(reason = 'user_request') {
    this.satisfactionRating.trackInteraction('escalated_to_human', { reason });
    
    this.addMessage(
      "I'm connecting you with one of our team members who can better assist you. They'll be with you shortly! 👨‍💼",
      'bot'
    );
  }

  // Simulate user message (for demo purposes)
  simulateUserMessage(message) {
    if (!this.isOpen) {
      this.open();
    }
    
    setTimeout(() => {
      this.inputField.value = message;
      this.sendMessage();
    }, 500);
  }

  // Get satisfaction metrics for this session
  getSessionSatisfactionData() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messages.length,
      duration: this.getSessionDuration(),
      hasRating: this.satisfactionRating.hasRated,
      interactions: this.satisfactionRating.currentSession?.interactions || []
    };
  }

  // Public API methods
  static init(options) {
    // Prevent multiple instances - destroy existing widget first
    const existingWidget = document.querySelector('.chatguus-widget');
    const existingToggle = document.querySelector('.chatguus-toggle');
    
    if (existingWidget) existingWidget.remove();
    if (existingToggle) existingToggle.remove();
    
    return new ChatGuusWidget(options);
  }
}

// Global API
window.ChatGuus = ChatGuusWidget;

// Auto-init if target exists
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('#chatguus-widget');
  if (target) {
    ChatGuusWidget.init();
  }
});

export default ChatGuusWidget;
