/**
 * E-Commerce Tenant Configuration Example
 * Demonstrates ChatGuusPT for online retail businesses
 */

// Complete e-commerce tenant configuration
const ecommerceTenant = {
  id: 'fashionstore',
  name: 'Fashion Store Premium',
  domain: 'fashionstore.com',
  active: true,
  
  // E-commerce specific branding
  branding: {
    primaryColor: '#e11d48',
    secondaryColor: '#f97316', 
    accentColor: '#8b5cf6',
    companyName: 'Fashion Store',
    logo: '/assets/fashionstore-logo.png',
    favicon: '/assets/fashionstore-favicon.ico',
    
    // E-commerce specific styling
    theme: {
      style: 'modern-retail',
      borderRadius: '12px',
      shadows: true,
      animations: 'smooth',
      fontFamily: 'Inter, sans-serif'
    }
  },
  
  // E-commerce chatbot personality
  personality: {
    name: 'StyleBot',
    avatar: '/assets/stylebot-avatar.png',
    tone: 'helpful-trendy',
    language: 'en',
    
    welcomeMessages: [
      "Hi! I'm StyleBot 👗 How can I help you find the perfect outfit today?",
      "Welcome to Fashion Store! Looking for something special? I'm here to help! ✨",
      "Hey there! Ready to discover your new favorite pieces? Let's chat! 💫"
    ],
    
    personality_traits: [
      'fashion-knowledgeable',
      'trend-aware', 
      'size-inclusive',
      'budget-conscious',
      'style-enthusiastic'
    ],
    
    // E-commerce specific prompts
    systemPrompts: {
      base: `You are StyleBot, a helpful fashion assistant for Fashion Store Premium. 
             You're knowledgeable about current trends, sizing, styling tips, and our product catalog.
             Always be enthusiastic about fashion while being helpful and inclusive.`,
      
      productRecommendation: `When recommending products, consider:
                             - User's style preferences and body type
                             - Budget constraints and value for money  
                             - Current trends and seasonal appropriateness
                             - Size availability and fit guidance
                             - Care instructions and durability`,
      
      customerService: `For customer service issues:
                       - Be empathetic and solution-focused
                       - Offer clear next steps and timelines
                       - Escalate complex issues to human agents
                       - Always prioritize customer satisfaction`
    }
  },
  
  // E-commerce specific features
  features: {
    // Core chat features
    serviceRequests: true,
    faqSystem: true,
    emailRouting: true,
    
    // E-commerce specific features
    productSearch: true,
    orderTracking: true,
    sizeGuide: true,
    styleAdvice: true,
    wishlistManagement: true,
    returnSupport: true,
    shippingInfo: true,
    promotionsAlerts: true,
    personalShopper: true,
    
    // Advanced features
    visualSearch: true,        // Upload image to find similar items
    outfitBuilder: true,       // Mix and match suggestions
    trendAlerts: true,         // Notify about new trends
    loyaltyProgram: true,      // Points and rewards info
    giftCardSupport: true,     // Gift card purchase and redemption
    
    // Integration features
    inventoryCheck: true,      // Real-time stock levels
    priceAlerts: true,         // Price drop notifications  
    reviewSummary: true,       // Product review insights
    socialProof: true          // "Others also bought" suggestions
  },
  
  // E-commerce routing configuration
  routing: {
    // Customer service routing
    general: 'support@fashionstore.com',
    orders: 'orders@fashionstore.com', 
    returns: 'returns@fashionstore.com',
    technical: 'tech@fashionstore.com',
    billing: 'billing@fashionstore.com',
    
    // Sales and marketing
    stylist: 'stylist@fashionstore.com',
    wholesale: 'wholesale@fashionstore.com',
    partnerships: 'partnerships@fashionstore.com',
    
    // Escalation rules
    escalation: {
      highValue: 'vip@fashionstore.com',      // Orders > $500
      complaints: 'manager@fashionstore.com',  // Negative sentiment
      urgent: 'urgent@fashionstore.com'        // Same-day delivery issues
    }
  },
  
  // E-commerce business rules
  businessRules: {
    orderThreshold: {
      freeShipping: 75,          // Free shipping over $75
      expedited: 150,            // Free expedited over $150
      vipTreatment: 500          // VIP service over $500
    },
    
    returnPolicy: {
      standardReturn: 30,        // 30 days standard return
      extendedReturn: 60,        // 60 days for premium members
      finalSale: ['clearance', 'underwear', 'custom']
    },
    
    inventory: {
      lowStockThreshold: 5,      // Alert when < 5 items
      backorderEnabled: true,    // Allow backorders
      preorderEnabled: true      // Allow pre-orders
    },
    
    customerSegmentation: {
      newCustomer: 0,            // First-time buyers
      regular: 3,                // 3+ orders
      vip: 10,                   // 10+ orders or $1000+ lifetime
      wholesale: 'B2B'           // Business customers
    }
  },
  
  // Product catalog integration
  integrations: {
    ecommerce: {
      platform: 'shopify',      // Shopify, WooCommerce, Magento, etc.
      apiKey: process.env.SHOPIFY_API_KEY,
      storeUrl: 'fashionstore.myshopify.com',
      webhooks: {
        orderCreated: '/webhooks/order-created',
        orderUpdated: '/webhooks/order-updated', 
        inventoryUpdated: '/webhooks/inventory-updated'
      }
    },
    
    analytics: {
      googleAnalytics: 'GA-XXXXXXXXX',
      facebookPixel: 'FB-XXXXXXXXX',
      klaviyo: 'KLAVIYO-API-KEY',
      hotjar: 'HOTJAR-SITE-ID'
    },
    
    customerService: {
      zendesk: 'ZENDESK-SUBDOMAIN',
      intercom: 'INTERCOM-APP-ID',
      freshdesk: 'FRESHDESK-DOMAIN'
    },
    
    shipping: {
      shipstation: 'SHIPSTATION-API-KEY',
      fedex: 'FEDEX-API-KEY',
      ups: 'UPS-API-KEY'
    }
  },
  
  // Analytics and tracking
  analytics: {
    enabled: true,
    events: [
      'product_viewed',
      'product_searched', 
      'cart_abandoned',
      'size_guide_used',
      'style_advice_requested',
      'order_inquiry',
      'return_initiated',
      'review_requested'
    ],
    
    goals: {
      conversion: 'purchase_completed',
      engagement: 'chat_duration_5min',
      satisfaction: 'positive_feedback',
      retention: 'return_visit_30days'
    },
    
    segmentation: {
      byPurchaseHistory: true,
      byBrowsingBehavior: true,
      byStylePreferences: true,
      byPriceRange: true
    }
  },
  
  // Conversation flows
  conversationFlows: {
    productInquiry: {
      trigger: ['product', 'item', 'clothing', 'shoes', 'accessories'],
      actions: ['search_catalog', 'show_recommendations', 'check_availability'],
      escalation: 'stylist@fashionstore.com'
    },
    
    orderSupport: {
      trigger: ['order', 'delivery', 'shipping', 'tracking'],
      actions: ['lookup_order', 'track_shipment', 'estimate_delivery'],
      escalation: 'orders@fashionstore.com'
    },
    
    sizeAndFit: {
      trigger: ['size', 'fit', 'measurements', 'too small', 'too big'],
      actions: ['show_size_guide', 'fit_recommendations', 'exchange_options'],
      escalation: 'stylist@fashionstore.com'
    },
    
    returns: {
      trigger: ['return', 'exchange', 'refund', 'not satisfied'],
      actions: ['return_policy', 'initiate_return', 'exchange_options'],
      escalation: 'returns@fashionstore.com'
    },
    
    styleAdvice: {
      trigger: ['style', 'outfit', 'match', 'occasion', 'trend'],
      actions: ['style_quiz', 'outfit_builder', 'trend_report'],
      escalation: 'stylist@fashionstore.com'
    }
  },
  
  // Knowledge base for FAQ
  knowledgeBase: {
    shipping: {
      domestic: "Free shipping on orders over $75. Standard delivery 3-5 business days.",
      international: "International shipping available to 50+ countries. Delivery 7-14 days.",
      expedited: "Next-day delivery available for orders placed before 2 PM EST."
    },
    
    returns: {
      policy: "30-day return policy on most items. Items must be unworn with tags attached.",
      process: "Start your return online or chat with us. Free return shipping included.",
      exchanges: "Easy exchanges for different sizes or colors. No restocking fees."
    },
    
    sizing: {
      guide: "Use our interactive size guide for accurate measurements.",
      fit: "Our fit team can help you find the perfect size. Chat or call us!",
      inclusive: "We offer sizes XS-5XL with inclusive fit options for every body type."
    },
    
    sustainability: {
      materials: "We partner with sustainable brands using eco-friendly materials.",
      packaging: "100% recyclable packaging with minimal environmental impact.",
      ethics: "Fair trade certified suppliers and ethical manufacturing practices."
    }
  },
  
  // Promotional and marketing
  promotions: {
    newCustomer: {
      discount: 15,
      code: 'WELCOME15',
      message: "Welcome! Use code WELCOME15 for 15% off your first order! 🎉"
    },
    
    seasonal: {
      spring: "Spring collection is here! Fresh styles for the new season 🌸",
      summer: "Summer sale - up to 50% off swimwear and summer essentials ☀️",
      fall: "Fall fashion favorites - cozy knits and stylish layers 🍂",
      winter: "Winter warmth - premium coats and accessories ❄️"
    },
    
    loyalty: {
      points: "Earn 1 point per $1 spent. 100 points = $10 reward!",
      tiers: {
        bronze: "Free shipping on all orders",
        silver: "Early access to sales + 5% birthday discount", 
        gold: "Personal stylist consultation + 10% member discount",
        platinum: "VIP customer service + exclusive designer access"
      }
    }
  },
  
  // Advanced e-commerce features
  aiFeatures: {
    personalShopper: {
      enabled: true,
      questions: [
        "What's your style preference? (casual, formal, trendy, classic)",
        "What's your budget range for this shopping session?",
        "Any specific occasion you're shopping for?",
        "What are your favorite colors and patterns?",
        "Any brands you particularly love or want to avoid?"
      ]
    },
    
    outfitBuilder: {
      enabled: true,
      categories: ['tops', 'bottoms', 'dresses', 'shoes', 'accessories'],
      occasions: ['work', 'casual', 'date night', 'vacation', 'special event']
    },
    
    trendAnalysis: {
      enabled: true,
      sources: ['fashion_weeks', 'celebrity_styles', 'social_media', 'street_style'],
      updateFrequency: 'weekly'
    },
    
    visualSearch: {
      enabled: true,
      accuracy: 0.85,
      categories: ['clothing', 'shoes', 'accessories', 'home_decor']
    }
  }
};

