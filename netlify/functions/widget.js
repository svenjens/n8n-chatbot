/**
 * Netlify Function: Widget Endpoint
 * Serves the ChatGuusPT widget JavaScript
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache widget content
let widgetContent = null;
let widgetCSS = null;

function loadWidgetFiles() {
  if (!widgetContent) {
    try {
      const widgetPath = path.join(__dirname, '../../src/widget/chatguus.js');
      const cssPath = path.join(__dirname, '../../src/widget/chatguus.css');
      
      widgetContent = fs.readFileSync(widgetPath, 'utf8');
      widgetCSS = fs.readFileSync(cssPath, 'utf8');
    } catch (error) {
      console.error('Failed to load widget files:', error);
      throw new Error('Widget files not found');
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
