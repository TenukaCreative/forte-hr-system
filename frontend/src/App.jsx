import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PlaceholderPage from './components/PlaceholderPage';

import LoginPage from './pages/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// HR pages
import EmployeeManagement from './pages/hr/EmployeeManagement';
import EmployeeDetailPage from './pages/hr/EmployeeDetailPage';
import LeaveOverview from './pages/hr/LeaveOverview';

// Leave pages
import LeavePage from './pages/leave/LeavePage';

// Performance + PMO
import PerformancePage from './pages/performance/PerformancePage';
import PMOPerformancePage from './pages/performance/PMOPerformancePage';
import TeamPage from './pages/pmo/TeamPage';

// Calendar
import CompanyCalendar from './pages/calendar/CompanyCalendar';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PerformanceRouter() {
  const { user } = useAuth();
  if (user?.role === 'HEAD_OF_PMO') {
    return <PMOPerformancePage />;
  }
  return <PerformancePage />;
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

      {/* Authenticated — all roles */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/leave"     element={<ProtectedRoute><LeavePage /></ProtectedRoute>} />
      <Route path="/calendar"  element={<ProtectedRoute><CompanyCalendar /></ProtectedRoute>} />

      {/* Performance — PMO head gets the team view, everyone else their own */}
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PerformanceRouter />
          </ProtectedRoute>
        }
      />

      {/* HR Manager routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HR_MANAGER', 'IT']}>
              <EmployeeManagement />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:userId"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HR_MANAGER', 'IT']}>
              <EmployeeDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-overview"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HR_MANAGER', 'HEAD_OF_PMO', 'IT']}>
              <LeaveOverview />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* HEAD_OF_PMO routes */}
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HEAD_OF_PMO']}>
              <TeamPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-approvals"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HEAD_OF_PMO', 'HR_MANAGER', 'IT']}>
              <LeaveOverview />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HEAD_OF_PMO']}>
              <SettingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kpis"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HEAD_OF_PMO', 'HR_MANAGER', 'IT']}>
              <PlaceholderPage title="KPI Management" />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* IT / Admin */}
      <Route
        path="/system-users"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['IT']}>
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
