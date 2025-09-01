/**
 * Tenant Manager Module
 * Handelt multi-tenancy en white labeling voor verschillende organisaties
 */

export class TenantManager {
  constructor() {
    this.tenants = new Map();
    this.loadDefaultTenants();
  }

  loadDefaultTenants() {
    // Default Koepel tenant
    this.addTenant('koepel', {
      id: 'koepel',
      name: 'De Koepel',
      domain: 'cupolaxs.nl',
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        logo: '/assets/koepel-logo.png',
        avatar: '🤖',
        companyName: 'De Koepel',
        botName: 'Guus',
        welcomeMessage: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?'
      },
      personality: {
        name: 'Guus',
        traits: ['vriendelijk', 'gastvrij', 'behulpzaam', 'professioneel'],
        tone: 'informeel maar respectvol',
        language: 'nl'
      },
      routing: {
        general: 'welcome@cupolaxs.nl',
        it: 'support@axs-ict.com',
        cleaning: 'ralphcassa@gmail.com',
        events: 'irene@cupolaxs.nl'
      },
      features: {
        serviceRequests: true,
        eventInquiries: true,
        faqSystem: true,
        emailRouting: true,
        googleSheets: true
      },
      n8nConfig: {
        webhookUrl: process.env.N8N_WEBHOOK_URL_KOEPEL,
        workflowId: 'chatguus-koepel'
      }
    });

    // Example: Additional tenant for demo
    this.addTenant('demo-company', {
      id: 'demo-company',
      name: 'Demo Company',
      domain: 'demo.example.com',
      branding: {
        primaryColor: '#059669',
        secondaryColor: '#6b7280',
        logo: '/assets/demo-logo.png',
        avatar: '🏢',
        companyName: 'Demo Company',
        botName: 'Assistant',
        welcomeMessage: 'Hello! I\'m your virtual assistant. How can I help you today?'
      },
      personality: {
        name: 'Assistant',
        traits: ['professional', 'efficient', 'helpful'],
        tone: 'formal but friendly',
        language: 'en'
      },
      routing: {
        general: 'info@demo.example.com',
        it: 'tech@demo.example.com',
        sales: 'sales@demo.example.com',
        support: 'support@demo.example.com'
      },
      features: {
        serviceRequests: true,
        eventInquiries: false,
        faqSystem: true,
        emailRouting: true,
        googleSheets: false
      },
      n8nConfig: {
        webhookUrl: process.env.N8N_WEBHOOK_URL_DEMO,
        workflowId: 'chatbot-demo'
      }
    });
  }

  addTenant(id, config) {
    this.tenants.set(id, {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true
    });
  }

  getTenant(identifier) {
    // Get by ID
    if (this.tenants.has(identifier)) {
      return this.tenants.get(identifier);
    }

    // Get by domain
    for (const [id, tenant] of this.tenants) {
      if (tenant.domain === identifier || 
          tenant.domain === identifier.replace(/^https?:\/\//, '').replace(/^www\./, '')) {
        return tenant;
      }
    }

    return null;
  }

  getTenantByDomain(domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    for (const [id, tenant] of this.tenants) {
      if (tenant.domain === cleanDomain) {
        return tenant;
      }
    }
    
    return this.getTenant('koepel'); // Default fallback
  }

  getTenantByApiKey(apiKey) {
    for (const [id, tenant] of this.tenants) {
      if (tenant.apiKey === apiKey) {
        return tenant;
      }
    }
    return null;
  }

  getAllTenants() {
    return Array.from(this.tenants.values());
  }

  updateTenant(id, updates) {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      throw new Error(`Tenant ${id} not found`);
    }

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  deleteTenant(id) {
    if (id === 'koepel') {
      throw new Error('Cannot delete default Koepel tenant');
    }
    
    return this.tenants.delete(id);
  }

  // White labeling methods
  generateBrandingConfig(tenantId) {
    const tenant = this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return {
      css: this.generateTenantCSS(tenant),
      config: this.generateWidgetConfig(tenant),
      assets: this.getTenantAssets(tenant)
    };
  }

  generateTenantCSS(tenant) {
    const { branding } = tenant;
    
    return `
      :root {
        --tenant-primary: ${branding.primaryColor};
        --tenant-secondary: ${branding.secondaryColor};
        --tenant-company: "${branding.companyName}";
        --tenant-bot-name: "${branding.botName}";
      }
      
      .chatbot-widget.tenant-${tenant.id} {
        --chatguus-primary: ${branding.primaryColor};
        --chatguus-secondary: ${branding.secondaryColor};
      }
      
      .chatbot-widget.tenant-${tenant.id} .chatguus-header {
        background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${this.darkenColor(branding.primaryColor, 10)} 100%);
      }
      
      .chatbot-widget.tenant-${tenant.id} .chatguus-toggle {
        background: ${branding.primaryColor};
      }
      
      .chatbot-widget.tenant-${tenant.id} .chatguus-send {
        background: ${branding.primaryColor};
      }
      
      .chatbot-widget.tenant-${tenant.id} .chatguus-message.user {
        background: ${branding.primaryColor};
      }
    `;
  }

  generateWidgetConfig(tenant) {
    return {
      tenantId: tenant.id,
      branding: tenant.branding,
      personality: tenant.personality,
      features: tenant.features,
      routing: tenant.routing,
      webhookUrl: tenant.n8nConfig.webhookUrl,
      apiEndpoint: `/api/chat/${tenant.id}`
    };
  }

  getTenantAssets(tenant) {
    return {
      logo: tenant.branding.logo,
      avatar: tenant.branding.avatar,
      favicon: tenant.branding.favicon || '/assets/default-favicon.ico',
      customCSS: tenant.branding.customCSS || null
    };
  }

  // Utility methods
  darkenColor(color, percent) {
    // Simple color darkening - in production use a proper color library
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
      (G > 255 ? 255 : G) * 0x100 + (B > 255 ? 255 : B)).toString(16).slice(1);
  }

  // Tenant validation
  validateTenantConfig(config) {
    const required = ['id', 'name', 'domain', 'branding', 'personality', 'routing'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    const requiredBranding = ['primaryColor', 'companyName', 'botName', 'welcomeMessage'];
    const missingBranding = requiredBranding.filter(field => !config.branding[field]);
    
    if (missingBranding.length > 0) {
      throw new Error(`Missing required branding fields: ${missingBranding.join(', ')}`);
    }

    return true;
  }

  // Import/Export tenants
  exportTenants() {
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      tenants: Array.from(this.tenants.values())
    };
  }

  importTenants(data) {
    if (!data.tenants || !Array.isArray(data.tenants)) {
      throw new Error('Invalid tenant data format');
    }

    let imported = 0;
    let errors = [];

    for (const tenantConfig of data.tenants) {
      try {
        this.validateTenantConfig(tenantConfig);
        this.addTenant(tenantConfig.id, tenantConfig);
        imported++;
      } catch (error) {
        errors.push(`${tenantConfig.id}: ${error.message}`);
      }
    }

    return { imported, errors };
  }

  // Tenant statistics
  getTenantStats() {
    const tenants = this.getAllTenants();
    
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.active).length,
      tenantsByFeature: {
        serviceRequests: tenants.filter(t => t.features.serviceRequests).length,
        eventInquiries: tenants.filter(t => t.features.eventInquiries).length,
        faqSystem: tenants.filter(t => t.features.faqSystem).length,
        emailRouting: tenants.filter(t => t.features.emailRouting).length
      },
      tenantsByLanguage: tenants.reduce((acc, t) => {
        const lang = t.personality.language;
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {})
    };
  }
}
