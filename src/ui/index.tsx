import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@gravity-ui/uikit';
import App from './App';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

// Ensure DOM is ready before rendering
const initApp = () => {
  console.log('initApp called');
  const container = document.getElementById('root');
  console.log('Container:', container);
  
  if (container) {
    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <ThemeProvider theme="light">
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
    
    console.log('React app rendered');
  } else {
    console.error('Root element not found');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log('DOM is loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('DOM already loaded, initializing immediately');
  initApp();
}
