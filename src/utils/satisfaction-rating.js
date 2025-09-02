/**
 * Chat Satisfaction Rating System
 * Collects user feedback and measures support quality
 */

export class SatisfactionRating {
  constructor(options = {}) {
    this.options = {
      enableRating: true,
      autoPrompt: true,
      promptDelay: 120000, // 2 minutes after conversation start
      minMessages: 6, // Minimum messages before prompting (more realistic)
      ratingScale: 5, // 1-5 star rating
      collectFeedback: true,
      storageKey: 'chatguus_ratings',
      language: 'nl', // Default to Dutch
      ...options
    };
    
    this.currentSession = null;
    this.hasRated = false;
    this.ratingPromptShown = false;
    
    // Initialize language pack
    this.lang = this.getLanguagePack(this.options.language);
  }

  getLanguagePack(language) {
    const languages = {
      'nl': {
        title: 'Hoe was je ervaring?',
        subtitle: 'Je feedback helpt ons onze service te verbeteren',
        placeholder: 'Vertel ons meer over je ervaring (optioneel)...',
        skipButton: 'Overslaan',
        submitButton: 'Verstuur Feedback',
        thankYouTitle: 'Bedankt voor je feedback!',
        thankYouMessage: 'We waarderen het dat je de tijd hebt genomen om ons te helpen verbeteren.',
        labels: {
          1: 'Slecht 😞',
          2: 'Matig 😕', 
          3: 'Oké 😐',
          4: 'Goed 😊',
          5: 'Uitstekend 🤩'
        },
        categories: {
          helpful: 'Behulpzaam 👍',
          unhelpful: 'Niet behulpzaam 👎',
          slow: 'Te langzaam ⏰',
          fast: 'Snel geholpen ⚡',
          unclear: 'Onduidelijk 🤔',
          bug: 'Technisch probleem 🐛',
          suggestion: 'Suggestie 💡'
        }
      },
      'en': {
        title: 'How was your experience?',
        subtitle: 'Your feedback helps us improve our service',
        placeholder: 'Tell us more about your experience (optional)...',
        skipButton: 'Skip',
        submitButton: 'Submit Feedback',
        thankYouTitle: 'Thank you for your feedback!',
        thankYouMessage: 'We appreciate you taking the time to help us improve.',
        labels: {
          1: 'Poor 😞',
          2: 'Fair 😕', 
          3: 'Good 😐',
          4: 'Very Good 😊',
          5: 'Excellent 🤩'
        },
        categories: {
          helpful: 'Helpful 👍',
          unhelpful: 'Not helpful 👎',
          slow: 'Too slow ⏰',
          fast: 'Quick help ⚡',
          unclear: 'Unclear 🤔',
          bug: 'Bug report 🐛',
          suggestion: 'Suggestion 💡'
        }
      }
    };
    
    return languages[language] || languages['nl'];
  }

  initializeSession(sessionId, tenantId) {
    this.currentSession = {
      id: sessionId,
      tenantId: tenantId,
      startTime: Date.now(),
      messageCount: 0,
      interactions: [],
      resolved: false,
      escalated: false
    };
  }

  trackInteraction(type, data = {}) {
    if (!this.currentSession) return;
    
    this.currentSession.interactions.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    if (type === 'user_message') {
      this.currentSession.messageCount++;
    }
    
    if (type === 'issue_resolved') {
      this.currentSession.resolved = true;
    }
    
    if (type === 'escalated_to_human') {
      this.currentSession.escalated = true;
    }
  }

  shouldPromptRating() {
    if (!this.options.enableRating || this.hasRated || this.ratingPromptShown) {
      return false;
    }
    
    if (!this.currentSession || this.currentSession.messageCount < this.options.minMessages) {
      return false;
    }
    
    const sessionDuration = Date.now() - this.currentSession.startTime;
    const hasMinimumDuration = sessionDuration > this.options.promptDelay;
    
    // Only prompt if there's been some inactivity (no messages in last 30 seconds)
    const lastInteractionTime = this.currentSession.interactions?.slice(-1)[0]?.timestamp || this.currentSession.startTime;
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    const hasInactivity = timeSinceLastInteraction > 30000; // 30 seconds of inactivity
    
    return hasMinimumDuration && hasInactivity;
  }

