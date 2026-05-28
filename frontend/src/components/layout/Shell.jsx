import { useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { NAV } from './navConfig';
import './Shell.css';

const PAGE_TITLES = {
  '/dashboard':      'Dashboard',
  '/performance':    'My Performance',
  '/leave':          'My Leave',
  '/calendar':       'Company Calendar',
  '/employees':      'Employee Management',
  '/leave-overview': 'Leave Overview',
  '/team':           'Team Performance',
  '/leave-approvals':'Leave Approvals',
  '/kpis':           'KPI Management',
  '/system-users':   'System Users',
};

export default function Shell({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith('/employees/') ? 'Employee Profile' : '');

  // Mobile bottom nav: first 4 items across all sections
  const mobileItems = (NAV[user?.role] || [])
    .flatMap((s) => s.items)
    .slice(0, 4);

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <Sidebar />
      </aside>

      <div className="shell-body">
        <header className="shell-topbar">
          <Topbar title={title} />
        </header>
        <main className="shell-content">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="shell-mobile-nav">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mobile-nav-btn${isActive ? ' active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
