#!/usr/bin/env node

/**
 * ChatGuusPT Setup Script
 * Helpt bij de initiële configuratie van het project
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setup() {
  console.log('🤖 ChatGuusPT Setup Wizard\n');
  console.log('Welkom! Ik help je bij het configureren van ChatGuusPT.\n');

  // Check if .env already exists
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await ask('⚠️  .env bestand bestaat al. Overschrijven? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup geannuleerd. Bestaand .env bestand behouden.');
      rl.close();
      return;
    }
  }

  console.log('📝 Configuratie vragen:\n');

  // OpenAI Configuration
  console.log('🤖 OpenAI Configuratie:');
  const openaiKey = await ask('OpenAI API Key: ');

  // N8N Configuration
  console.log('\n🔄 N8N Configuratie:');
  const n8nUrl = await ask('N8N Webhook URL (optioneel): ');

  // Email Configuration
  console.log('\n📧 Email Configuratie:');
  const smtpHost = await ask('SMTP Host (bijv. smtp.gmail.com): ');
  const smtpUser = await ask('SMTP Username: ');
  const smtpPass = await ask('SMTP Password/App Password: ');

  // Google Sheets Configuration
  console.log('\n📊 Google Sheets Configuratie (optioneel):');
  const sheetsId = await ask('Google Sheets ID: ');
  const serviceAccountEmail = await ask('Service Account Email: ');

  // Koepel Email Addresses
  console.log('\n🏢 Koepel Email Configuratie:');
  const emailGeneral = await ask('Algemeen email (default: welcome@cupolaxs.nl): ') || 'welcome@cupolaxs.nl';
  const emailIT = await ask('IT email (default: support@axs-ict.com): ') || 'support@axs-ict.com';
  const emailCleaning = await ask('Schoonmaak email (default: ralphcassa@gmail.com): ') || 'ralphcassa@gmail.com';
  const emailEvents = await ask('Events email (default: irene@cupolaxs.nl): ') || 'irene@cupolaxs.nl';

  // Generate .env file
  const envContent = `# ChatGuusPT Configuration
# Generated on ${new Date().toISOString()}

# OpenAI Configuration
OPENAI_API_KEY=${openaiKey}

# N8N Configuration
${n8nUrl ? `N8N_WEBHOOK_URL=${n8nUrl}` : '# N8N_WEBHOOK_URL=your_n8n_webhook_url_here'}

# Email Configuration
SMTP_HOST=${smtpHost}
SMTP_PORT=587
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}

# Koepel Email Addresses
EMAIL_GENERAL=${emailGeneral}
EMAIL_IT=${emailIT}
EMAIL_CLEANING=${emailCleaning}
EMAIL_EVENTS=${emailEvents}

# Google Sheets Configuration
${sheetsId ? `GOOGLE_SHEETS_ID=${sheetsId}` : '# GOOGLE_SHEETS_ID=your_google_sheets_id'}
${serviceAccountEmail ? `GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccountEmail}` : '# GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com'}
# GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n

# Server Configuration
PORT=3000
NODE_ENV=development

# Security (generate random strings for production)
SESSION_SECRET=chatguus_secret_${Math.random().toString(36).substring(2)}
WEBHOOK_TOKEN=webhook_token_${Math.random().toString(36).substring(2)}
`;

  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ .env bestand aangemaakt: ${envPath}`);

  // Create Google Service Account key file if needed
  if (serviceAccountEmail) {
    console.log('\n📋 Google Service Account Setup:');
    console.log('1. Ga naar Google Cloud Console');
    console.log('2. Maak een Service Account aan');
    console.log('3. Download de JSON key file');
    console.log('4. Plaats de key in je .env als GOOGLE_SERVICE_ACCOUNT_KEY');
    console.log('5. Geef de Service Account toegang tot je Google Sheet');
  }

  // Next steps
  console.log('\n🚀 Volgende stappen:');
  console.log('1. npm run dev - Start development server');
  console.log('2. Open http://localhost:5173 - Bekijk demo');
  console.log('3. Configureer N8N workflow (zie docs/n8n-setup.md)');
  console.log('4. Test de chatbot functionaliteit');
  console.log('5. Deploy naar productie (zie docs/deployment-guide.md)');

  console.log('\n📚 Documentatie:');
  console.log('- README.md - Project overzicht');
  console.log('- docs/n8n-setup.md - N8N workflow configuratie');
  console.log('- docs/deployment-guide.md - Productie deployment');
  console.log('- examples/ - Integratie voorbeelden');

  console.log('\n🎉 ChatGuusPT is klaar voor gebruik!');
  
  rl.close();
}

// Run setup
setup().catch((error) => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
