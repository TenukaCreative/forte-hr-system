import { createContext, useContext, useState, useEffect } from 'react';
import { loginWithAzure, logoutFromAzure } from '../auth/authService';

const AuthContext = createContext(null);

// Pages every logged-in user can always reach, no assigned role required.
// Admin/PMO areas (employee_management, leave_overview, team_performance,
// role_management) are intentionally NOT included — those require an
// explicitly granted permission.
const ALWAYS_ALLOWED = [
  'dashboard',
  'leave_management',
  'performance_evaluation',
  'company_calendar',
];

function resolveRole(designation) {
  if (!designation) return 'STAFF';
  const lower = designation.trim().toLowerCase();

  if (lower === 'super admin') return 'SUPER_ADMIN';
  if (lower === 'hr manager') return 'HR_MANAGER';
  if (lower.startsWith('head of') || lower.endsWith('lead')) return 'SENIOR';
  if (lower === 'project manager' || lower === 'pm') return 'PMO_MEMBER';
  if (lower === 'business analyst' || lower === 'ba') return 'PMO_MEMBER';

  return 'STAFF';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('forte_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('forte_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('forte_user') || '{}');
      return u.permissions || [];
    } catch { return []; }
  });

  // Keep permissions in sync with the user object once it loads/updates after login.
  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions);
    }
  }, [user]);

  // Whether the current user can access a feature by permission key.
  const hasPermission = (key) => {
    // Super user bypass — same logic as the backend authorizePermission check.
    const designation = (user?.designation || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const isSuperUser =
      designation.includes('super admin') ||
      designation.includes('superadmin') ||
      designation.includes('hr manager') ||
      designation.includes('hr administrator') ||
      designation === 'administrator';

    if (isSuperUser) return true;
    if (ALWAYS_ALLOWED.includes(key)) return true;
    return permissions.includes(key);
  };

  // Whether the logged-in user has finished profile setup. For now this only
  // checks that a user exists client-side — assignedRoleId / contactNumber /
  // joinDate are not in the JWT. Once the gate is wired it will use the
  // /employees/profile-status endpoint instead.
  const isProfileComplete = () => {
    return !!user;
  };

  // Replace the cached user (state + localStorage) after a profile update so
  // the rest of the app sees fresh data without a full page reload.
  const refreshUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('forte_user', JSON.stringify(newUser));
  };

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
    setPermissions([]);
    try {
      await logoutFromAzure();
    } catch {
      // MSAL logout failure must not block local state being cleared
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, resolvedRole: resolveRole(user?.designation), permissions, hasPermission, isProfileComplete, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
