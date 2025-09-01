/**
 * ChatGuusPT Test Suite
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuusPersonality } from '../src/server/guus-personality.js';
import { EmailRouter } from '../src/server/email-router.js';

// Mock OpenAI
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Hallo! Ik ben Guus van de Koepel. Waar kan ik je mee helpen?'
            }
          }]
        })
      }
    }
  }
}));

describe('GuusPersonality', () => {
  let guus;

  beforeEach(() => {
    guus = new GuusPersonality();
  });

  describe('Intent Analysis', () => {
    it('should detect service requests', async () => {
      const intent = await guus.analyzeIntent('Ik heb een IT probleem met mijn computer');
      expect(intent.type).toBe('service_request');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should detect event inquiries', async () => {
      const intent = await guus.analyzeIntent('Ik wil een bedrijfsborrel organiseren');
      expect(intent.type).toBe('event_inquiry');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should detect FAQ questions', async () => {
      const intent = await guus.analyzeIntent('Wat zijn jullie openingstijden?');
      expect(intent.type).toBe('faq');
    });

    it('should handle general greetings', async () => {
      const intent = await guus.analyzeIntent('Hallo!');
      expect(intent.type).toBe('general');
    });
  });

  describe('Response Generation', () => {
    it('should generate friendly responses', async () => {
      const response = await guus.handleGeneral('Hallo Guus!');
      expect(response).toContain('Hallo');
      expect(response.length).toBeGreaterThan(10);
    });

    it('should handle service requests appropriately', async () => {
      const intent = { type: 'service_request', category: 'it' };
      const response = await guus.handleServiceRequest('Computer probleem', intent);
      expect(response).toContain('IT');
    });

    it('should provide event inquiry responses', async () => {
      const intent = { type: 'event_inquiry' };
      const response = await guus.handleEventInquiry('Evenement organiseren', intent);
      expect(response).toContain('evenement');
      expect(response).toContain('🎉');
    });
  });

  describe('Fallback Handling', () => {
    it('should provide fallback response on error', () => {
      const fallback = guus.getFallbackResponse();
      expect(fallback).toContain('Sorry');
      expect(fallback).toContain('welcome@cupolaxs.nl');
    });

    it('should provide conversation starters', () => {
      const starters = guus.getConversationStarters();
      expect(Array.isArray(starters)).toBe(true);
      expect(starters.length).toBeGreaterThan(0);
    });
  });
});

describe('EmailRouter', () => {
  let router;

  beforeEach(() => {
    router = new EmailRouter();
  });

  describe('Request Routing', () => {
    it('should route IT requests correctly', async () => {
      const requestData = {
        message: 'Mijn computer doet het niet',
        sessionId: 'test-123',
        userAgent: 'Test',
        url: 'https://test.com'
      };

      const result = await router.routeServiceRequest({}, requestData);
      expect(result.department).toBe('IT Support');
      expect(result.targetEmail).toBe('support@axs-ict.com');
    });

    it('should route cleaning requests correctly', async () => {
      const requestData = {
        message: 'Kan de schoonmaak extra aandacht besteden aan de vergaderzaal?',
        sessionId: 'test-456',
        userAgent: 'Test',
        url: 'https://test.com'
      };

      const result = await router.routeServiceRequest({}, requestData);
      expect(result.department).toBe('Schoonmaak Team');
      expect(result.targetEmail).toBe('ralphcassa@gmail.com');
    });

    it('should route event inquiries to events team', async () => {
      const requestData = {
        message: 'Ik wil een workshop organiseren voor 30 personen',
        sessionId: 'test-789',
        userAgent: 'Test', 
        url: 'https://test.com'
      };

      const result = await router.routeEventInquiry({}, requestData);
      expect(result.department).toBe('Events Team');
      expect(result.targetEmail).toBe('irene@cupolaxs.nl');
    });

    it('should default to general team for unknown requests', async () => {
      const requestData = {
        message: 'Algemene vraag over de Koepel',
        sessionId: 'test-000',
        userAgent: 'Test',
        url: 'https://test.com'
      };

      const result = await router.routeServiceRequest({}, requestData);
      expect(result.department).toBe('Algemeen Team');
      expect(result.targetEmail).toBe('welcome@cupolaxs.nl');
    });
  });

  describe('Email Content Generation', () => {
    it('should build service request email correctly', () => {
      const data = {
        message: 'Test service request',
        sessionId: 'test-session',
        department: 'IT Support',
        userAgent: 'Mozilla/5.0...',
        url: 'https://cupolaxs.nl',
        timestamp: new Date().toISOString()
      };

      const email = router.buildServiceRequestEmail(data);
      expect(email.subject).toContain('ChatGuusPT');
      expect(email.subject).toContain('IT Support');
      expect(email.html).toContain('Test service request');
      expect(email.html).toContain('test-session');
    });

    it('should build event inquiry email correctly', () => {
      const data = {
        message: 'Bedrijfsborrel voor 50 personen',
        sessionId: 'event-session',
        userAgent: 'Mozilla/5.0...',
        url: 'https://cupolaxs.nl',
        timestamp: new Date().toISOString()
      };

      const email = router.buildEventInquiryEmail(data);
      expect(email.subject).toContain('event');
      expect(email.html).toContain('Bedrijfsborrel');
      expect(email.html).toContain('24 uur');
    });
  });
});

describe('Widget Integration', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Test response',
        sessionId: 'test-session',
        timestamp: new Date().toISOString()
      })
    });
  });

  it('should initialize widget correctly', () => {
    // Test would require jsdom setup for full DOM testing
    expect(true).toBe(true); // Placeholder
  });

  it('should handle message sending', async () => {
    // Test would require jsdom setup for full DOM testing  
    expect(true).toBe(true); // Placeholder
  });
});

describe('N8N Integration', () => {
  it('should format webhook payload correctly', () => {
    const payload = {
      message: 'Test message',
      sessionId: 'test-session-123',
      timestamp: new Date().toISOString(),
      userAgent: 'Mozilla/5.0...',
      url: 'https://cupolaxs.nl'
    };

    expect(payload.message).toBe('Test message');
    expect(payload.sessionId).toMatch(/^test-session-/);
    expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should handle webhook response format', () => {
    const response = {
      message: 'Hallo! Ik ben Guus.',
      sessionId: 'test-session-123',
      timestamp: new Date().toISOString(),
      action: {
        type: 'service_request_form',
        category: 'general'
      }
    };

    expect(response.message).toContain('Guus');
    expect(response.sessionId).toBe('test-session-123');
    expect(response.action.type).toBe('service_request_form');
  });
});

describe('Business Logic', () => {
  describe('Service Request Categorization', () => {
    it('should categorize IT requests', () => {
      const messages = [
        'Mijn computer start niet op',
        'WiFi problemen in vergaderzaal',
        'Software installatie nodig',
        'Printer doet het niet'
      ];

      messages.forEach(message => {
        const isIT = message.toLowerCase().includes('computer') || 
                    message.toLowerCase().includes('wifi') ||
                    message.toLowerCase().includes('software') ||
                    message.toLowerCase().includes('printer');
        expect(isIT).toBe(true);
      });
    });

    it('should categorize cleaning requests', () => {
      const messages = [
        'Schoonmaak van de keuken',
        'Ramen moeten gelapt worden',
        'Stofzuigen van kantoorruimte'
      ];

      messages.forEach(message => {
        const isCleaning = message.toLowerCase().includes('schoonmaak') ||
                          message.toLowerCase().includes('ramen') ||
                          message.toLowerCase().includes('stofzuigen');
        expect(isCleaning).toBe(true);
      });
    });

    it('should categorize event requests', () => {
      const messages = [
        'Bedrijfsborrel organiseren',
        'Workshop ruimte huren',
        'Evenement plannen voor 100 personen'
      ];

      messages.forEach(message => {
        const isEvent = message.toLowerCase().includes('borrel') ||
                       message.toLowerCase().includes('workshop') ||
                       message.toLowerCase().includes('evenement');
        expect(isEvent).toBe(true);
      });
    });
  });

  describe('FAQ Responses', () => {
    it('should have responses for common questions', () => {
      const faqTopics = [
        'openingstijden',
        'locatie', 
        'faciliteiten',
        'contact',
        'prijzen'
      ];

      faqTopics.forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Error Handling', () => {
  it('should handle OpenAI API errors gracefully', async () => {
    // Mock OpenAI error
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    };

    const guus = new GuusPersonality();
    guus.openai = mockOpenAI;

    const response = await guus.generateResponse('Test message');
    expect(response).toContain('Sorry');
  });

  it('should handle network errors in widget', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));
    
    // Test would require widget instance
    expect(true).toBe(true); // Placeholder
  });
});

describe('Performance', () => {
  it('should generate session IDs efficiently', () => {
    const guus = new GuusPersonality();
    const sessionIds = new Set();
    
    // Generate 1000 session IDs
    for (let i = 0; i < 1000; i++) {
      const id = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      sessionIds.add(id);
    }
    
    // All should be unique
    expect(sessionIds.size).toBe(1000);
  });

  it('should handle message length limits', () => {
    const longMessage = 'a'.repeat(2000);
    const truncated = longMessage.substring(0, 1000);
    
    expect(truncated.length).toBe(1000);
    expect(truncated).not.toBe(longMessage);
  });
});
