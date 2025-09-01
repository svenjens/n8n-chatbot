/**
 * Service Request Handler Module
 * Handelt logging en verwerking van serviceverzoeken
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export class ServiceRequestHandler {
  constructor() {
    this.sheetsId = process.env.GOOGLE_SHEETS_ID;
    this.serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    this.doc = null;
    
    this.initializeSheets();
  }

  async initializeSheets() {
    if (!this.sheetsId || !this.serviceAccountKey) {
      console.warn('⚠️  Google Sheets not configured - interactions will be logged to console only');
      return;
    }

    try {
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: this.serviceAccountKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.doc = new GoogleSpreadsheet(this.sheetsId, serviceAccountAuth);
      await this.doc.loadInfo();
      
      console.log(`✅ Google Sheets connected: ${this.doc.title}`);
      
      // Ensure required sheets exist
      await this.ensureRequiredSheets();
      
    } catch (error) {
      console.error('❌ Google Sheets initialization failed:', error);
      this.doc = null;
    }
  }

  async ensureRequiredSheets() {
    const requiredSheets = [
      {
        title: 'Chat Interactions',
        headers: ['Timestamp', 'Session ID', 'Message', 'Response', 'Intent', 'User Agent', 'URL', 'Status']
      },
      {
        title: 'Service Requests', 
        headers: ['Timestamp', 'Session ID', 'Request Type', 'Message', 'Routed To', 'Status', 'URL']
      },
      {
        title: 'Event Inquiries',
        headers: ['Timestamp', 'Session ID', 'Event Type', 'Message', 'Requirements', 'Status', 'Contact Info']
      }
    ];

    for (const sheetConfig of requiredSheets) {
      let sheet = this.doc.sheetsByTitle[sheetConfig.title];
      
      if (!sheet) {
        console.log(`📊 Creating sheet: ${sheetConfig.title}`);
        sheet = await this.doc.addSheet({ 
          title: sheetConfig.title,
          headerValues: sheetConfig.headers
        });
      } else {
        // Ensure headers are set
        await sheet.loadHeaderRow();
        if (sheet.headerValues.length === 0) {
          await sheet.setHeaderRow(sheetConfig.headers);
        }
      }
    }
  }

  async logInteraction(data) {
    const { sessionId, message, response, intent, timestamp, userAgent, url } = data;
    
    const logEntry = {
      timestamp: new Date(timestamp).toLocaleString('nl-NL'),
      sessionId,
      message: message.substring(0, 500), // Limit message length
      response: response.substring(0, 500),
      intent,
      userAgent: userAgent.substring(0, 200),
      url,
      status: 'Processed'
    };

    if (this.doc) {
      try {
        const sheet = this.doc.sheetsByTitle['Chat Interactions'];
        await sheet.addRow(logEntry);
        console.log(`📊 Logged interaction for session ${sessionId}`);
      } catch (error) {
        console.error('❌ Failed to log to Google Sheets:', error);
        this.logToConsole('INTERACTION', logEntry);
      }
    } else {
      this.logToConsole('INTERACTION', logEntry);
    }
  }

  async logServiceRequest(data) {
    const { sessionId, requestType, message, routedTo, timestamp, url } = data;
    
    const logEntry = {
      timestamp: new Date(timestamp).toLocaleString('nl-NL'),
      sessionId,
      requestType,
      message: message.substring(0, 1000),
      routedTo,
      status: 'Routed',
      url
    };

    if (this.doc) {
      try {
        const sheet = this.doc.sheetsByTitle['Service Requests'];
        await sheet.addRow(logEntry);
        console.log(`📊 Logged service request: ${requestType} → ${routedTo}`);
      } catch (error) {
        console.error('❌ Failed to log service request:', error);
        this.logToConsole('SERVICE_REQUEST', logEntry);
      }
    } else {
      this.logToConsole('SERVICE_REQUEST', logEntry);
    }
  }

  async logEventInquiry(data) {
    const { sessionId, eventType, message, requirements, timestamp, contactInfo } = data;
    
    const logEntry = {
      timestamp: new Date(timestamp).toLocaleString('nl-NL'),
      sessionId,
      eventType: eventType || 'Niet gespecificeerd',
      message: message.substring(0, 1000),
      requirements: requirements || 'Nog te bepalen',
      status: 'New Inquiry',
      contactInfo: contactInfo || 'Via chat'
    };

    if (this.doc) {
      try {
        const sheet = this.doc.sheetsByTitle['Event Inquiries'];
        await sheet.addRow(logEntry);
        console.log(`📊 Logged event inquiry: ${eventType}`);
      } catch (error) {
        console.error('❌ Failed to log event inquiry:', error);
        this.logToConsole('EVENT_INQUIRY', logEntry);
      }
    } else {
      this.logToConsole('EVENT_INQUIRY', logEntry);
    }
  }

  logToConsole(type, data) {
    console.log(`\n📋 [${type} LOG] ${new Date().toISOString()}`);
    console.table(data);
  }

  // Analytics and reporting methods
  async getInteractionStats(days = 7) {
    if (!this.doc) {
      return { error: 'Google Sheets not configured' };
    }

    try {
      const sheet = this.doc.sheetsByTitle['Chat Interactions'];
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentRows = rows.filter(row => {
        const rowDate = new Date(row.get('Timestamp'));
        return rowDate >= cutoffDate;
      });

      const stats = {
        totalInteractions: recentRows.length,
        intentBreakdown: {},
        dailyStats: {},
        averageResponseTime: 'N/A' // Would need to track this separately
      };

      // Calculate intent breakdown
      recentRows.forEach(row => {
        const intent = row.get('Intent') || 'unknown';
        stats.intentBreakdown[intent] = (stats.intentBreakdown[intent] || 0) + 1;
        
        const date = new Date(row.get('Timestamp')).toDateString();
        stats.dailyStats[date] = (stats.dailyStats[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get interaction stats:', error);
      return { error: error.message };
    }
  }

  async exportConversation(sessionId) {
    if (!this.doc) {
      return { error: 'Google Sheets not configured' };
    }

    try {
      const sheet = this.doc.sheetsByTitle['Chat Interactions'];
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      
      const conversationRows = rows.filter(row => 
        row.get('Session ID') === sessionId
      );

      return {
        sessionId,
        totalMessages: conversationRows.length,
        conversation: conversationRows.map(row => ({
          timestamp: row.get('Timestamp'),
          message: row.get('Message'),
          response: row.get('Response'),
          intent: row.get('Intent')
        }))
      };
    } catch (error) {
      console.error('❌ Failed to export conversation:', error);
      return { error: error.message };
    }
  }
}
