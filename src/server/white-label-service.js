/**
 * White Label Service
 * Dynamische branding en configuratie per tenant
 */

import { TenantManager } from './tenant-manager.js';

export class WhiteLabelService {
  constructor() {
    this.tenantManager = new TenantManager();
    this.brandingCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get tenant configuration with caching
  async getTenantConfig(identifier) {
    const cacheKey = `config_${identifier}`;
    const cached = this.brandingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    const tenant = this.tenantManager.getTenant(identifier) || 
                   this.tenantManager.getTenantByDomain(identifier);
    
    if (!tenant) {
      throw new Error(`Tenant not found: ${identifier}`);
    }

    const config = this.buildTenantConfig(tenant);
    
    // Cache the result
    this.brandingCache.set(cacheKey, {
      data: config,
      timestamp: Date.now()
    });

    return config;
  }

  buildTenantConfig(tenant) {
    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain
      },
      branding: this.buildBrandingConfig(tenant),
      personality: this.buildPersonalityConfig(tenant),
      features: tenant.features,
      routing: tenant.routing,
      api: {
        webhookUrl: tenant.n8nConfig.webhookUrl,
        chatEndpoint: `/api/chat/${tenant.id}`,
        widgetEndpoint: `/api/widget/${tenant.id}`
      }
    };
  }

  buildBrandingConfig(tenant) {
    const { branding } = tenant;
    
    return {
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        primaryHover: this.adjustColor(branding.primaryColor, -10),
        primaryLight: this.adjustColor(branding.primaryColor, 20)
      },
      typography: {
        fontFamily: branding.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: branding.fontSize || '14px'
      },
      layout: {
        borderRadius: branding.borderRadius || '12px',
        shadow: branding.shadow || '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: branding.position || 'bottom-right'
      },
      assets: {
        logo: branding.logo,
        avatar: branding.avatar,
        favicon: branding.favicon
      },
      customCSS: branding.customCSS
    };
  }

  buildPersonalityConfig(tenant) {
    const { personality } = tenant;
    
    return {
      botName: personality.name,
      traits: personality.traits,
      tone: personality.tone,
      language: personality.language,
      systemPrompt: this.generateSystemPrompt(tenant),
      welcomeMessages: this.generateWelcomeMessages(tenant),
      fallbackMessages: this.generateFallbackMessages(tenant)
    };
  }

  generateSystemPrompt(tenant) {
    const { personality, branding, features, routing } = tenant;
    
    let prompt = `Je bent ${personality.name}, een ${personality.traits.join(', ')} assistent van ${branding.companyName}.

PERSOONLIJKHEID:
${personality.traits.map(trait => `- ${trait}`).join('\n')}

COMMUNICATIESTIJL:
- Toon: ${personality.tone}
- Taal: ${personality.language}
- Altijd behulpzaam en proactief

HOOFDTAKEN:`;

    if (features.serviceRequests) {
      prompt += `

1. SERVICEVRAGEN AFHANDELEN:
   - Verzamel volledige informatie
   - Routeer naar juiste teams:`;
      
      Object.entries(routing).forEach(([dept, email]) => {
        prompt += `\n     * ${dept}: ${email}`;
      });
    }

    if (features.eventInquiries) {
      prompt += `

2. EVENEMENTEN:
   - Vraag door naar type, aantal personen, budget
   - Stuur door naar: ${routing.events || routing.general}`;
    }

    if (features.faqSystem) {
      prompt += `

3. FAQ ONDERSTEUNING:
   - Beantwoord vragen met bedrijfsinformatie
   - Verwijs naar relevante contactpersonen`;
    }

    prompt += `

Reageer altijd in het ${personality.language === 'nl' ? 'Nederlands' : 'Engels'} en blijf in karakter als ${personality.name}.`;

    return prompt;
  }

  generateWelcomeMessages(tenant) {
    const { personality, branding } = tenant;
    const botName = personality.name;
    const companyName = branding.companyName;
    
    if (personality.language === 'nl') {
      return [
        `Hallo! Ik ben ${botName} van ${companyName}. Waar kan ik je mee helpen? 👋`,
        `Welkom bij ${companyName}! Ik sta klaar om je te helpen. Wat zou je willen weten? 😊`,
        `Hoi! Fijn dat je er bent. Ik help je graag met al je vragen over ${companyName}! 🏢`
      ];
    } else {
      return [
        `Hello! I'm ${botName} from ${companyName}. How can I help you today? 👋`,
        `Welcome to ${companyName}! I'm here to assist you. What would you like to know? 😊`,
        `Hi there! Great to see you. I'm happy to help with any questions about ${companyName}! 🏢`
      ];
    }
  }

  generateFallbackMessages(tenant) {
    const { personality, routing } = tenant;
    const generalEmail = routing.general;
    
    if (personality.language === 'nl') {
      return [
        `Sorry, ik had even een technisch probleempje! Kun je je vraag opnieuw stellen? Of neem direct contact op via ${generalEmail}`,
        `Oeps, er ging iets mis. Probeer het nog eens, of bel ons direct voor snelle hulp!`,
        `Excuses voor de storing! Waar kan ik je mee helpen? Anders kun je altijd terecht bij ${generalEmail}`
      ];
    } else {
      return [
        `Sorry, I had a technical hiccup! Could you please rephrase your question? Or contact us directly at ${generalEmail}`,
        `Oops, something went wrong. Please try again, or call us directly for immediate assistance!`,
        `Apologies for the issue! How can I help you? You can always reach us at ${generalEmail}`
      ];
    }
  }

  // Dynamic widget generation
  async generateTenantWidget(tenantId, options = {}) {
    const tenant = this.tenantManager.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const config = await this.getTenantConfig(tenantId);
    
    return {
      html: this.generateWidgetHTML(config, options),
      css: this.generateWidgetCSS(config, options),
      js: this.generateWidgetJS(config, options)
    };
  }

  generateWidgetHTML(config, options) {
    const { branding, personality } = config;
    
    return `
      <div id="chatbot-widget-${config.tenant.id}" class="chatbot-widget tenant-${config.tenant.id}">
        <div class="chatbot-header">
          <div class="chatbot-avatar">
            ${branding.assets.avatar}
          </div>
          <div class="chatbot-title">
            <h3>${personality.botName} van ${branding.companyName}</h3>
            <p><span class="status-dot"></span>Online • Klaar om te helpen</p>
          </div>
          <button class="chatbot-close">×</button>
        </div>
        <div class="chatbot-messages"></div>
        <div class="chatbot-input">
          <input type="text" placeholder="Typ je vraag hier..." />
          <button class="chatbot-send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <button class="chatbot-toggle tenant-${config.tenant.id}">
        ${branding.assets.avatar}
      </button>
    `;
  }

  generateWidgetCSS(config, options) {
    const tenant = this.tenantManager.getTenant(config.tenant.id);
    return this.tenantManager.generateTenantCSS(tenant);
  }

  generateWidgetJS(config, options) {
    return `
      (function() {
        const tenantConfig = ${JSON.stringify(config, null, 2)};
        
        // Initialize ChatGuus with tenant configuration
        ChatGuus.init({
          tenantId: '${config.tenant.id}',
          webhookUrl: '${config.api.webhookUrl}',
          fallbackUrl: '${config.api.chatEndpoint}',
          branding: tenantConfig.branding,
          personality: tenantConfig.personality,
          features: tenantConfig.features,
          ...${JSON.stringify(options)}
        });
      })();
    `;
  }

  // Tenant analytics
  async getTenantAnalytics(tenantId, timeframe = '7d') {
    const tenant = this.tenantManager.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // This would integrate with your analytics service
    return {
      tenantId,
      timeframe,
      metrics: {
        totalConversations: 0, // Placeholder
        avgResponseTime: '2.3s',
        topIntents: ['service_request', 'faq', 'general'],
        satisfactionScore: 4.2,
        conversionRate: '12%'
      },
      trends: {
        conversationsGrowth: '+15%',
        responseTimeImprovement: '-0.5s',
        satisfactionTrend: '+0.3'
      }
    };
  }

  // Tenant management API methods
  async createTenant(tenantData) {
    this.tenantManager.validateTenantConfig(tenantData);
    
    // Generate API key for tenant
    tenantData.apiKey = this.generateApiKey();
    
    this.tenantManager.addTenant(tenantData.id, tenantData);
    
    // Clear cache
    this.clearBrandingCache();
    
    return {
      success: true,
      tenant: tenantData,
      widgetUrl: `/api/widget/${tenantData.id}`,
      apiEndpoint: `/api/chat/${tenantData.id}`
    };
  }

  async updateTenant(tenantId, updates) {
    const updated = this.tenantManager.updateTenant(tenantId, updates);
    
    // Clear cache for this tenant
    this.clearBrandingCache(tenantId);
    
    return updated;
  }

  async deleteTenant(tenantId) {
    const result = this.tenantManager.deleteTenant(tenantId);
    
    // Clear cache
    this.clearBrandingCache(tenantId);
    
    return result;
  }

  // Utility methods
  generateApiKey() {
    return 'tk_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  adjustColor(color, percent) {
    return percent > 0 ? this.tenantManager.lightenColor(color, percent) : 
                        this.tenantManager.darkenColor(color, Math.abs(percent));
  }

  clearBrandingCache(tenantId = null) {
    if (tenantId) {
      const keys = Array.from(this.brandingCache.keys()).filter(key => 
        key.includes(tenantId)
      );
      keys.forEach(key => this.brandingCache.delete(key));
    } else {
      this.brandingCache.clear();
    }
  }

  // Middleware for tenant detection
  tenantMiddleware() {
    return (req, res, next) => {
      const tenantId = req.params.tenantId || 
                      req.headers['x-tenant-id'] ||
                      req.query.tenant;
      
      const domain = req.headers.host || req.headers.origin;
      
      let tenant;
      
      if (tenantId) {
        tenant = this.tenantManager.getTenant(tenantId);
      } else if (domain) {
        tenant = this.tenantManager.getTenantByDomain(domain);
      }
      
      if (!tenant) {
        tenant = this.tenantManager.getTenant('koepel'); // Default fallback
      }
      
      req.tenant = tenant;
      req.tenantConfig = this.buildTenantConfig(tenant);
      
      next();
    };
  }
}
