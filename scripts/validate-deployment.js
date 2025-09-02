#!/usr/bin/env node

/**
 * 🔍 Deployment Validation Script
 * 
 * This script validates that all required environment variables
 * and configuration is properly set up for GitHub Actions deployment.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  log(`\n${colors.bold}🔍 ${message}${colors.reset}`);
}

async function validateGitRepository() {
  header('Git Repository Validation');
  
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    success(`Git remote configured: ${remoteUrl}`);
    
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    success(`Current branch: ${currentBranch}`);
    
    return true;
  } catch (err) {
    error('Git repository not properly configured');
    error('Run: git remote add origin <your-repo-url>');
    return false;
  }
}

async function validatePackageJson() {
  header('Package.json Validation');
  
  try {
    const packagePath = resolve('./package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = ['build', 'test', 'lint'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      success('All required npm scripts are present');
    } else {
      error(`Missing npm scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (err) {
    error('Unable to read package.json');
    return false;
  }
}

async function validateNetlifyConfig() {
  header('Netlify Configuration Validation');
  
  const netlifyTomlPath = resolve('./netlify.toml');
  if (!existsSync(netlifyTomlPath)) {
    error('netlify.toml not found');
    return false;
  }
  
  try {
    const netlifyConfig = readFileSync(netlifyTomlPath, 'utf8');
    
    const requiredSections = ['[build]', '[functions]'];
    const missingSections = requiredSections.filter(section => !netlifyConfig.includes(section));
    
    if (missingSections.length === 0) {
      success('Netlify configuration looks good');
    } else {
      error(`Missing netlify.toml sections: ${missingSections.join(', ')}`);
      return false;
    }
    
    // Check for functions directory
    if (existsSync('./netlify/functions')) {
      success('Netlify functions directory exists');
    } else {
      warning('Netlify functions directory not found');
    }
    
    return true;
  } catch (err) {
    error('Unable to validate netlify.toml');
    return false;
  }
}

async function validateGitHubWorkflows() {
  header('GitHub Workflows Validation');
  
  const workflowsPath = resolve('./.github/workflows');
  if (!existsSync(workflowsPath)) {
    error('.github/workflows directory not found');
    return false;
  }
  
  const deployWorkflow = resolve('./.github/workflows/deploy.yml');
  const testWorkflow = resolve('./.github/workflows/test.yml');
  
  if (existsSync(deployWorkflow)) {
    success('Deploy workflow exists');
  } else {
    error('deploy.yml workflow not found');
    return false;
  }
  
  if (existsSync(testWorkflow)) {
    success('Test workflow exists');
  } else {
    warning('test.yml workflow not found (recommended)');
  }
  
  return true;
}

async function validateBuildProcess() {
  header('Build Process Validation');
  
  try {
    info('Testing build process...');
    execSync('npm ci', { stdio: 'pipe' });
    success('Dependencies installed successfully');
    
    execSync('npm run build', { stdio: 'pipe' });
    success('Build completed successfully');
    
    if (existsSync('./dist')) {
      success('Build output directory (dist) created');
    } else {
      error('Build output directory not found');
      return false;
    }
    
    return true;
  } catch (err) {
    error('Build process failed');
    error(err.message);
    return false;
  }
}

async function validateLighthouseConfig() {
  header('Lighthouse Configuration Validation');
  
  const lighthousePath = resolve('./lighthouserc.js');
  if (existsSync(lighthousePath)) {
    success('Lighthouse configuration exists');
    return true;
  } else {
    warning('lighthouserc.js not found (performance audits will be skipped)');
    return true; // Not critical
  }
}

async function printSecretsInstructions() {
  header('GitHub Secrets Setup Instructions');
  
  info('To complete the setup, add these secrets to your GitHub repository:');
  info('');
  info('1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions');
  info('2. Add the following Repository Secrets:');
  info('');
  info('   🔑 NETLIFY_AUTH_TOKEN');
  info('      - Get from: https://app.netlify.com/user/applications');
  info('      - Create new access token');
  info('');
  info('   🆔 NETLIFY_SITE_ID');
  info('      - Get from: Your Netlify site → Settings → General → Site ID');
  info('');
  info('3. Push your code to trigger the first deployment!');
}

async function main() {
  log(`${colors.bold}🚀 ChatGuusPT Deployment Validation${colors.reset}\n`);
  
  const validations = [
    validateGitRepository,
    validatePackageJson,
    validateNetlifyConfig,
    validateGitHubWorkflows,
    validateBuildProcess,
    validateLighthouseConfig
  ];
  
  let allValid = true;
  
  for (const validation of validations) {
    const result = await validation();
    if (!result) {
      allValid = false;
    }
  }
  
  if (allValid) {
    log(`\n${colors.green}${colors.bold}✅ All validations passed!${colors.reset}`);
    await printSecretsInstructions();
  } else {
    log(`\n${colors.red}${colors.bold}❌ Some validations failed. Please fix the issues above.${colors.reset}`);
    process.exit(1);
  }
}

main().catch(err => {
  error('Validation script failed');
  console.error(err);
  process.exit(1);
});
