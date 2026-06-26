import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PlaceholderPage from './components/PlaceholderPage';
import { Spinner } from './components/ui';

import LoginPage from './pages/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';
import SeniorDashboardPage from './pages/dashboard/SeniorDashboardPage';

// HR pages
import EmployeeManagement from './pages/hr/EmployeeManagement';
import EmployeeDetailPage from './pages/hr/EmployeeDetailPage';
import LeaveOverview from './pages/hr/LeaveOverview';
import HolidayManagement from './pages/hr/HolidayManagement';

// Leave pages
import LeavePage from './pages/leave/LeavePage';

// Performance + PMO
import PerformancePage from './pages/performance/PerformancePage';
import SeniorPerformancePage from './pages/performance/SeniorPerformancePage';
import TeamPage from './pages/pmo/TeamPage';

// Calendar
import CompanyCalendar from './pages/calendar/CompanyCalendar';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

// Role Management
import RoleManagementPage from './pages/RoleManagementPage';

// Profile setup / completion
import ProfileCompletePage from './pages/ProfileCompletePage';

function RoleRoute({ roles, children }) {
  const { resolvedRole } = useAuth();
  if (!roles.includes(resolvedRole)) return <Navigate to="/dashboard" replace />;
  return children;
}

function NoAccess() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24,
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#15161A', margin: '0 0 8px' }}>
        No access
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0, maxWidth: 360 }}>
        You don’t have permission to view this page. Contact your administrator if you
        think this is a mistake.
      </p>
    </div>
  );
}

const ALWAYS_ALLOWED = [
  'dashboard',
  'leave_management',
  'performance_evaluation',
  'company_calendar',
];

const PermissionRoute = ({ permission, children }) => {
  const { user, hasPermission } = useAuth();
  const [checking, setChecking] = useState(false);
  const [profileComplete, setProfileComplete] = useState(null);

  const designation = (user?.designation || '').toLowerCase().trim().replace(/\s+/g, ' ');

  const isSuperUser =
    designation.includes('super admin') ||
    designation.includes('superadmin') ||
    designation.includes('hr manager') ||
    designation.includes('hr administrator') ||
    designation === 'administrator';

  const isAlwaysAllowed = ALWAYS_ALLOWED.includes(permission);

  useEffect(() => {
    // Super users and always-allowed pages never need the profile check.
    if (isSuperUser || isAlwaysAllowed || !user) {
      return;
    }

    setChecking(true);
    const token = localStorage.getItem('forte_token');
    fetch(
      `${import.meta.env.VITE_API_URL}/employees/profile-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        setProfileComplete(data.isComplete);
        setChecking(false);
      })
      .catch(() => {
        setProfileComplete(false);
        setChecking(false);
      });
  }, [user, permission]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperUser) return children;

  if (isAlwaysAllowed) {
    return children;
  }

  // Show the spinner until the profile-status check has resolved. The
  // `profileComplete === null` guard matters because on the very first render
  // (before the effect's fetch runs) `checking` is still false — without it we
  // would fall through and redirect to /profile-setup prematurely.
  if (checking || profileComplete === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  if (!profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function PerformanceRouter() {
  const { hasPermission } = useAuth();
  if (hasPermission('team_performance')) {
    return <SeniorPerformancePage />;
  }
  return <PerformancePage />;
}

function DashboardRouter() {
  const { hasPermission } = useAuth();
  if (hasPermission('team_performance')) {
    return <SeniorDashboardPage />;
  }
  return <DashboardPage />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

      {/* Profile setup — reachable by any logged-in user; intentionally NOT
          wrapped by ProfileGate so it can never trap the user in a loop. */}
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileCompletePage /></ProtectedRoute>} />

      {/* Authenticated — all roles */}
      <Route path="/dashboard" element={<ProtectedRoute><PermissionRoute permission="dashboard"><DashboardRouter /></PermissionRoute></ProtectedRoute>} />
      <Route path="/leave"     element={<ProtectedRoute><PermissionRoute permission="leave_management"><LeavePage /></PermissionRoute></ProtectedRoute>} />
      <Route path="/calendar"  element={<ProtectedRoute><PermissionRoute permission="company_calendar"><CompanyCalendar /></PermissionRoute></ProtectedRoute>} />

      {/* Performance — PMO head gets the team view, everyone else their own */}
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="performance_evaluation">
              <PerformanceRouter />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* HR Manager routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="employee_management">
              <EmployeeManagement />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:userId"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="employee_management">
              <EmployeeDetailPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-overview"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="leave_overview">
              <LeaveOverview />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/holidays"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="manage_holidays">
              <HolidayManagement />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* HEAD_OF_PMO routes */}
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="team_performance">
              <TeamPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-approvals"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['SENIOR', 'HR_MANAGER', 'SUPER_ADMIN']}>
              <LeaveOverview />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['SENIOR', 'SUPER_ADMIN']}>
              <SettingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role Management — gated by the role_management permission */}
      <Route
        path="/role-management"
        element={
          <ProtectedRoute>
            <PermissionRoute permission="role_management">
              <RoleManagementPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* IT / Admin */}
      <Route
        path="/system-users"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['SENIOR', 'SUPER_ADMIN']}>
              <PlaceholderPage title="System Users" />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
