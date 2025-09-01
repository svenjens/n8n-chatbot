/**
 * Netlify Function: Widget Endpoint
 * Serves the ChatGuusPT widget JavaScript
 */

import fs from 'fs';
import path from 'path';
// Note: __dirname not needed in serverless environment

// Cache widget content
let widgetContent = null;
let widgetCSS = null;

function loadWidgetFiles() {
  if (!widgetContent) {
    try {
      // Use relative paths from the function location
      const widgetPath = '../../src/widget/chatguus.js';
      const cssPath = '../../src/widget/chatguus.css';
      
      widgetContent = fs.readFileSync(widgetPath, 'utf8');
      widgetCSS = fs.readFileSync(cssPath, 'utf8');
    } catch (error) {
      console.error('Failed to load widget files:', error);
      // Fallback content for production
      widgetContent = 'console.error("Widget files not found in production");';
      widgetCSS = '/* CSS not found */';
    }
  }
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    // Load widget files
    loadWidgetFiles();

    // Get tenant ID from query params
    const tenantId = event.queryStringParameters?.tenant || 'koepel';
    
    // Build widget with tenant configuration
    const netlifyConfig = {
      apiEndpoint: '/.netlify/functions/chat',
      tenantId: tenantId,
      fallbackMode: true // Always use fallback on Netlify
    };

    // Inject Netlify-specific configuration
    const configuredWidget = `
      // Netlify Configuration
      window.CHATGUUS_CONFIG = ${JSON.stringify(netlifyConfig)};
      
      // CSS Styles
      const styles = document.createElement('style');
      styles.textContent = \`${widgetCSS}\`;
      document.head.appendChild(styles);
      
      // Widget JavaScript
      ${widgetContent}
      
      // Auto-configure for Netlify
      if (window.ChatGuus) {
        const originalInit = window.ChatGuus.init;
        window.ChatGuus.init = function(options = {}) {
          const netlifyOptions = {
            ...options,
            webhookUrl: window.CHATGUUS_CONFIG.apiEndpoint,
            tenantId: window.CHATGUUS_CONFIG.tenantId,
            fallbackMode: true
          };
          return originalInit(netlifyOptions);
        };
      }
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        'Access-Control-Allow-Origin': '*'
      },
      body: configuredWidget
    };

  } catch (error) {
    console.error('Widget Function Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*'
      },
      body: `
        console.error('ChatGuusPT Widget failed to load:', '${error.message}');
        window.ChatGuus = {
          init: function() {
            console.error('ChatGuusPT Widget not available');
            return null;
          }
        };
      `
    };
  }
};
