/**
 * ChatGuusPT - Embeddable Chat Widget
 * Vriendelijke chatbot voor de Koepel zakelijke gebruikers
 */

class ChatGuusWidget {
  constructor(options = {}) {
    this.options = {
      target: '#chatguus-widget',
      webhookUrl: options.webhookUrl || process.env.N8N_WEBHOOK_URL,
      theme: 'koepel',
      welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?',
      position: 'bottom-right',
      primaryColor: '#2563eb',
      avatar: '/assets/guus-avatar.png',
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

  init() {
    this.createStyles();
    this.createWidget();
    this.bindEvents();
    this.addWelcomeMessage();
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
    this.addMessage(this.options.welcomeMessage, 'bot');
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
    messageElement.textContent = message.content;
    
    this.messagesContainer.appendChild(messageElement);
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

    // Add user message
    this.addMessage(message, 'user');
    this.inputField.value = '';
    this.sendButton.disabled = true;

    // Show typing indicator
    this.showTyping();

    try {
      // Send to N8N webhook
      const response = await this.sendToN8N(message);
      
      // Hide typing and show response
      this.hideTyping();
      this.addMessage(response.message, 'bot');
      
      // Handle any special actions (email routing, etc.)
      if (response.action) {
        this.handleSpecialAction(response.action);
      }
      
    } catch (error) {
      console.error('ChatGuus Error:', error);
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
      url: window.location.href
    };

    const response = await fetch(this.options.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
    const formMessage = `
      <div class="service-request-form">
        <p><strong>Serviceverzoek Formulier</strong></p>
        <p>Ik help je graag met je serviceverzoek. Kun je me de volgende informatie geven?</p>
        <ul>
          <li>Wat is de aard van je verzoek?</li>
          <li>Wanneer moet dit uitgevoerd worden?</li>
          <li>Zijn er specifieke vereisten?</li>
        </ul>
        <p>Geef zoveel mogelijk details, dan kan ik je verzoek direct naar het juiste team doorsturen!</p>
      </div>
    `;
    this.addMessage(formMessage, 'bot');
  }

  showEventInquiryForm() {
    const eventMessage = `
      <div class="event-inquiry-form">
        <p><strong>Nieuwe Event Uitvraag</strong></p>
        <p>Leuk dat je een evenement wilt organiseren in de Koepel! Ik heb wat informatie nodig:</p>
        <ul>
          <li>🎉 <strong>Type evenement:</strong> Wat voor soort evenement is het?</li>
          <li>🏢 <strong>Waarom de Koepel:</strong> Wat trekt je aan in onze locatie?</li>
          <li>👥 <strong>Aantal personen:</strong> Hoeveel gasten verwacht je?</li>
          <li>💰 <strong>Budget:</strong> Wat is je budget indicatie?</li>
          <li>📅 <strong>Datum:</strong> Wanneer wil je het evenement houden?</li>
        </ul>
        <p>Vertel me meer over je plannen!</p>
      </div>
    `;
    this.addMessage(eventMessage, 'bot');
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // Public API methods
  static init(options) {
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
