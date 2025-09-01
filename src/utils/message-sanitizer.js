/**
 * Message Sanitizer
 * Zorgt voor veilige message processing en HTML stripping
 */

export class MessageSanitizer {
  constructor() {
    // Allowed HTML tags for safe rendering
    this.allowedTags = ['strong', 'em', 'code', 'br'];
    
    // Dangerous patterns to remove
    this.dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
  }

  // Main sanitization method
  sanitizeMessage(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let sanitized = content;

    // Remove dangerous patterns first
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Strip HTML if requested (default behavior)
    if (options.stripHTML !== false) {
      sanitized = this.stripHTML(sanitized);
    }

    // Apply safe formatting
    sanitized = this.applySafeFormatting(sanitized, options);

    // Limit length if specified
    if (options.maxLength) {
      sanitized = this.truncateMessage(sanitized, options.maxLength);
    }

    // Final cleanup
    sanitized = this.finalCleanup(sanitized);

    return sanitized;
  }

  stripHTML(content) {
    return content
      // Remove all HTML tags except allowed ones
      .replace(/<(?!\/?(?:strong|em|code|br)\b)[^>]*>/gi, '')
      // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&nbsp;/g, ' ');
  }

  applySafeFormatting(content, options = {}) {
    let formatted = content;

    // Convert markdown-style formatting to HTML
    if (options.allowMarkdown !== false) {
      formatted = formatted
        // Bold text: **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        
        // Italic text: *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        
        // Inline code: `text`
        .replace(/`(.*?)`/g, '<code>$1</code>')
        
        // Line breaks
        .replace(/\n/g, '<br>')
        
        // Bullet points
        .replace(/^• /gm, '• ')
        .replace(/^- /gm, '• ')
        
        // Numbered lists (make numbers bold)
        .replace(/^(\d+)\. /gm, '<strong>$1.</strong> ');
    }

    return formatted;
  }

  truncateMessage(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at word boundary
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  finalCleanup(content) {
    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
      
      // Trim
      .trim();
  }

  // Validate message content
  validateMessage(content, options = {}) {
    const errors = [];

    if (!content) {
      errors.push('Message content is required');
    }

    if (typeof content !== 'string') {
      errors.push('Message content must be a string');
    }

    if (content.length > (options.maxLength || 2000)) {
      errors.push(`Message too long (max ${options.maxLength || 2000} characters)`);
    }

    if (content.length < (options.minLength || 1)) {
      errors.push(`Message too short (min ${options.minLength || 1} characters)`);
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        errors.push('Message contains potentially dangerous content');
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Extract plain text from message (no formatting)
  extractPlainText(content) {
    return content
      .replace(/<[^>]*>/g, '') // Remove all HTML
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/`(.*?)`/g, '$1') // Remove markdown code
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Format message for email (preserve some formatting)
  formatForEmail(content) {
    let formatted = this.stripHTML(content);
    
    // Convert to email-safe HTML
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '&bull; ');

    return formatted;
  }

  // Format message for logging (plain text)
  formatForLogging(content) {
    const plainText = this.extractPlainText(content);
    
    // Truncate for logs
    return this.truncateMessage(plainText, 500);
  }

  // Check if content contains HTML
  containsHTML(content) {
    return /<[^>]*>/g.test(content);
  }

  // Get content statistics
  getContentStats(content) {
    const plainText = this.extractPlainText(content);
    
    return {
      originalLength: content.length,
      plainTextLength: plainText.length,
      containsHTML: this.containsHTML(content),
      wordCount: plainText.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: content.split('\n').length,
      hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu.test(content)
    };
  }
}

// Export singleton instance
export const messageSanitizer = new MessageSanitizer();

// Utility functions
export function sanitizeUserInput(input, options = {}) {
  return messageSanitizer.sanitizeMessage(input, {
    stripHTML: true,
    maxLength: 1000,
    allowMarkdown: false,
    ...options
  });
}

export function sanitizeBotResponse(response, options = {}) {
  return messageSanitizer.sanitizeMessage(response, {
    stripHTML: false, // Allow some HTML in bot responses
    maxLength: 2000,
    allowMarkdown: true,
    ...options
  });
}

export function validateChatMessage(message) {
  return messageSanitizer.validateMessage(message, {
    maxLength: 1000,
    minLength: 1
  });
}