// E-commerce specific conversation handlers
const ecommerceHandlers = {
  
  async handleProductInquiry(message, context) {
    const productKeywords = this.extractProductKeywords(message);
    const userPreferences = await this.getUserStyleProfile(context.userId);
    
    // Search product catalog
    const products = await this.searchProducts({
      keywords: productKeywords,
      preferences: userPreferences,
      budget: context.budget,
      size: context.preferredSize
    });
    
    if (products.length > 0) {
      return {
        message: this.formatProductRecommendations(products),
        action: {
          type: 'show_products',
          products: products.slice(0, 5), // Top 5 recommendations
          searchQuery: productKeywords.join(' ')
        }
      };
    } else {
      return {
        message: "I couldn't find exactly what you're looking for, but our stylists can help! Let me connect you with a personal shopper who can find the perfect items for you. 👗✨",
        action: {
          type: 'escalate_to_stylist',
          reason: 'no_products_found',
          query: message
        }
      };
    }
  },

  async handleOrderInquiry(message, context) {
    const orderNumber = this.extractOrderNumber(message);
    
    if (orderNumber) {
      const orderInfo = await this.lookupOrder(orderNumber, context.userId);
      
      if (orderInfo) {
        return {
          message: this.formatOrderStatus(orderInfo),
          action: {
            type: 'show_order_details',
            order: orderInfo
          }
        };
      } else {
        return {
          message: "I couldn't find that order number. Could you double-check it? You can also find your order number in your email confirmation. 📧",
          action: {
            type: 'request_order_verification'
          }
        };
      }
    } else {
      return {
        message: "I'd be happy to help with your order! Could you provide your order number? You can find it in your confirmation email. 📦",
        action: {
          type: 'request_order_number'
        }
      };
    }
  },

  async handleSizeInquiry(message, context) {
    const productMentioned = this.extractProductFromMessage(message);
    const sizeConcerns = this.extractSizeConcerns(message);
    
    let response = "I'd love to help you find the perfect fit! 📏\n\n";
    
    if (productMentioned) {
      const sizeGuide = await this.getProductSizeGuide(productMentioned);
      response += this.formatSizeGuide(sizeGuide, productMentioned);
    } else {
      response += "Here are some general fit tips:\n";
      response += "• Check our size guide for each item (sizes can vary by brand)\n";
      response += "• Read customer reviews for fit insights\n";
      response += "• When in doubt, size up - exchanges are always free!\n";
      response += "• Our fit specialists are available for personal consultations\n\n";
      response += "What specific item are you looking at? I can pull up the exact size guide! 👗";
    }
    
    return {
      message: response,
      action: {
        type: 'show_size_guide',
        product: productMentioned,
        concerns: sizeConcerns
      }
    };
  },

  async handleStyleAdvice(message, context) {
    const occasion = this.extractOccasion(message);
    const stylePrefs = await this.getUserStyleProfile(context.userId);
    
    let response = "I love helping with style advice! ✨\n\n";
    
    if (occasion) {
      const outfitSuggestions = await this.getOutfitSuggestions(occasion, stylePrefs);
      response += `Perfect ${occasion} outfits for you:\n\n`;
      response += this.formatOutfitSuggestions(outfitSuggestions);
    } else {
      response += "Let me help you create the perfect look! Tell me:\n";
      response += "• What's the occasion? (work, date night, casual, special event)\n";
      response += "• Any specific style you're going for?\n";
      response += "• What's your budget range?\n";
      response += "• Any colors you love or want to avoid?\n\n";
      response += "I'll create personalized outfit suggestions just for you! 🎨";
    }
    
    return {
      message: response,
      action: {
        type: 'style_consultation',
        occasion: occasion,
        preferences: stylePrefs
      }
    };
  }
};

