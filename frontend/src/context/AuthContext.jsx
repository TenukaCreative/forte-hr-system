import { createContext, useContext, useState } from 'react';
import { loginWithAzure, logoutFromAzure } from '../auth/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('forte_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('forte_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async () => {
    // Redirects the page away to Microsoft — no return value.
    // Token/user are set in main.jsx once the redirect returns.
    await loginWithAzure();
  };

  const logout = async () => {
    localStorage.removeItem('forte_token');
    localStorage.removeItem('forte_user');
    setToken(null);
    setUser(null);
    try {
      await logoutFromAzure();
    } catch {
      // MSAL logout failure must not block local state being cleared
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