  createRatingInterface() {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'satisfaction-rating';
    ratingContainer.innerHTML = `
      <div class="rating-header">
        <h4>${this.lang.title} ⭐</h4>
        <p>${this.lang.subtitle}</p>
      </div>
      
      <div class="rating-stars">
        ${Array.from({length: this.options.ratingScale}, (_, i) => 
          `<button class="star-button" data-rating="${i + 1}">
            <span class="star">⭐</span>
            <span class="star-label">${this.lang.labels[i + 1]}</span>
          </button>`
        ).join('')}
      </div>
      
      <div class="rating-feedback" style="display: none;">
        <textarea 
          placeholder="${this.lang.placeholder}"
          maxlength="500"
          rows="3"
        ></textarea>
        <div class="feedback-categories">
          ${Object.entries(this.lang.categories).map(([key, label]) => 
            `<button class="feedback-category" data-category="${key}">${label}</button>`
          ).join('')}
        </div>
        <div class="feedback-buttons">
          <button class="skip-feedback">${this.lang.skipButton}</button>
          <button class="submit-feedback">${this.lang.submitButton}</button>
        </div>
      </div>
      
      <div class="rating-thanks" style="display: none;">
        <div class="thanks-icon">🙏</div>
        <h4>${this.lang.thankYouTitle}</h4>
        <p>${this.lang.thankYouMessage}</p>
      </div>
    `;
    
    this.bindRatingEvents(ratingContainer);
    return ratingContainer;
  }

