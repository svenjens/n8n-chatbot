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
    
    // Build widget with tenant configuration
    const netlifyConfig = {
      apiEndpoint: '/.netlify/functions/chat',
      tenantId: tenantId,
      fallbackMode: true
    };

    // Standalone widget JavaScript with embedded CSS
    const widgetContent = `
      // Netlify Configuration
      window.CHATGUUS_CONFIG = ${JSON.stringify(netlifyConfig)};
      
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
          background: #2563eb;
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
          background: #2563eb;
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
          background: #2563eb;
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
          border-color: #2563eb;
        }

        .chatguus-send {
          background: #2563eb;
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
          this.options = {
            target: '#chatguus-widget',
            webhookUrl: '/.netlify/functions/chat',
            theme: 'koepel',
            welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?',
            position: 'bottom-right',
            primaryColor: '#2563eb',
            tenantId: 'koepel',
            retryAttempts: 2,
            timeoutMs: 8000,
            ...options
          };
          
          this.isOpen = false;
          this.sessionId = this.generateSessionId();
          this.messages = [];
          this.isTyping = false;
          
          this.init();
        }

        generateSessionId() {
          return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        }

        async init() {
          this.createWidget();
          this.bindEvents();
          this.addWelcomeMessage();
        }

        createWidget() {
          // Create toggle button
          this.toggleButton = document.createElement('button');
          this.toggleButton.className = 'chatguus-toggle position-' + this.options.position;
          this.toggleButton.innerHTML = '💬';
          this.toggleButton.title = 'Chat met Guus';

          // Create widget container
          this.widget = document.createElement('div');
          this.widget.className = 'chatguus-widget position-' + this.options.position;
          this.widget.innerHTML = \`
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
          this.isOpen = !this.isOpen;
          this.widget.classList.toggle('open', this.isOpen);
          this.toggleButton.classList.toggle('hidden', this.isOpen);
          
          if (this.isOpen) {
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
          this.isOpen = false;
          this.widget.classList.remove('open');
          this.toggleButton.classList.remove('hidden');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }

          return await response.json();
        }

        handleSpecialAction(action) {
          switch (action.type) {
            case 'service_request_form':
              this.addMessage('**Serviceverzoek Formulier**\\n\\nIk help je graag! Kun je me meer details geven over je verzoek? 🛠️', 'bot');
              break;
            case 'event_inquiry_form':
              this.addMessage('**Event Uitvraag** 🎉\\n\\nLeuk! Vertel me meer over je evenement plannen.', 'bot');
              break;
          }
        }

        scrollToBottom() {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        markIssueResolved() {
          console.log('Issue marked as resolved');
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
            fallbackMode: true
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