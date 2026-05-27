import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('forte_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('forte_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (newToken, newUser) => {
    localStorage.setItem('forte_token', newToken);
    localStorage.setItem('forte_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('forte_token');
    localStorage.removeItem('forte_user');
    setToken(null);
    setUser(null);
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
