/**
 * Netlify Function: Health Check
 * Simple health check endpoint
 */

exports.handler = async (event, context) => {
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

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'healthy',
      service: 'ChatGuusPT-Netlify',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      platform: 'Netlify Functions',
      mongodb_configured: !!process.env.MONGODB_URI,
      region: process.env.AWS_REGION || 'unknown',
      environment: {
        openai: !!process.env.OPENAI_API_KEY,
        n8n: !!process.env.N8N_WEBHOOK_URL,
        email: !!process.env.EMAIL_GENERAL,
        sheets: !!process.env.GOOGLE_SHEETS_ID
      }
    })
  };
};