// E-commerce utility functions
const ecommerceUtils = {
  
  extractProductKeywords(message) {
    const productTerms = [
      'dress', 'shirt', 'pants', 'jeans', 'skirt', 'top', 'blouse',
      'shoes', 'boots', 'sneakers', 'heels', 'sandals',
      'jacket', 'coat', 'sweater', 'hoodie', 'cardigan',
      'accessories', 'bag', 'jewelry', 'scarf', 'belt'
    ];
    
    return productTerms.filter(term => 
      message.toLowerCase().includes(term)
    );
  },
  
  extractOrderNumber(message) {
    // Match various order number formats
    const patterns = [
      /\b[A-Z]{2}\d{6,10}\b/g,     // FS1234567890
      /\b\d{8,12}\b/g,             // 123456789012
      /#(\d{6,10})/g,              // #123456789
      /order[:\s]+([A-Z0-9]{6,})/gi // order: ABC123
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[0];
    }
    
    return null;
  },
  
  formatProductRecommendations(products) {
    let response = "Here are some perfect matches for you! ✨\n\n";
    
    products.slice(0, 3).forEach((product, index) => {
      response += `**${index + 1}. ${product.name}**\n`;
      response += `💰 $${product.price}`;
      if (product.originalPrice > product.price) {
        response += ` ~~$${product.originalPrice}~~ (${Math.round((1 - product.price/product.originalPrice) * 100)}% off!)`;
      }
      response += `\n⭐ ${product.rating}/5 (${product.reviewCount} reviews)\n`;
      response += `📏 Available sizes: ${product.availableSizes.join(', ')}\n`;
      if (product.lowStock) {
        response += `⚠️ Only ${product.stockCount} left in stock!\n`;
      }
      response += `\n`;
    });
    
    response += "Would you like to see more details about any of these items? I can also help you put together a complete outfit! 👗";
    
    return response;
  },
  
  formatOrderStatus(order) {
    let response = `📦 **Order #${order.number}** Status Update\n\n`;
    
    response += `**Status**: ${order.status}\n`;
    response += `**Order Date**: ${new Date(order.createdAt).toLocaleDateString()}\n`;
    response += `**Total**: $${order.total}\n\n`;
    
    if (order.trackingNumber) {
      response += `**Tracking**: ${order.trackingNumber}\n`;
      response += `**Carrier**: ${order.carrier}\n`;
      response += `**Estimated Delivery**: ${new Date(order.estimatedDelivery).toLocaleDateString()}\n\n`;
    }
    
    response += `**Items**:\n`;
    order.items.forEach(item => {
      response += `• ${item.name} (Size: ${item.size}, Qty: ${item.quantity})\n`;
    });
    
    if (order.status === 'shipped') {
      response += `\n🚚 Your order is on its way! Track it here: [${order.trackingUrl}](${order.trackingUrl})`;
    } else if (order.status === 'delivered') {
      response += `\n🎉 Your order has been delivered! How do you love your new pieces? Leave a review to help other shoppers!`;
    }
    
    return response;
  },
  
  async getPersonalizedGreeting(userId, context) {
    const user = await this.getUserProfile(userId);
    const timeOfDay = new Date().getHours();
    
    let greeting = '';
    
    // Time-based greeting
    if (timeOfDay < 12) {
      greeting = 'Good morning';
    } else if (timeOfDay < 17) {
      greeting = 'Good afternoon';  
    } else {
      greeting = 'Good evening';
    }
    
    // Personalization
    if (user?.name) {
      greeting += `, ${user.name}`;
    }
    
    // Shopping context
    if (user?.lastPurchase) {
      const daysSince = Math.floor((Date.now() - new Date(user.lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 7) {
        greeting += "! How are you loving your recent purchase?";
      } else if (daysSince < 30) {
        greeting += "! Ready for some new additions to your wardrobe?";
      }
    } else {
      greeting += "! Welcome to Fashion Store - I'm excited to help you find something amazing!";
    }
    
    return greeting + " ✨";
  }
};

// Export configuration
export { ecommerceTenant, ecommerceHandlers, ecommerceUtils };

// Usage example
/*
// Initialize e-commerce chatbot
ChatGuus.init({
  tenantId: 'fashionstore',
  webhookUrl: 'https://your-n8n.com/webhook/ecommerce-chat',
  features: ['productSearch', 'orderTracking', 'styleAdvice'],
  
  // E-commerce specific options
  catalog: {
    apiUrl: 'https://fashionstore.myshopify.com/api',
    searchEnabled: true,
    recommendationsEnabled: true
  },
  
  // Enhanced analytics for e-commerce
  analytics: {
    trackPurchaseIntent: true,
    trackStylePreferences: true,
    trackSizeQueries: true,
    segmentByBehavior: true
  },
  
  // E-commerce UI customizations
  ui: {
    showProductCards: true,
    showPriceComparison: true,
    showStockStatus: true,
    showReviews: true,
    enableWishlist: true
  }
});
*/
