/**
 * Chat Satisfaction Rating System
 * Collects user feedback and measures support quality
 */

export class SatisfactionRating {
  constructor(options = {}) {
    this.options = {
      enableRating: true,
      autoPrompt: true,
      promptDelay: 30000, // 30 seconds after conversation
      minMessages: 3, // Minimum messages before prompting
      ratingScale: 5, // 1-5 star rating
      collectFeedback: true,
      storageKey: 'chatguus_ratings',
      ...options
    };
    
    this.currentSession = null;
    this.hasRated = false;
    this.ratingPromptShown = false;
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
    return sessionDuration > this.options.promptDelay;
  }

  createRatingInterface() {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'satisfaction-rating';
    ratingContainer.innerHTML = `
      <div class="rating-header">
        <h4>How was your experience? ⭐</h4>
        <p>Your feedback helps us improve our service</p>
      </div>
      
      <div class="rating-stars">
        ${Array.from({length: this.options.ratingScale}, (_, i) => 
          `<button class="star-button" data-rating="${i + 1}">
            <span class="star">⭐</span>
            <span class="star-label">${this.getStarLabel(i + 1)}</span>
          </button>`
        ).join('')}
      </div>
      
      <div class="rating-feedback" style="display: none;">
        <textarea 
          placeholder="Tell us more about your experience (optional)..."
          maxlength="500"
          rows="3"
        ></textarea>
        <div class="feedback-buttons">
          <button class="skip-feedback">Skip</button>
          <button class="submit-feedback">Submit Feedback</button>
        </div>
      </div>
      
      <div class="rating-thanks" style="display: none;">
        <div class="thanks-icon">🙏</div>
        <h4>Thank you for your feedback!</h4>
        <p>We appreciate you taking the time to help us improve.</p>
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
    const labels = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
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

  getStarLabels() {
    return {
      1: 'Very Poor 😞',
      2: 'Poor 😕', 
      3: 'Okay 😐',
      4: 'Good 😊',
      5: 'Excellent 🤩'
    };
  }

  // Rating UI creation for widget
  createRatingUI() {
    const ratingHTML = `
      <div class="satisfaction-rating-widget">
        <div class="rating-prompt">
          <div class="rating-header">
            <span class="rating-emoji">⭐</span>
            <h4>How was your experience?</h4>
            <p>Your feedback helps us improve</p>
          </div>
          
          <div class="rating-stars">
            ${Array.from({length: this.options.ratingScale}, (_, i) => 
              `<button class="rating-star" data-rating="${i + 1}" title="${this.getStarLabels()[i + 1]}">
                <span class="star-icon">⭐</span>
              </button>`
            ).join('')}
          </div>
        </div>
        
        <div class="feedback-section" style="display: none;">
          <h5>Tell us more (optional)</h5>
          <div class="feedback-categories">
            <button class="feedback-category" data-category="helpful">Helpful 👍</button>
            <button class="feedback-category" data-category="fast">Fast Response ⚡</button>
            <button class="feedback-category" data-category="accurate">Accurate Info ✅</button>
            <button class="feedback-category" data-category="friendly">Friendly 😊</button>
            <button class="feedback-category" data-category="confusing">Confusing 😕</button>
            <button class="feedback-category" data-category="slow">Too Slow 🐌</button>
          </div>
          
          <textarea 
            class="feedback-text"
            placeholder="Any additional comments? (optional)"
            maxlength="500"
            rows="3"
          ></textarea>
          
          <div class="feedback-actions">
            <button class="skip-btn">Skip</button>
            <button class="submit-btn">Submit</button>
          </div>
        </div>
        
        <div class="rating-complete" style="display: none;">
          <div class="complete-icon">🙏</div>
          <h4>Thank you!</h4>
          <p class="complete-message">We appreciate your feedback</p>
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
      
      // Check if we should prompt for rating
      if (sender === 'bot' && this.shouldPromptRating()) {
        setTimeout(() => {
          this.promptForRating(chatWidget);
        }, 2000); // Wait 2 seconds after bot response
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

// Export for use in chat widget
export { SatisfactionRating };

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
