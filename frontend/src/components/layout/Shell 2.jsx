import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
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

  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith('/employees/') ? 'Employee Profile' : '');

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

      <BottomNav />
    </div>
  );
}
