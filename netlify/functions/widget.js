/**
 * Netlify Function: Widget Endpoint
 * Serves the ChatGuusPT widget JavaScript - Standalone version
 */

// Use CommonJS for Netlify but avoid browser conflicts
const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    // Get tenant ID from query params
    const tenantId = event.queryStringParameters?.tenant || 'koepel';
    
    // Tenant-specific avatar configuration
    const getTenantAvatarConfig = (tenantId) => {
      switch (tenantId) {
        case 'mijn-bedrijf':
        case 'koepel':
          return {
            avatar: 'https://chatguuspt.netlify.app/assets/guus-avatar.jpg',
            avatarFallback: '🤖'
          };
        default:
          return {
            avatar: '🤖',
            avatarFallback: '🤖'
          };
      }
    };
    
    const tenantAvatarConfig = getTenantAvatarConfig(tenantId);
    
    // Build widget with tenant configuration
    const netlifyConfig = {
      apiEndpoint: 'https://chatguuspt.netlify.app/.netlify/functions/chat',
      tenantId: tenantId,
      fallbackMode: true
    };

    // Standalone widget JavaScript with embedded CSS
    const widgetContent = `
      // Netlify Configuration
      window.CHATGUUS_CONFIG = ${JSON.stringify(netlifyConfig)};
      
      // Tenant-specific Configuration  
      window.CHATGUUS_TENANT_CONFIG = ${JSON.stringify(tenantAvatarConfig)};
      
      // Embedded CSS Styles
      const styles = document.createElement('style');
      styles.textContent = \`
        .chatguus-widget {
          position: fixed;
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
          flex-direction: column;
        }

        .chatguus-widget.open {
          display: flex;
        }

        .chatguus-widget.position-bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .chatguus-widget.position-bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .chatguus-toggle {
          position: fixed;
          width: 60px;
          height: 60px;
          background: var(--chatguus-primary-color, #2563eb);
          border-radius: 50%;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          transition: all 0.3s ease;
          color: white;
        }

        .chatguus-toggle.position-bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .chatguus-toggle.position-bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .chatguus-toggle:hover {
          transform: scale(1.1);
        }

        .chatguus-toggle.hidden {
          display: none;
        }

        .chatguus-header {
          background: var(--chatguus-primary-color, #2563eb);
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
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .chatguus-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .chatguus-avatar.emoji {
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
          background: var(--chatguus-primary-color, #2563eb);
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
          border-color: var(--chatguus-primary-color, #2563eb);
        }

        .chatguus-send {
          background: var(--chatguus-primary-color, #2563eb);
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
      \`;
      document.head.appendChild(styles);
      
      // Standalone ChatGuus Widget Class
      class ChatGuusWidget {
        constructor(options = {}) {
          // Get tenant-specific defaults
          const tenantDefaults = window.CHATGUUS_TENANT_CONFIG || {};
          
          // Base defaults
          const baseDefaults = {
            target: '#chatguus-widget',
            webhookUrl: '/.netlify/functions/chat',
            theme: 'koepel',
            welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Ik help je graag met vragen over onze faciliteiten, openingstijden, reserveringen of service requests. Waar kan ik je mee helpen?',
            position: 'bottom-right',
            primaryColor: '#2563eb',
            avatar: '🤖',
            avatarFallback: '🤖',
            tenantId: 'koepel',
            retryAttempts: 2,
            timeoutMs: 8000
          };

          this.options = {
            ...baseDefaults,
            ...tenantDefaults,
            ...options
          };
          
          this.isOpen = false;
          this.sessionId = this.generateSessionId();
          this.messages = [];
          this.isTyping = false;
          this.sessionStart = Date.now();
          
          // Initialize satisfaction rating if available
          if (typeof window !== 'undefined' && window.SatisfactionRating) {
            this.satisfactionRating = new window.SatisfactionRating({
              tenantId: this.options.tenantId
            });
          }
          
          // Initialize AI self-rating system
          this.aiSelfRating = {
            enabled: options.enableAISelfRating !== false,
            confidenceThreshold: options.aiConfidenceThreshold || 0.7
          };
          
          this.init();
        }

        generateSessionId() {
          return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        }

        createAvatarContent() {
          // Check if avatar URL is provided and looks like a URL (http/https or absolute path)
          if (this.options.avatar && (this.options.avatar.startsWith('http') || this.options.avatar.startsWith('/'))) {
            const fallbackAvatar = this.options.avatarFallback || '🤖';
            return \`<img src="\${this.options.avatar}" alt="Guus" onerror="this.parentElement.innerHTML='\${fallbackAvatar}'; this.parentElement.classList.add('emoji');" />\`;
          }
          // Fallback to emoji or provided avatar text
          return this.options.avatar || this.options.avatarFallback || '🤖';
        }

        async init() {
          this.createWidget();
          this.bindEvents();
          this.addWelcomeMessage();
        }

        createWidget() {
          // Set CSS custom property for primary color
          document.documentElement.style.setProperty('--chatguus-primary-color', this.options.primaryColor);
          
          // Create toggle button
          this.toggleButton = document.createElement('button');
          this.toggleButton.className = 'chatguus-toggle position-' + this.options.position;
          this.toggleButton.innerHTML = '💬';
          this.toggleButton.title = 'Chat met Guus';

          // Create widget container
          this.widget = document.createElement('div');
          this.widget.className = 'chatguus-widget position-' + this.options.position;
          // Create avatar content based on options
          const avatarContent = this.createAvatarContent();
          
          this.widget.innerHTML = \`
            <div class="chatguus-header">
              <div class="chatguus-avatar">\${avatarContent}</div>
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
          \`;

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
          if (this.isOpen) {
            // Closing - use same logic as close button
            this.close();
          } else {
            // Opening
            this.isOpen = true;
            this.widget.classList.add('open');
            this.toggleButton.classList.add('hidden');
            this.inputField.focus();
          }
        }

        open() {
          this.isOpen = true;
          this.widget.classList.add('open');
          this.toggleButton.classList.add('hidden');
          this.inputField.focus();
        }

        close() {
          // Check if we should show satisfaction rating before closing
          if (this.shouldShowRatingOnClose()) {
            this.closeWithRating();
            return;
          }
          
          this.performClose();
        }

        shouldShowRatingOnClose() {
          // Don't show rating if already rated or if there's no conversation
          if (this.satisfactionRating && (this.satisfactionRating.hasRated || this.messages.length <= 1)) {
            return false;
          }
          
          // Show rating if user has had a meaningful conversation
          const userMessages = this.messages.filter(m => m.sender === 'user').length;
          const sessionDuration = this.getSessionDuration();
          
          // Show rating if user sent at least 2 messages and session lasted more than 30 seconds
          return userMessages >= 2 && sessionDuration > 30000;
        }

        closeWithRating() {
          // Show satisfaction rating before closing
          if (this.satisfactionRating) {
            this.satisfactionRating.promptForRatingOnClose(this);
          } else {
            this.performClose();
          }
        }

        performClose() {
          this.isOpen = false;
          this.widget.classList.remove('open');
          this.toggleButton.classList.remove('hidden');
        }

        getSessionDuration() {
          return this.sessionStart ? Date.now() - this.sessionStart : 0;
        }

        addWelcomeMessage() {
          if (this.messages.length === 0) {
            this.addMessage(this.options.welcomeMessage, 'bot');
          }
        }

        addMessage(content, sender) {
          const message = {
            id: Date.now(),
            content,
            sender,
            timestamp: new Date()
          };

          this.messages.push(message);
          this.renderMessage(message);
          this.scrollToBottom();
        }

        renderMessage(message) {
          const messageElement = document.createElement('div');
          messageElement.className = \`chatguus-message \${message.sender}\`;
          messageElement.innerHTML = this.formatMessageContent(message.content);
          this.messagesContainer.appendChild(messageElement);
        }

        formatMessageContent(content) {
          return content
            .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\n/g, '<br>')
            .replace(/• /g, '• ');
        }

        showTyping() {
          if (this.isTyping) return;
          
          this.isTyping = true;
          const typingElement = document.createElement('div');
          typingElement.className = 'chatguus-typing';
          typingElement.id = 'chatguus-typing-indicator';
          typingElement.innerHTML = \`
            <span>Guus typt</span>
            <div class="chatguus-typing-dots">
              <div class="chatguus-typing-dot"></div>
              <div class="chatguus-typing-dot"></div>
              <div class="chatguus-typing-dot"></div>
            </div>
          \`;
          
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

          this.addMessage(message, 'user');
          this.inputField.value = '';
          this.sendButton.disabled = true;
          this.showTyping();

          try {
            const response = await this.sendToAPI(message);
            this.hideTyping();
            this.addMessage(response.message, 'bot');
            
            // Generate AI self-rating for this response
            if (this.aiSelfRating.enabled) {
              this.generateAIRating(message, response.message);
            }
            
            if (response.action) {
              this.handleSpecialAction(response.action);
            }
          } catch (error) {
            console.error('ChatGuus Error:', error);
            this.hideTyping();
            this.addMessage('Sorry, er ging iets mis. Probeer het opnieuw of neem direct contact op via welcome@cupolaxs.nl', 'bot');
          }
        }

        async sendToAPI(message) {
          // Convert messages to OpenAI format for context
          const history = this.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

          const payload = {
            message,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            tenantId: this.options.tenantId,
            history: history // Include conversation history
          };

          const response = await fetch(this.options.webhookUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Tenant-ID': this.options.tenantId || 'koepel'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }

          return await response.json();
        }

        handleSpecialAction(action) {
          switch (action.type) {
            case 'complaint_form':
              const urgentText = action.urgent ? ' **URGENT** 🚨' : '';
              this.addMessage(\`**Klacht Afhandeling**\${urgentText}\\n\\nIk begrijp dat je ontevreden bent. Dit nemen we zeer serieus. Ik ga je direct doorverbinden met ons management team. 📋\`, 'bot');
              break;
            case 'compliment_acknowledgment':
              this.addMessage('**Dank je wel!** 🙏\\n\\nWat fijn om te horen dat je tevreden bent! Ik deel dit graag met het team. Heb je nog andere vragen?', 'bot');
              break;
            case 'pricing_info':
              this.addMessage('**Prijsinformatie** 💰\\n\\nIk help je graag met prijsinformatie! Voor de meest actuele tarieven verwijs ik je naar onze website of ik kan je doorverbinden met ons commerciële team.', 'bot');
              break;
            case 'accessibility_info':
              this.addMessage('**Toegankelijkheid** ♿\\n\\nToegankelijkheid is belangrijk voor ons! Ik zorg ervoor dat je alle informatie krijgt over onze voorzieningen. Laat me je doorverbinden met iemand die je precies kan helpen.', 'bot');
              break;
            case 'service_request_form':
              const serviceUrgentText = action.urgent ? ' **SPOED** ⚡' : '';
              this.addMessage(\`**Serviceverzoek**\${serviceUrgentText}\\n\\nIk help je graag! Kun je me meer details geven over je verzoek? 🛠️\`, 'bot');
              break;
            case 'event_inquiry_form':
              this.addMessage('**Event Uitvraag** 🎉\\n\\nLeuk! Vertel me meer over je evenement plannen.', 'bot');
              break;
            case 'event_modification':
              const eventUrgentText = action.urgent ? ' **URGENT** ⚡' : '';
              this.addMessage(\`**Evenement Wijziging**\${eventUrgentText} ✏️\\n\\nIk begrijp dat je een evenement wilt wijzigen of annuleren. Ik zet je direct door naar het juiste team.\`, 'bot');
              break;
            case 'event_info_request':
              this.addMessage('**Evenement Informatie** ℹ️\\n\\nIk help je graag met informatie over bestaande evenementen!', 'bot');
              break;
          }
        }

        scrollToBottom() {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        markIssueResolved() {
          console.log('Issue marked as resolved');
        }

        async generateAIRating(userQuestion, aiResponse) {
          try {
            // Simple AI rating logic (in production, this would be more sophisticated)
            const rating = this.calculateSimpleRating(userQuestion, aiResponse);
            
            const ratingData = {
              id: 'rating_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toISOString(),
              sessionId: this.sessionId,
              tenantId: this.options.tenantId,
              userQuestion: userQuestion,
              aiResponse: aiResponse,
              rating: rating,
              context: {
                messageCount: this.messages.length,
                sessionDuration: this.getSessionDuration()
              }
            };

            // Store the AI rating
            await this.storeAIRating(ratingData);
            
          } catch (error) {
            console.warn('Failed to generate AI rating:', error);
          }
        }

        calculateSimpleRating(question, response) {
          // Simple heuristic-based rating (placeholder for actual AI evaluation)
          let overall = 4.0;
          let confidence = 0.8;
          
          // Adjust based on response characteristics
          if (response.length < 50) {
            overall -= 0.5;
            confidence -= 0.1;
          }
          
          if (response.includes('Sorry') || response.includes('sorry')) {
            overall -= 0.3;
            confidence -= 0.2;
          }
          
          if (response.includes('welcome@cupolaxs.nl')) {
            overall -= 0.2; // Indicates fallback response
            confidence -= 0.3;
          }
          
          return {
            overall: Math.max(1, Math.min(5, overall)),
            accuracy: overall,
            helpfulness: overall,
            completeness: overall - 0.1,
            clarity: overall + 0.1,
            relevance: overall,
            confidence: Math.max(0.1, Math.min(1.0, confidence)),
            category: this.categorizeQuestion(question)
          };
        }

        categorizeQuestion(question) {
          const lowerQuestion = question.toLowerCase();
          
          // Check for complaints and compliments first
          if (lowerQuestion.includes('klacht') || lowerQuestion.includes('ontevreden') || 
              lowerQuestion.includes('slecht') || lowerQuestion.includes('problematisch')) {
            return 'complaint';
          } else if (lowerQuestion.includes('compliment') || lowerQuestion.includes('tevreden') || 
                     lowerQuestion.includes('uitstekend') || lowerQuestion.includes('perfect')) {
            return 'compliment';
          }
          
          // Check for pricing inquiries
          else if (lowerQuestion.includes('prijs') || lowerQuestion.includes('kost') || 
                   lowerQuestion.includes('tarief') || lowerQuestion.includes('budget')) {
            return 'pricing';
          }
          
          // Check for accessibility
          else if (lowerQuestion.includes('rolstoel') || lowerQuestion.includes('toegankelijk') || 
                   lowerQuestion.includes('mindervalide') || lowerQuestion.includes('lift')) {
            return 'accessibility';
          }
          
          // Event-related categories with more specificity
          else if (lowerQuestion.includes('annuleren') || lowerQuestion.includes('afzeggen') || 
                   lowerQuestion.includes('wijzigen') || lowerQuestion.includes('verplaatsen')) {
            return 'event_modification';
          } else if (lowerQuestion.includes('evenement') || lowerQuestion.includes('event')) {
            if (lowerQuestion.includes('organiseren') || lowerQuestion.includes('plannen') || 
                lowerQuestion.includes('boeken') || lowerQuestion.includes('nieuwe')) {
              return 'event_planning';
            } else {
              return 'event_info';
            }
          } else if (lowerQuestion.includes('probleem') || lowerQuestion.includes('defect')) {
            return 'technical_support';
          } else if (lowerQuestion.includes('ruimte') || lowerQuestion.includes('huren')) {
            return 'facilities';
          } else if (lowerQuestion.includes('contact') || lowerQuestion.includes('email')) {
            return 'contact_info';
          } else {
            return 'general';
          }
        }

        async storeAIRating(rating) {
          try {
            const response = await fetch('https://chatguuspt.netlify.app/.netlify/functions/ai-analytics?action=store_ai_rating', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': this.options.tenantId || 'koepel'
              },
              body: JSON.stringify(rating)
            });

            if (!response.ok) {
              throw new Error(\`Failed to store AI rating: \${response.status}\`);
            }

            const result = await response.json();
            console.log('AI rating stored:', result.ratingId);
            
          } catch (error) {
            console.warn('Failed to store AI rating:', error);
            // Don't throw - this shouldn't break the chat flow
          }
        }

        static init(options) {
          const existingWidget = document.querySelector('.chatguus-widget');
          const existingToggle = document.querySelector('.chatguus-toggle');
          
          if (existingWidget) existingWidget.remove();
          if (existingToggle) existingToggle.remove();
          
          return new ChatGuusWidget(options);
        }
      }

      // Global API
      window.ChatGuus = ChatGuusWidget;
      
      // Auto-configure for Netlify
      if (window.ChatGuus) {
        const originalInit = window.ChatGuus.init;
        window.ChatGuus.init = function(options = {}) {
          const netlifyOptions = {
            ...options,
            webhookUrl: window.CHATGUUS_CONFIG.apiEndpoint,
            tenantId: window.CHATGUUS_CONFIG.tenantId,
            fallbackMode: true,
            // Ensure AI rating is enabled by default
            enableAISelfRating: options.enableAISelfRating !== false,
            aiConfidenceThreshold: options.aiConfidenceThreshold || 0.7
          };
          return originalInit(netlifyOptions);
        };
      }
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      },
      body: widgetContent
    };

  } catch (error) {
    console.error('Widget Function Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*'
      },
      body: `
        console.error('ChatGuusPT Widget failed to load:', '${error.message}');
        window.ChatGuus = {
          init: function() {
            console.error('ChatGuusPT Widget not available');
            return null;
          }
        };
      `
    };
  }
};

// Export for Netlify
exports.handler = handler;