  bindRatingEvents(container) {
    const stars = container.querySelectorAll('.star-button');
    const feedbackSection = container.querySelector('.rating-feedback');
    const thanksSection = container.querySelector('.rating-thanks');
    const textarea = container.querySelector('textarea');
    const skipButton = container.querySelector('.skip-feedback');
    const submitButton = container.querySelector('.submit-feedback');
    
    let selectedRating = 0;
    
    // Star rating interaction
    stars.forEach((star, index) => {
      star.addEventListener('mouseenter', () => {
        this.highlightStars(stars, index + 1);
      });
      
      star.addEventListener('mouseleave', () => {
        this.highlightStars(stars, selectedRating);
      });
      
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        this.highlightStars(stars, selectedRating);
        
        // Show feedback section for ratings <= 3
        if (selectedRating <= 3) {
          feedbackSection.style.display = 'block';
          textarea.focus();
        } else {
          // High rating - submit immediately
          this.submitRating(selectedRating, '', container);
        }
      });
    });
    
    // Feedback submission
    skipButton.addEventListener('click', () => {
      this.submitRating(selectedRating, '', container);
    });
    
    submitButton.addEventListener('click', () => {
      const feedback = textarea.value.trim();
      this.submitRating(selectedRating, feedback, container);
    });
    
    // Enter key to submit
    textarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        const feedback = textarea.value.trim();
        this.submitRating(selectedRating, feedback, container);
      }
    });
  }

  highlightStars(stars, rating) {
    stars.forEach((star, index) => {
      const isActive = index < rating;
      star.classList.toggle('active', isActive);
      star.style.opacity = isActive ? '1' : '0.3';
      star.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
    });
  }

  getStarLabel(rating) {
    return this.lang.labels[rating] || '';
  }

  async submitRating(rating, feedback, container) {
    this.hasRated = true;
    
    const ratingData = {
      sessionId: this.currentSession?.id,
      tenantId: this.currentSession?.tenantId,
      rating: rating,
      feedback: feedback,
      timestamp: new Date().toISOString(),
      
      // Session context
      sessionDuration: this.currentSession ? Date.now() - this.currentSession.startTime : 0,
      messageCount: this.currentSession?.messageCount || 0,
      wasResolved: this.currentSession?.resolved || false,
      wasEscalated: this.currentSession?.escalated || false,
      
      // User context
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      
      // Interaction analysis
      interactions: this.currentSession?.interactions || []
    };
    
    try {
      // Send to analytics endpoint
      await this.sendRatingData(ratingData);
      
      // Store locally for analytics
      this.storeRatingLocally(ratingData);
      
      // Show thank you message
      this.showThanksMessage(container, rating, feedback);
      
      // Track the rating event
      if (window.chatGuusFingerprinting) {
        window.chatGuusFingerprinting.trackEvent('satisfaction_rating', {
          rating,
          hasFeedback: !!feedback,
          sessionDuration: ratingData.sessionDuration,
          messageCount: ratingData.messageCount,
          wasResolved: ratingData.wasResolved
        });
      }
      
    } catch (error) {
      console.error('Failed to submit rating:', error);
      this.showErrorMessage(container);
    }
  }

  async sendRatingData(ratingData) {
    const response = await fetch('/.netlify/functions/satisfaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratingData)
    });
    
    if (!response.ok) {
      throw new Error(`Rating submission failed: ${response.status}`);
    }
    
    return response.json();
  }

  storeRatingLocally(ratingData) {
    try {
      const existingRatings = JSON.parse(localStorage.getItem(this.options.storageKey) || '[]');
      existingRatings.push(ratingData);
      
      // Keep only last 50 ratings
      const recentRatings = existingRatings.slice(-50);
      localStorage.setItem(this.options.storageKey, JSON.stringify(recentRatings));
      
    } catch (error) {
      console.warn('Failed to store rating locally:', error);
    }
  }

  showThanksMessage(container, rating, feedback) {
    const thanksSection = container.querySelector('.rating-thanks');
    const thanksMessage = container.querySelector('.rating-thanks p');
    
    // Customize thank you message based on rating
    if (rating >= 4) {
      thanksMessage.textContent = "We're thrilled you had a great experience! 🎉";
    } else if (rating === 3) {
      thanksMessage.textContent = "Thanks for your feedback! We'll work to improve your next experience.";
    } else {
      thanksMessage.textContent = "We're sorry we didn't meet your expectations. Your feedback helps us improve.";
    }
    
    // Hide other sections and show thanks
    container.querySelector('.rating-header').style.display = 'none';
    container.querySelector('.rating-stars').style.display = 'none';
    container.querySelector('.rating-feedback').style.display = 'none';
    thanksSection.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 300);
    }, 5000);
  }

  showErrorMessage(container) {
    container.innerHTML = `
      <div class="rating-error">
        <div class="error-icon">⚠️</div>
        <h4>Oops! Something went wrong</h4>
        <p>We couldn't submit your rating right now. Please try again later.</p>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
  }

  // Analytics and reporting methods
  getLocalRatings() {
    try {
      return JSON.parse(localStorage.getItem(this.options.storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  calculateSatisfactionMetrics() {
    const ratings = this.getLocalRatings();
    
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: {},
        trends: {}
      };
    }
    
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    // Rating distribution
    const distribution = {};
    for (let i = 1; i <= this.options.ratingScale; i++) {
      distribution[i] = ratings.filter(r => r.rating === i).length;
    }
    
    // Trends over time
    const last30Days = ratings.filter(r => 
      Date.now() - new Date(r.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    );
    
    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings: ratings.length,
      distribution,
      last30Days: {
        count: last30Days.length,
        average: last30Days.length > 0 ? 
          Math.round((last30Days.reduce((sum, r) => sum + r.rating, 0) / last30Days.length) * 100) / 100 : 0
      },
      satisfaction: {
        satisfied: ratings.filter(r => r.rating >= 4).length,
        neutral: ratings.filter(r => r.rating === 3).length,
        unsatisfied: ratings.filter(r => r.rating <= 2).length
      }
    };
  }

  // Proactive rating prompts
  shouldShowProactiveRating(conversationContext) {
    const { messageCount, hasIssue, issueResolved, sessionDuration } = conversationContext;
    
    // Don't prompt if already rated
    if (this.hasRated || this.ratingPromptShown) return false;
    
    // Prompt conditions
    const conditions = [
      // Issue was resolved
      hasIssue && issueResolved,
      
      // Long conversation (likely complex issue)
      messageCount >= 5 && sessionDuration > 120000, // 2 minutes
      
      // User expressed satisfaction
      this.detectSatisfactionKeywords(conversationContext.lastMessage),
      
      // Natural conversation end
      this.detectConversationEnd(conversationContext.lastMessage)
    ];
    
    return conditions.some(condition => condition);
  }

  detectSatisfactionKeywords(message) {
    const satisfactionKeywords = [
      'thank', 'thanks', 'perfect', 'great', 'awesome', 'helpful',
      'solved', 'fixed', 'resolved', 'exactly', 'brilliant'
    ];
    
    const dissatisfactionKeywords = [
      'frustrated', 'annoying', 'useless', 'unhelpful', 'waste',
      'terrible', 'awful', 'disappointing', 'confusing'
    ];
    
    const messageLower = message.toLowerCase();
    
    const hasSatisfaction = satisfactionKeywords.some(word => messageLower.includes(word));
    const hasDissatisfaction = dissatisfactionKeywords.some(word => messageLower.includes(word));
    
    return hasSatisfaction && !hasDissatisfaction;
  }

  detectConversationEnd(message) {
    const endKeywords = [
      'bye', 'goodbye', 'thanks', 'that\'s all', 'perfect',
      'got it', 'understood', 'clear', 'makes sense'
    ];
    
    return endKeywords.some(word => message.toLowerCase().includes(word));
  }

  createRatingPrompt() {
    return {
      message: "How was your experience today? Your feedback helps us improve! ⭐",
      type: 'rating_prompt',
      showRating: true,
      ratingConfig: {
        scale: this.options.ratingScale,
        labels: this.getStarLabels(),
        collectFeedback: this.options.collectFeedback
      }
    };
  }

  // Auto-detect language from browser or tenant settings
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

  // Rating UI creation for widget
  createRatingUI() {
    const ratingHTML = `
      <div class="satisfaction-rating-widget">
        <div class="rating-prompt">
          <div class="rating-header">
            <span class="rating-emoji">⭐</span>
            <h4>${this.lang.title}</h4>
            <p>${this.lang.subtitle}</p>
          </div>
          
          <div class="rating-stars">
            ${Array.from({length: this.options.ratingScale}, (_, i) => 
              `<button class="rating-star" data-rating="${i + 1}" title="${this.lang.labels[i + 1]}">
                <span class="star-icon">⭐</span>
              </button>`
            ).join('')}
          </div>
        </div>
        
        <div class="feedback-section" style="display: none;">
          <h5>${this.lang.placeholder.split('(')[0]}</h5>
          <div class="feedback-categories">
            ${Object.entries(this.lang.categories).map(([key, label]) => 
              `<button class="feedback-category" data-category="${key}">${label}</button>`
            ).join('')}
          </div>
          
          <textarea 
            class="feedback-text"
            placeholder="${this.lang.placeholder}"
            maxlength="500"
            rows="3"
          ></textarea>
          
          <div class="feedback-actions">
            <button class="skip-btn">${this.lang.skipButton}</button>
            <button class="submit-btn">${this.lang.submitButton}</button>
          </div>
        </div>
        
        <div class="rating-complete" style="display: none;">
          <div class="complete-icon">🙏</div>
          <h4>${this.lang.thankYouTitle}</h4>
          <p class="complete-message">${this.lang.thankYouMessage}</p>
        </div>
      </div>
    `;
    
    return ratingHTML;
  }

  // CSS styles for rating widget
  getRatingStyles() {
    return `
      .satisfaction-rating-widget {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        font-family: inherit;
        animation: slideInUp 0.3s ease-out;
      }
      
      .rating-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      
      .rating-emoji {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }
      
      .rating-header h4 {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
        font-size: 1.1rem;
      }
      
      .rating-header p {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      
      .rating-stars {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .rating-star {
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        opacity: 0.3;
      }
      
      .rating-star:hover,
      .rating-star.active {
        opacity: 1;
        transform: scale(1.2);
      }
      
      .rating-star:hover {
        background: rgba(59, 130, 246, 0.1);
      }
      
      .feedback-section {
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        margin-top: 1rem;
      }
      
      .feedback-section h5 {
        margin: 0 0 1rem 0;
        color: #374151;
        font-size: 1rem;
      }
      
      .feedback-categories {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .feedback-category {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .feedback-category:hover {
        background: #e5e7eb;
      }
      
      .feedback-category.selected {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .feedback-text {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.75rem;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
        margin-bottom: 1rem;
      }
      
      .feedback-text:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .feedback-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
      
      .skip-btn {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
      }
      
      .skip-btn:hover {
        background: #e5e7eb;
      }
      
      .submit-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: background 0.2s;
      }
      
      .submit-btn:hover {
        background: #2563eb;
      }
      
      .rating-complete {
        text-align: center;
        padding: 1rem;
      }
      
      .complete-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .rating-complete h4 {
        margin: 0 0 0.5rem 0;
        color: #059669;
        font-size: 1.2rem;
      }
      
      .complete-message {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .satisfaction-rating-widget {
          padding: 1rem;
        }
        
        .rating-stars {
          gap: 0.25rem;
        }
        
        .rating-star {
          font-size: 1.5rem;
        }
        
        .feedback-categories {
          justify-content: center;
        }
        
        .feedback-actions {
          justify-content: center;
        }
      }
    `;
  }

  // Integration with chat widget
  integrateWithChatWidget(chatWidget) {
    // Add rating styles to widget
    const ratingStyles = document.createElement('style');
    ratingStyles.textContent = this.getRatingStyles();
    document.head.appendChild(ratingStyles);
    
    // Monitor conversation for rating opportunities
    const originalAddMessage = chatWidget.addMessage.bind(chatWidget);
    chatWidget.addMessage = (message, sender, options = {}) => {
      // Call original method
      const result = originalAddMessage(message, sender, options);
      
      // Track interaction
      this.trackInteraction(sender === 'user' ? 'user_message' : 'bot_message', {
        message: message.substring(0, 100), // First 100 chars for analysis
        timestamp: Date.now()
      });
      
      // Check if we should prompt for rating (only after bot responses and with delay)
      if (sender === 'bot') {
        // Check for rating prompt after a longer delay to avoid interrupting active conversations
        setTimeout(() => {
          if (this.shouldPromptRating()) {
            this.promptForRating(chatWidget);
          }
        }, 30000); // Wait 30 seconds after bot response to see if conversation continues
      }
      
      return result;
    };
    
    // Track when issues are marked as resolved
    chatWidget.markIssueResolved = () => {
      this.trackInteraction('issue_resolved');
      setTimeout(() => {
        this.promptForRating(chatWidget);
      }, 1000);
    };
    
    // Track escalations
    chatWidget.escalateToHuman = (reason) => {
      this.trackInteraction('escalated_to_human', { reason });
    };
  }

  promptForRating(chatWidget) {
    if (this.ratingPromptShown) return;
    
    this.ratingPromptShown = true;
    
    // Add rating UI to chat
    const ratingUI = this.createRatingUI();
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message rating-message';
    messageElement.innerHTML = ratingUI;
    
    chatWidget.messagesContainer.appendChild(messageElement);
    chatWidget.scrollToBottom();
    
    // Bind rating events
    this.bindRatingEventsToWidget(messageElement, chatWidget);
  }

  promptForRatingOnClose(chatWidget) {
    if (this.ratingPromptShown || this.hasRated) return;
    
    this.ratingPromptShown = true;
    
    // Create a special close-rating overlay
    const overlay = document.createElement('div');
    overlay.className = 'chatguus-rating-overlay';
    overlay.innerHTML = `
      <div class="rating-close-dialog">
        <div class="rating-header">
          <h3>Voordat je gaat... 👋</h3>
          <p>Hoe vond je je ervaring met Guus?</p>
        </div>
        
        <div class="rating-stars">
          ${Array.from({length: this.options.ratingScale}, (_, i) => 
            `<button class="rating-star" data-rating="${i + 1}" title="${this.lang.labels[i + 1]}">
              <span class="star-icon">⭐</span>
              <span class="star-label">${this.lang.labels[i + 1]}</span>
            </button>`
          ).join('')}
        </div>
        
        <div class="rating-actions">
          <button class="skip-rating">Overslaan</button>
          <button class="close-anyway">Sluiten zonder rating</button>
        </div>
        
        <div class="feedback-section" style="display: none;">
          <textarea 
            class="feedback-text"
            placeholder="${this.lang.placeholder}"
            maxlength="300"
            rows="2"
          ></textarea>
          <div class="feedback-buttons">
            <button class="submit-and-close">Verstuur & Sluit</button>
          </div>
        </div>
      </div>
    `;
    
    // Add overlay to widget
    chatWidget.widget.appendChild(overlay);
    
    // Bind events for close rating
    this.bindCloseRatingEvents(overlay, chatWidget);
    
    // Add styles if not already added
    if (!document.getElementById('close-rating-styles')) {
      this.addCloseRatingStyles();
    }
  }

  bindCloseRatingEvents(overlay, chatWidget) {
    const stars = overlay.querySelectorAll('.rating-star');
    const skipBtn = overlay.querySelector('.skip-rating');
    const closeBtn = overlay.querySelector('.close-anyway');
    const feedbackSection = overlay.querySelector('.feedback-section');
    const textarea = overlay.querySelector('.feedback-text');
    const submitBtn = overlay.querySelector('.submit-and-close');
    
    let selectedRating = 0;
    
    // Star rating
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        this.highlightStars(stars, selectedRating);
        
        // Show feedback for lower ratings
        if (selectedRating <= 3) {
          feedbackSection.style.display = 'block';
          textarea.focus();
        } else {
          // High rating - submit immediately and close
          this.submitCloseRating(selectedRating, '', overlay, chatWidget);
        }
      });
    });
    
    // Skip rating
    skipBtn.addEventListener('click', () => {
      overlay.remove();
      chatWidget.performClose();
    });
    
    // Close without rating
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      chatWidget.performClose();
    });
    
    // Submit with feedback
    submitBtn.addEventListener('click', () => {
      const feedback = textarea.value.trim();
      this.submitCloseRating(selectedRating, feedback, overlay, chatWidget);
    });
  }

  async submitCloseRating(rating, feedback, overlay, chatWidget) {
    const ratingData = {
      sessionId: chatWidget.sessionId,
      tenantId: chatWidget.options.tenantId,
      rating,
      feedback,
      timestamp: new Date().toISOString(),
      context: 'close_dialog',
      
      // Session context
      sessionDuration: chatWidget.getSessionDuration(),
      messageCount: chatWidget.messages.length,
      userMessages: chatWidget.messages.filter(m => m.sender === 'user').length
    };
    
    try {
      // Submit rating
      await this.sendRatingData(ratingData);
      this.storeRatingLocally(ratingData);
      this.hasRated = true;
      
      // Show brief thanks and close
      overlay.innerHTML = `
        <div class="rating-thanks-close">
          <div class="thanks-icon">🙏</div>
          <h4>Bedankt voor je feedback!</h4>
          <p>We waarderen je tijd.</p>
        </div>
      `;
      
      // Close after brief delay
      setTimeout(() => {
        overlay.remove();
        chatWidget.performClose();
      }, 1500);
      
      // Track the rating
      if (chatWidget.userFingerprinting) {
        chatWidget.trackEvent('satisfaction_close_rating', {
          rating,
          hasFeedback: !!feedback,
          sessionDuration: ratingData.sessionDuration
        });
      }
      
    } catch (error) {
      console.error('Close rating submission failed:', error);
      overlay.innerHTML = `
        <div class="rating-error-close">
          <span>⚠️</span>
          <p>Kon rating niet versturen</p>
          <button onclick="this.parentElement.parentElement.remove(); chatWidget.performClose();">Sluit anyway</button>
        </div>
      `;
    }
  }

  addCloseRatingStyles() {
    const styles = document.createElement('style');
    styles.id = 'close-rating-styles';
    styles.textContent = `
      .chatguus-rating-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease-out;
      }
      
      .rating-close-dialog {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 320px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }
      
      .rating-close-dialog .rating-header h3 {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
        font-size: 1.2rem;
      }
      
      .rating-close-dialog .rating-header p {
        margin: 0 0 1.5rem 0;
        color: #6b7280;
        font-size: 0.95rem;
      }
      
      .rating-close-dialog .rating-stars {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      
      .rating-close-dialog .rating-star {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 8px;
        transition: all 0.2s ease;
        opacity: 0.4;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }
      
      .rating-close-dialog .rating-star:hover,
      .rating-close-dialog .rating-star.active {
        opacity: 1;
        background: rgba(59, 130, 246, 0.1);
        transform: scale(1.1);
      }
      
      .rating-close-dialog .star-icon {
        font-size: 1.5rem;
      }
      
      .rating-close-dialog .star-label {
        font-size: 0.7rem;
        color: #6b7280;
        white-space: nowrap;
      }
      
      .rating-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        margin-top: 1rem;
      }
      
      .rating-actions button {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #f9fafb;
        color: #374151;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
      }
      
      .rating-actions button:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }
      
      .close-anyway {
        background: #fee2e2 !important;
        color: #dc2626 !important;
        border-color: #fecaca !important;
      }
      
      .close-anyway:hover {
        background: #fecaca !important;
      }
      
      .feedback-section {
        border-top: 1px solid #e5e7eb;
        padding-top: 1rem;
        margin-top: 1rem;
      }
      
      .feedback-text {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
        margin-bottom: 1rem;
      }
      
      .feedback-text:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .submit-and-close {
        background: #3b82f6 !important;
        color: white !important;
        border-color: #3b82f6 !important;
        font-weight: 500;
      }
      
      .submit-and-close:hover {
        background: #2563eb !important;
      }
      
      .rating-thanks-close {
        text-align: center;
        padding: 1rem;
      }
      
      .rating-thanks-close .thanks-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }
      
      .rating-thanks-close h4 {
        margin: 0 0 0.5rem 0;
        color: #059669;
        font-size: 1.1rem;
      }
      
      .rating-thanks-close p {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      
      .rating-error-close {
        text-align: center;
        padding: 1rem;
      }
      
      .rating-error-close span {
        font-size: 2rem;
        display: block;
        margin-bottom: 1rem;
      }
      
      .rating-error-close button {
        background: #6b7280;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 1rem;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @media (max-width: 480px) {
        .rating-close-dialog {
          padding: 1.5rem;
        }
        
        .rating-close-dialog .rating-stars {
          gap: 0.25rem;
        }
        
        .rating-close-dialog .star-icon {
          font-size: 1.2rem;
        }
        
        .rating-actions {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  bindRatingEventsToWidget(container, chatWidget) {
    const stars = container.querySelectorAll('.rating-star');
    const feedbackSection = container.querySelector('.feedback-section');
    const categories = container.querySelectorAll('.feedback-category');
    const textarea = container.querySelector('.feedback-text');
    const skipBtn = container.querySelector('.skip-btn');
    const submitBtn = container.querySelector('.submit-btn');
    
    let selectedRating = 0;
    let selectedCategories = [];
    
    // Star rating
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        this.highlightStars(stars, selectedRating);
        
        // Show feedback for lower ratings or always if configured
        if (selectedRating <= 3 || this.options.collectFeedback) {
          feedbackSection.style.display = 'block';
          
          // Auto-scroll to feedback section
          setTimeout(() => {
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        } else {
          // High rating - submit immediately with positive message
          this.submitWidgetRating(selectedRating, '', [], container, chatWidget);
        }
      });
    });
    
    // Feedback categories
    categories.forEach(category => {
      category.addEventListener('click', () => {
        const categoryValue = category.dataset.category;
        
        if (selectedCategories.includes(categoryValue)) {
          selectedCategories = selectedCategories.filter(c => c !== categoryValue);
          category.classList.remove('selected');
        } else {
          selectedCategories.push(categoryValue);
          category.classList.add('selected');
        }
      });
    });
    
    // Submit buttons
    skipBtn.addEventListener('click', () => {
      this.submitWidgetRating(selectedRating, '', selectedCategories, container, chatWidget);
    });
    
    submitBtn.addEventListener('click', () => {
      const feedback = textarea.value.trim();
      this.submitWidgetRating(selectedRating, feedback, selectedCategories, container, chatWidget);
    });
  }

  async submitWidgetRating(rating, feedback, categories, container, chatWidget) {
    const ratingData = {
      sessionId: this.currentSession?.id,
      tenantId: this.currentSession?.tenantId,
      rating,
      feedback,
      categories,
      timestamp: new Date().toISOString(),
      
      // Enhanced context
      sessionDuration: this.currentSession ? Date.now() - this.currentSession.startTime : 0,
      messageCount: this.currentSession?.messageCount || 0,
      wasResolved: this.currentSession?.resolved || false,
      wasEscalated: this.currentSession?.escalated || false,
      interactions: this.currentSession?.interactions || []
    };
    
    try {
      // Submit rating
      await this.sendRatingData(ratingData);
      this.storeRatingLocally(ratingData);
      
      // Show success message
      this.showWidgetThanks(rating, container, chatWidget);
      
      // Track rating submission
      if (window.chatGuusFingerprinting) {
        window.chatGuusFingerprinting.trackEvent('satisfaction_submitted', {
          rating,
          hasFeedback: !!feedback,
          categoryCount: categories.length,
          sessionDuration: ratingData.sessionDuration
        });
      }
      
    } catch (error) {
      console.error('Rating submission failed:', error);
      this.showWidgetError(container, chatWidget);
    }
  }

  showWidgetThanks(rating, container, chatWidget) {
    const completeSection = container.querySelector('.rating-complete');
    const completeMessage = container.querySelector('.complete-message');
    
    // Hide other sections
    container.querySelector('.rating-prompt').style.display = 'none';
    container.querySelector('.feedback-section').style.display = 'none';
    
    // Customize message based on rating
    if (rating >= 4) {
      completeMessage.textContent = "We're so glad we could help! 🎉";
      
      // Add follow-up message for high ratings
      setTimeout(() => {
        chatWidget.addMessage(
          "Since you had a great experience, would you mind leaving us a review? It really helps other customers! 🌟",
          'bot'
        );
      }, 2000);
      
    } else if (rating === 3) {
      completeMessage.textContent = "Thanks for your feedback! We'll work to improve.";
    } else {
      completeMessage.textContent = "We're sorry we didn't meet your expectations. We'll do better!";
      
      // Offer human support for low ratings
      setTimeout(() => {
        chatWidget.addMessage(
          "Would you like to speak with a human agent who can better assist you? I can connect you right away! 👨‍💼",
          'bot'
        );
      }, 2000);
    }
    
    completeSection.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 300);
    }, 4000);
  }

  showWidgetError(container, chatWidget) {
    container.innerHTML = `
      <div class="rating-error">
        <span style="font-size: 2rem;">⚠️</span>
        <h4>Couldn't submit rating</h4>
        <p>Please try again later</p>
      </div>
    `;
    
    setTimeout(() => container.remove(), 3000);
  }

  // Analytics dashboard data
  generateAnalyticsReport() {
    const metrics = this.calculateSatisfactionMetrics();
    const ratings = this.getLocalRatings();
    
    return {
      summary: {
        averageRating: metrics.averageRating,
        totalRatings: metrics.totalRatings,
        satisfactionRate: Math.round((metrics.satisfaction.satisfied / metrics.totalRatings) * 100),
        responseRate: this.calculateResponseRate()
      },
      
      trends: {
        last7Days: this.getTrendData(7),
        last30Days: this.getTrendData(30),
        last90Days: this.getTrendData(90)
      },
      
      insights: {
        commonFeedback: this.analyzeCommonFeedback(ratings),
        improvementAreas: this.identifyImprovementAreas(ratings),
        successFactors: this.identifySuccessFactors(ratings)
      },
      
      segmentation: {
        byTenant: this.segmentByTenant(ratings),
        byDevice: this.segmentByDevice(ratings),
        bySessionLength: this.segmentBySessionLength(ratings)
      }
    };
  }

  calculateResponseRate() {
    // Estimate based on sessions vs ratings
    const totalSessions = this.estimateTotalSessions();
    const totalRatings = this.getLocalRatings().length;
    
    return totalSessions > 0 ? Math.round((totalRatings / totalSessions) * 100) : 0;
  }

  estimateTotalSessions() {
    // Estimate from stored session data or analytics
    try {
      const sessionData = localStorage.getItem('chatguus_sessions') || '[]';
      return JSON.parse(sessionData).length;
    } catch {
      return this.getLocalRatings().length * 2; // Rough estimate
    }
  }
}

// Utility functions  
export function createSatisfactionRating(options = {}) {
  return new SatisfactionRating(options);
}

export function promptForRating(chatWidget, delay = 2000) {
  if (!window.chatGuusSatisfaction) {
    window.chatGuusSatisfaction = new SatisfactionRating();
  }
  
  setTimeout(() => {
    window.chatGuusSatisfaction.promptForRating(chatWidget);
  }, delay);
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.chatGuusSatisfaction) {
      window.chatGuusSatisfaction = new SatisfactionRating({
        enableRating: true,
        autoPrompt: true,
        collectFeedback: true
      });
    }
  });
}
