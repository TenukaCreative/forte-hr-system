import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import App from './App.jsx';

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
