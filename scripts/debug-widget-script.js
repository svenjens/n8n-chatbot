/**
 * 🔍 ChatGuus Widget Debug Script
 * 
 * Vervang je huidige script met deze versie om te debuggen
 * wat er mis gaat met de widget loading.
 */

(function () {
  console.log('🚀 ChatGuus Debug Script Started');
  
  // Debug functie
  function debugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ChatGuus: ${message}`);
  }
  
  // Check current environment
  debugLog(`Current URL: ${window.location.href}`);
  debugLog(`Current pathname: ${window.location.pathname}`);
  debugLog(`User agent: ${navigator.userAgent}`);
  
  // Laat de widget alleen op /servicerequest (met of zonder trailing slash) laden
  var path = window.location.pathname.toLowerCase().replace(/\/+$/,'');
  debugLog(`Cleaned path: "${path}"`);
  
  if (path !== '/servicerequest') {
    debugLog(`Path "${path}" does not match "/servicerequest" - widget will not load`, 'warning');
    return;
  }
  
  debugLog('Path check passed - proceeding with widget load', 'success');
  
  // Check if script already exists
  const existingScript = document.querySelector('script[src*="chatguuspt.netlify.app"]');
  if (existingScript) {
    debugLog('Widget script already exists in DOM', 'warning');
  }
  
  // Laad het script pas als we op de juiste pagina zijn
  var s = document.createElement('script');
  s.src = 'https://chatguuspt.netlify.app/.netlify/functions/widget';
  s.defer = true;
  
  debugLog(`Loading script from: ${s.src}`);
  
  // Add timeout to detect hanging
  const loadTimeout = setTimeout(() => {
    debugLog('Script load timeout - widget may be hanging', 'error');
  }, 10000); // 10 second timeout
  
  s.onload = function () {
    clearTimeout(loadTimeout);
    debugLog('Widget script loaded successfully', 'success');
    
    // Check what's available
    debugLog(`window.ChatGuus available: ${!!window.ChatGuus}`);
    debugLog(`window.CHATGUUS_CONFIG available: ${!!window.CHATGUUS_CONFIG}`);
    
    if (window.ChatGuus) {
      debugLog(`ChatGuus methods: ${Object.keys(window.ChatGuus).join(', ')}`);
      
      try {
        debugLog('Initializing ChatGuus widget...');
        
        const config = {
          theme: 'koepel',
          tenantId: 'mijn-bedrijf',
          primaryColor: '#000000', // Zwart
          position: 'bottom-right',
          welcomeMessage: 'Wat kan ik voor je doen?'
        };
        
        debugLog(`Widget config: ${JSON.stringify(config, null, 2)}`);
        
        ChatGuus.init(config);
        
        debugLog('ChatGuus initialized successfully!', 'success');
        
        // Check if elements were created
        setTimeout(() => {
          const widgetElement = document.querySelector('.chatguus-widget');
          const toggleElement = document.querySelector('.chatguus-toggle');
          
          debugLog(`Widget element created: ${!!widgetElement}`);
          debugLog(`Toggle button created: ${!!toggleElement}`);
          
          if (toggleElement) {
            const style = window.getComputedStyle(toggleElement);
            debugLog(`Toggle button background: ${style.backgroundColor}`);
            debugLog(`Toggle button display: ${style.display}`);
            debugLog(`Toggle button z-index: ${style.zIndex}`);
          }
          
          // Check for any errors in console
          debugLog('Widget initialization complete - check for chat button in bottom-right corner');
          
        }, 1000);
        
      } catch (error) {
        debugLog(`Error initializing ChatGuus: ${error.message}`, 'error');
        debugLog(`Error stack: ${error.stack}`, 'error');
      }
    } else {
      debugLog('ChatGuus object not found after script load', 'error');
      debugLog(`Available globals: ${Object.keys(window).filter(k => k.includes('chat') || k.includes('Chat')).join(', ')}`);
    }
  };
  
  s.onerror = function(error) {
    clearTimeout(loadTimeout);
    debugLog('Failed to load widget script', 'error');
    debugLog(`Error details: ${JSON.stringify(error)}`, 'error');
    
    // Try to get more info about the error
    fetch(s.src, { method: 'HEAD' })
      .then(response => {
        debugLog(`Script URL status: ${response.status} ${response.statusText}`);
        debugLog(`Script URL headers: ${JSON.stringify([...response.headers.entries()])}`);
      })
      .catch(fetchError => {
        debugLog(`Cannot reach script URL: ${fetchError.message}`, 'error');
      });
  };
  
  // Add network error detection
  window.addEventListener('error', function(e) {
    if (e.target !== window && e.target.src && e.target.src.includes('chatguuspt')) {
      debugLog(`Resource error: ${e.target.src}`, 'error');
    }
  });
  
  debugLog('Appending script to document body...');
  document.body.appendChild(s);
  
  // Fallback check
  setTimeout(() => {
    if (!window.ChatGuus) {
      debugLog('Widget failed to load after 15 seconds - checking possible issues:', 'error');
      debugLog('1. Network connectivity issues');
      debugLog('2. CORS policy blocking the request');
      debugLog('3. Content Security Policy blocking scripts');
      debugLog('4. Ad blockers blocking the widget');
      debugLog('5. JavaScript errors preventing execution');
      
      // Check CSP
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (metaCSP) {
        debugLog(`CSP detected: ${metaCSP.content}`, 'warning');
      }
    }
  }, 15000);
  
})();
