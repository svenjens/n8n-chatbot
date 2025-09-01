/**
 * AI Self-Rating System
 * Allows AI to evaluate its own responses for quality, helpfulness, and accuracy
 */

export class AISelfRating {
  constructor(options = {}) {
    this.options = {
      enableSelfRating: true,
      ratingPrompt: this.getDefaultRatingPrompt(),
      confidenceThreshold: 0.7,
      trackMissingAnswers: true,
      ...options
    };
    
    this.ratings = [];
    this.missingAnswers = [];
  }

  /**
   * Rate an AI response for quality and helpfulness
   */
  async rateResponse(userQuestion, aiResponse, context = {}) {
    if (!this.options.enableSelfRating) return null;

    try {
      const ratingPrompt = this.buildRatingPrompt(userQuestion, aiResponse, context);
      
      // In a real implementation, this would call OpenAI API
      // For demo purposes, we'll simulate the rating
      const rating = await this.simulateAIRating(userQuestion, aiResponse, context);
      
      const ratingData = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        userQuestion,
        aiResponse,
        context,
        rating,
        sessionId: context.sessionId,
        tenantId: context.tenantId
      };
      
      this.ratings.push(ratingData);
      
      // Track potentially missing/inadequate answers
      if (rating.confidence < this.options.confidenceThreshold || rating.helpfulness < 3) {
        this.trackMissingAnswer(userQuestion, aiResponse, rating);
      }
      
      return ratingData;
      
    } catch (error) {
      console.warn('AI self-rating failed:', error);
      return null;
    }
  }

  /**
   * Build the prompt for AI self-evaluation
   */
  buildRatingPrompt(userQuestion, aiResponse, context) {
    return `
Please evaluate the following AI response on a scale of 1-5 for each criterion:

USER QUESTION: "${userQuestion}"
AI RESPONSE: "${aiResponse}"
CONTEXT: ${JSON.stringify(context, null, 2)}

Rate the response on:
1. ACCURACY (1=incorrect, 5=completely accurate)
2. HELPFULNESS (1=not helpful, 5=very helpful)  
3. COMPLETENESS (1=incomplete, 5=comprehensive)
4. CLARITY (1=confusing, 5=very clear)
5. RELEVANCE (1=off-topic, 5=highly relevant)

Also provide:
- CONFIDENCE: Your confidence in this evaluation (0.0-1.0)
- CATEGORY: Type of question (service_request, event_inquiry, faq, general, unknown)
- IMPROVEMENT_SUGGESTIONS: Brief suggestions for improvement
- MISSING_INFO: What information might be missing from the response

Respond in JSON format:
{
  "accuracy": 4,
  "helpfulness": 5,
  "completeness": 3,
  "clarity": 4,
  "relevance": 5,
  "overall": 4.2,
  "confidence": 0.85,
  "category": "service_request",
  "improvement_suggestions": "Could provide more specific timeline",
  "missing_info": "Exact delivery date",
  "reasoning": "Response addresses the question but could be more specific"
}
    `.trim();
  }

  /**
   * Simulate AI rating (replace with actual OpenAI API call)
   */
  async simulateAIRating(userQuestion, aiResponse, context) {
    // Simulate different rating patterns based on content
    const questionLower = userQuestion.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    let baseRating = {
      accuracy: 4,
      helpfulness: 4,
      completeness: 4,
      clarity: 4,
      relevance: 4,
      confidence: 0.8,
      category: 'general',
      improvement_suggestions: '',
      missing_info: '',
      reasoning: 'Standard response evaluation'
    };

    // Adjust rating based on response quality indicators
    if (responseLower.includes('sorry') || responseLower.includes('i don\'t know')) {
      baseRating.helpfulness = 2;
      baseRating.completeness = 2;
      baseRating.confidence = 0.4;
      baseRating.category = 'unknown';
      baseRating.improvement_suggestions = 'Needs more specific information or escalation';
      baseRating.missing_info = 'Specific answer to user question';
    }
    
    if (responseLower.includes('contact') || responseLower.includes('email')) {
      baseRating.category = 'service_request';
      baseRating.helpfulness = 4;
    }
    
    if (responseLower.includes('event') || responseLower.includes('booking')) {
      baseRating.category = 'event_inquiry';
    }
    
    if (responseLower.length < 50) {
      baseRating.completeness = Math.max(2, baseRating.completeness - 1);
    }
    
    if (responseLower.length > 200) {
      baseRating.completeness = Math.min(5, baseRating.completeness + 1);
    }

    // Calculate overall score
    baseRating.overall = (
      baseRating.accuracy + 
      baseRating.helpfulness + 
      baseRating.completeness + 
      baseRating.clarity + 
      baseRating.relevance
    ) / 5;

    return baseRating;
  }

  /**
   * Track questions that couldn't be answered adequately
   */
  trackMissingAnswer(userQuestion, aiResponse, rating) {
    const missingAnswer = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userQuestion,
      aiResponse,
      rating,
      category: rating.category,
      priority: this.calculatePriority(rating),
      status: 'needs_review',
      frequency: 1
    };
    
    // Check if similar question already exists
    const existing = this.missingAnswers.find(ma => 
      this.calculateSimilarity(ma.userQuestion, userQuestion) > 0.8
    );
    
    if (existing) {
      existing.frequency++;
      existing.timestamp = new Date().toISOString();
    } else {
      this.missingAnswers.push(missingAnswer);
    }
  }

  /**
   * Calculate priority for missing answers
   */
  calculatePriority(rating) {
    if (rating.confidence < 0.3) return 'high';
    if (rating.helpfulness < 2) return 'high';
    if (rating.confidence < 0.5) return 'medium';
    return 'low';
  }

  /**
   * Simple similarity calculation (in real implementation, use better NLP)
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Get analytics data for dashboard
   */
  getAnalytics() {
    const totalRatings = this.ratings.length;
    if (totalRatings === 0) return this.getEmptyAnalytics();

    const avgRatings = {
      overall: this.calculateAverage('overall'),
      accuracy: this.calculateAverage('accuracy'),
      helpfulness: this.calculateAverage('helpfulness'),
      completeness: this.calculateAverage('completeness'),
      clarity: this.calculateAverage('clarity'),
      relevance: this.calculateAverage('relevance')
    };

    const categoryBreakdown = this.getCategoryBreakdown();
    const confidenceDistribution = this.getConfidenceDistribution();
    const trendData = this.getTrendData();

    return {
      totalRatings,
      averageRatings: avgRatings,
      categoryBreakdown,
      confidenceDistribution,
      trendData,
      missingAnswers: {
        total: this.missingAnswers.length,
        highPriority: this.missingAnswers.filter(ma => ma.priority === 'high').length,
        categories: this.getMissingAnswerCategories()
      },
      lastUpdated: new Date().toISOString()
    };
  }

  calculateAverage(field) {
    if (this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating[field], 0);
    return (sum / this.ratings.length).toFixed(2);
  }

  getCategoryBreakdown() {
    const categories = {};
    this.ratings.forEach(rating => {
      const category = rating.rating.category;
      if (!categories[category]) {
        categories[category] = { count: 0, avgRating: 0 };
      }
      categories[category].count++;
    });
    
    // Calculate average ratings per category
    Object.keys(categories).forEach(category => {
      const categoryRatings = this.ratings.filter(r => r.rating.category === category);
      const avgOverall = categoryRatings.reduce((acc, r) => acc + r.rating.overall, 0) / categoryRatings.length;
      categories[category].avgRating = avgOverall.toFixed(2);
    });
    
    return categories;
  }

  getConfidenceDistribution() {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    this.ratings.forEach(rating => {
      if (rating.rating.confidence >= 0.8) distribution.high++;
      else if (rating.rating.confidence >= 0.6) distribution.medium++;
      else distribution.low++;
    });
    
    return distribution;
  }

  getTrendData() {
    // Group ratings by day for trend analysis
    const trends = {};
    
    this.ratings.forEach(rating => {
      const date = rating.timestamp.split('T')[0];
      if (!trends[date]) {
        trends[date] = { count: 0, totalRating: 0 };
      }
      trends[date].count++;
      trends[date].totalRating += rating.rating.overall;
    });
    
    // Convert to array format for charts
    return Object.keys(trends).map(date => ({
      date,
      count: trends[date].count,
      avgRating: (trends[date].totalRating / trends[date].count).toFixed(2)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getMissingAnswerCategories() {
    const categories = {};
    this.missingAnswers.forEach(ma => {
      if (!categories[ma.category]) {
        categories[ma.category] = { count: 0, highPriority: 0 };
      }
      categories[ma.category].count++;
      if (ma.priority === 'high') {
        categories[ma.category].highPriority++;
      }
    });
    return categories;
  }

  getEmptyAnalytics() {
    return {
      totalRatings: 0,
      averageRatings: {
        overall: 0,
        accuracy: 0,
        helpfulness: 0,
        completeness: 0,
        clarity: 0,
        relevance: 0
      },
      categoryBreakdown: {},
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
      trendData: [],
      missingAnswers: {
        total: 0,
        highPriority: 0,
        categories: {}
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get default rating prompt
   */
  getDefaultRatingPrompt() {
    return `Evaluate this AI response for quality and helpfulness.`;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'ai_rating_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Export data for external analysis
   */
  exportData() {
    return {
      ratings: this.ratings,
      missingAnswers: this.missingAnswers,
      analytics: this.getAnalytics(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear old data (for maintenance)
   */
  cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.ratings = this.ratings.filter(rating => 
      new Date(rating.timestamp) > cutoffDate
    );
    
    this.missingAnswers = this.missingAnswers.filter(ma => 
      new Date(ma.timestamp) > cutoffDate
    );
  }
}

// Export for use in other modules
export default AISelfRating;
