#!/usr/bin/env node

/**
 * 🧪 Test Widget URL Response
 * 
 * Test of de widget URL correct reageert en JavaScript retourneert
 */

import https from 'https';

const WIDGET_URL = 'https://chatguuspt.netlify.app/.netlify/functions/widget';

console.log('🧪 Testing ChatGuus Widget URL...\n');

function testWidgetEndpoint() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(WIDGET_URL, (res) => {
      let data = '';
      
      console.log(`📡 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`);
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      console.log('');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️  Response Time: ${duration}ms`);
        console.log(`📏 Content Length: ${data.length} bytes`);
        console.log('');
        
        // Check if it's valid JavaScript
        const isJS = res.headers['content-type']?.includes('javascript');
        console.log(`📝 Content Type Check: ${isJS ? '✅ JavaScript' : '❌ Not JavaScript'}`);
        
        // Check if it contains expected content
        const hasWidgetClass = data.includes('ChatGuusWidget');
        const hasInitFunction = data.includes('window.ChatGuus');
        const hasStyles = data.includes('.chatguus-toggle');
        
        console.log(`🔍 Content Analysis:`);
        console.log(`   ChatGuusWidget class: ${hasWidgetClass ? '✅' : '❌'}`);
        console.log(`   window.ChatGuus: ${hasInitFunction ? '✅' : '❌'}`);
        console.log(`   CSS styles: ${hasStyles ? '✅' : '❌'}`);
        console.log('');
        
        // Show first 500 characters
        console.log(`📄 Content Preview (first 500 chars):`);
        console.log('─'.repeat(60));
        console.log(data.substring(0, 500));
        console.log('─'.repeat(60));
        
        if (data.length > 500) {
          console.log(`... and ${data.length - 500} more characters`);
        }
        console.log('');
        
        // Look for errors
        if (data.includes('error') || data.includes('Error')) {
          console.log('⚠️  Potential errors found in response:');
          const lines = data.split('\n');
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes('error')) {
              console.log(`   Line ${index + 1}: ${line.trim()}`);
            }
          });
          console.log('');
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          content: data,
          duration,
          isValid: res.statusCode === 200 && hasWidgetClass && hasInitFunction
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('⏰ Request timeout (10s)');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  try {
    const result = await testWidgetEndpoint();
    
    console.log('📊 Test Summary:');
    console.log(`   URL: ${WIDGET_URL}`);
    console.log(`   Status: ${result.isValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Response Time: ${result.duration}ms`);
    console.log(`   Content Size: ${result.content.length} bytes`);
    
    if (!result.isValid) {
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Check if the Netlify function is deployed');
      console.log('2. Verify the function doesn\'t have syntax errors');
      console.log('3. Check Netlify function logs for errors');
      console.log('4. Test the URL directly in a browser');
      process.exit(1);
    } else {
      console.log('\n🎉 Widget endpoint is working correctly!');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Network connectivity problems');
    console.log('2. Netlify site is down or not deployed');
    console.log('3. Function endpoint doesn\'t exist');
    console.log('4. CORS or security issues');
    process.exit(1);
  }
}

main();
