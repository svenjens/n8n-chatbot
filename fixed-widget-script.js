/**
 * 🔧 FIXED ChatGuus Widget Script
 * 
 * Deze versie test de gefixtе primaryColor functionaliteit.
 * Vervang je huidige script met deze versie.
 */

(function () {
  console.log('🚀 ChatGuus Fixed Widget Script Started');
  
  // Debug functie
  function debugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ChatGuus: ${message}`);
  }
  
  debugLog(`Testing FIXED widget with primaryColor support`);
  debugLog(`Current URL: ${window.location.href}`);
  
  // Laat de widget alleen op /servicerequest (met of zonder trailing slash) laden
  var path = window.location.pathname.toLowerCase().replace(/\/+$/,'');
  debugLog(`Cleaned path: "${path}"`);
  
  if (path !== '/servicerequest') {
    debugLog(`Path "${path}" does not match "/servicerequest" - widget will not load`, 'warning');
    return;
  }
  
  debugLog('Path check passed - loading FIXED widget', 'success');
  
  // Laad het script pas als we op de juiste pagina zijn
  var s = document.createElement('script');
  s.src = 'https://chatguuspt.netlify.app/.netlify/functions/widget?v=' + Date.now(); // Cache bust
  s.defer = true;
  
  debugLog(`Loading FIXED widget script from: ${s.src}`);
  
  s.onload = function () {
    debugLog('FIXED Widget script loaded successfully', 'success');
    
    if (window.ChatGuus) {
      debugLog('ChatGuus object found - initializing with BLACK color...', 'success');
      
      try {
        const config = {
          theme: 'koepel',
          tenantId: 'mijn-bedrijf',
          primaryColor: '#000000', // ⚫ ZWART - Dit zou nu moeten werken!
          position: 'bottom-right',
          welcomeMessage: 'Wat kan ik voor je doen?'
        };
        
        debugLog(`Widget config: ${JSON.stringify(config, null, 2)}`);
        
        ChatGuus.init(config);
        
        debugLog('🎉 ChatGuus initialized with BLACK color!', 'success');
        
        // Uitgebreide controle na initialisatie
        setTimeout(() => {
          debugLog('🔍 Checking if primaryColor was applied...');
          
          // Check CSS custom property
          const rootStyles = getComputedStyle(document.documentElement);
          const primaryColor = rootStyles.getPropertyValue('--chatguus-primary-color').trim();
          debugLog(`CSS custom property --chatguus-primary-color: "${primaryColor}"`);
          
          // Check toggle button
          const toggleElement = document.querySelector('.chatguus-toggle');
          if (toggleElement) {
            const toggleStyle = window.getComputedStyle(toggleElement);
            const backgroundColor = toggleStyle.backgroundColor;
            debugLog(`Toggle button background-color: ${backgroundColor}`);
            
            // Convert RGB to hex for comparison
            const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
                .map(x => parseInt(x).toString(16).padStart(2, '0'))
                .join('');
              debugLog(`Toggle button color in hex: ${hex}`);
              
              if (hex === '#000000' || backgroundColor === 'rgb(0, 0, 0)') {
                debugLog('🎉 SUCCESS: Toggle button is BLACK!', 'success');
              } else {
                debugLog('❌ FAILED: Toggle button is NOT black', 'error');
                debugLog(`Expected: #000000 or rgb(0, 0, 0), Got: ${backgroundColor}`, 'error');
              }
            }
            
            debugLog(`Toggle button position: ${toggleStyle.position}`);
            debugLog(`Toggle button z-index: ${toggleStyle.zIndex}`);
            debugLog(`Toggle button display: ${toggleStyle.display}`);
            
          } else {
            debugLog('❌ Toggle button not found in DOM', 'error');
          }
          
          // Check widget elements
          const widgetElement = document.querySelector('.chatguus-widget');
          debugLog(`Widget element found: ${!!widgetElement}`);
          
          // Final status
          if (toggleElement && primaryColor === '#000000') {
            debugLog('🎉 COMPLETE SUCCESS: Widget loaded with black color!', 'success');
            debugLog('👀 Look for the black chat button in the bottom-right corner!', 'success');
          } else {
            debugLog('❌ Something went wrong with color application', 'error');
          }
          
        }, 2000); // Wait 2 seconds for full initialization
        
      } catch (error) {
        debugLog(`Error initializing ChatGuus: ${error.message}`, 'error');
        debugLog(`Error stack: ${error.stack}`, 'error');
      }
    } else {
      debugLog('ChatGuus object not found after script load', 'error');
    }
  };
  
  s.onerror = function(error) {
    debugLog('Failed to load widget script', 'error');
    debugLog(`Error: ${JSON.stringify(error)}`, 'error');
  };
  
  debugLog('Appending FIXED script to document body...');
  document.body.appendChild(s);
  
})();
