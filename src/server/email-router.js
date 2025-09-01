/**
 * Email Router Module
 * Handelt automatische doorverwijzing van verzoeken naar juiste teams
 */

import nodemailer from 'nodemailer';

export class EmailRouter {
  constructor() {
    this.emailConfig = {
      general: process.env.EMAIL_GENERAL || 'welcome@cupolaxs.nl',
      it: process.env.EMAIL_IT || 'support@axs-ict.com', 
      cleaning: process.env.EMAIL_CLEANING || 'ralphcassa@gmail.com',
      events: process.env.EMAIL_EVENTS || 'irene@cupolaxs.nl'
    };

    this.transporter = this.createTransporter();
  }

  createTransporter() {
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️  SMTP not configured - emails will be logged only');
      return null;
    }

    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async routeServiceRequest(intent, requestData) {
    const { message, sessionId, userAgent, url } = requestData;
    
    // Determine routing based on intent analysis
    let targetEmail = this.emailConfig.general;
    let department = 'Algemeen Team';

    // Analyze message content for routing
    const lowerMessage = message.toLowerCase();
    
    if (this.isITRequest(lowerMessage)) {
      targetEmail = this.emailConfig.it;
      department = 'IT Support';
    } else if (this.isCleaningRequest(lowerMessage)) {
      targetEmail = this.emailConfig.cleaning;
      department = 'Schoonmaak Team';
    } else if (this.isExistingEventRequest(lowerMessage)) {
      targetEmail = this.emailConfig.general;
      department = 'Events Coordinatie';
    }

    const emailContent = this.buildServiceRequestEmail({
      message,
      sessionId,
      department,
      userAgent,
      url,
      timestamp: new Date().toISOString()
    });

    await this.sendEmail(targetEmail, emailContent);

    return {
      targetEmail,
      department,
      emailSent: true
    };
  }

  async routeEventInquiry(intent, requestData) {
    const { message, sessionId, userAgent, url } = requestData;
    
    const emailContent = this.buildEventInquiryEmail({
      message,
      sessionId,
      userAgent,
      url,
      timestamp: new Date().toISOString()
    });

    await this.sendEmail(this.emailConfig.events, emailContent);

    return {
      targetEmail: this.emailConfig.events,
      department: 'Events Team',
      emailSent: true
    };
  }

  isITRequest(message) {
    const itKeywords = [
      'computer', 'laptop', 'internet', 'wifi', 'netwerk',
      'software', 'systeem', 'inloggen', 'wachtwoord',
      'email', 'printer', 'beamer', 'presentatie',
      'technisch', 'it', 'ict', 'helpdesk'
    ];
    
    return itKeywords.some(keyword => message.includes(keyword));
  }

  isCleaningRequest(message) {
    const cleaningKeywords = [
      'schoonmaak', 'schoon', 'vuil', 'opruimen',
      'stofzuigen', 'dweil', 'ramen', 'toilet',
      'afval', 'vuilnis', 'hygiëne', 'cleaning'
    ];
    
    return cleaningKeywords.some(keyword => message.includes(keyword));
  }

  isExistingEventRequest(message) {
    const existingEventKeywords = [
      'bestaand evenement', 'geplande bijeenkomst', 'lopend event',
      'wijziging evenement', 'annuleren', 'verplaatsen',
      'aanpassing', 'extra faciliteiten'
    ];
    
    return existingEventKeywords.some(keyword => message.includes(keyword));
  }

  buildServiceRequestEmail({ message, sessionId, department, userAgent, url, timestamp }) {
    return {
      subject: `🤖 Nieuwe servicevraag via ChatGuusPT - ${department}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🤖 ChatGuusPT Serviceverzoek</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Doorgestuurd naar: ${department}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin-top: 0;">📝 Bericht van gebruiker:</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
            <h3 style="color: #1e293b; margin-top: 0;">ℹ️ Technische informatie:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 120px;"><strong>Sessie ID:</strong></td>
                <td style="padding: 8px 0; color: #1e293b;">${sessionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Tijdstip:</strong></td>
                <td style="padding: 8px 0; color: #1e293b;">${new Date(timestamp).toLocaleString('nl-NL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Website:</strong></td>
                <td style="padding: 8px 0; color: #1e293b;"><a href="${url}" style="color: #2563eb;">${url}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Browser:</strong></td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 12px;">${userAgent}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #64748b; font-size: 12px;">
            Dit bericht is automatisch gegenereerd door ChatGuusPT • 
            <a href="mailto:welcome@cupolaxs.nl" style="color: #2563eb;">Neem contact op</a> bij vragen
          </div>
        </div>
      `
    };
  }

  buildEventInquiryEmail({ message, sessionId, userAgent, url, timestamp }) {
    return {
      subject: `🎉 Nieuwe event uitvraag via ChatGuusPT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🎉 Nieuwe Event Uitvraag</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Via ChatGuusPT</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0;">
            <h3 style="color: #15803d; margin-top: 0;">💬 Bericht van potentiële klant:</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #bbf7d0; border-top: none;">
            <h3 style="color: #15803d; margin-top: 0;">📋 Vervolgacties:</h3>
            <ul style="color: #166534; line-height: 1.6;">
              <li>Neem binnen 24 uur contact op met de klant</li>
              <li>Vraag door naar specifieke event details</li>
              <li>Plan een bezichtiging of videocall</li>
              <li>Stuur passende offerte</li>
            </ul>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #bbf7d0; border-top: none;">
            <h3 style="color: #15803d; margin-top: 0;">ℹ️ Technische informatie:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 120px;"><strong>Sessie ID:</strong></td>
                <td style="padding: 8px 0; color: #15803d;">${sessionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Tijdstip:</strong></td>
                <td style="padding: 8px 0; color: #15803d;">${new Date(timestamp).toLocaleString('nl-NL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Website:</strong></td>
                <td style="padding: 8px 0; color: #15803d;"><a href="${url}" style="color: #16a34a;">${url}</a></td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #166534; font-size: 12px;">
            Dit bericht is automatisch gegenereerd door ChatGuusPT • 
            <a href="mailto:irene@cupolaxs.nl" style="color: #16a34a;">Direct contact: irene@cupolaxs.nl</a>
          </div>
        </div>
      `
    };
  }

  async sendEmail(to, emailContent) {
    const emailData = {
      from: `"Guus van de Koepel" <noreply@cupolaxs.nl>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail(emailData);
        console.log(`✅ Email sent to ${to}:`, result.messageId);
        return result;
      } catch (error) {
        console.error(`❌ Email send failed to ${to}:`, error);
        throw error;
      }
    } else {
      // Log email for development/testing
      console.log(`📧 [EMAIL LOG] To: ${to}`);
      console.log(`📧 [EMAIL LOG] Subject: ${emailData.subject}`);
      console.log(`📧 [EMAIL LOG] Content: ${emailContent.html.substring(0, 200)}...`);
      
      return { messageId: 'logged-only-' + Date.now() };
    }
  }

  // Test email configuration
  async testEmailConfig() {
    if (!this.transporter) {
      return { success: false, message: 'SMTP not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration valid' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get routing statistics
  getRoutingStats() {
    return {
      emailConfig: this.emailConfig,
      smtpConfigured: !!this.transporter,
      availableDepartments: [
        'Algemeen Team (welcome@cupolaxs.nl)',
        'IT Support (support@axs-ict.com)',
        'Schoonmaak Team (ralphcassa@gmail.com)', 
        'Events Team (irene@cupolaxs.nl)'
      ]
    };
  }
}
