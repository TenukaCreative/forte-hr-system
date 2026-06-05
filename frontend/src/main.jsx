import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { msalInstance } from './auth/msalConfig';
import { handleRedirectResult } from './auth/authService';
import './index.css';
import App from './App.jsx';

(async () => {
  await msalInstance.initialize();

  // Complete the redirect flow on return from Microsoft.
  try {
    const result = await handleRedirectResult();
    if (result) {
      localStorage.setItem('forte_token', result.token);
      localStorage.setItem('forte_user', JSON.stringify(result.user));
    }
  } catch (err) {
    console.error('Redirect handling failed:', err);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: "'Inter', sans-serif", fontSize: 14 },
              success: { iconTheme: { primary: '#065F46', secondary: '#D1FAE5' } },
              error:   { iconTheme: { primary: '#C8203D', secondary: '#FEE2E2' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
})();
