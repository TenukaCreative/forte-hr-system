import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, LogOut,
  ClipboardList, BarChart3, UserCheck, MoreHorizontal,
  X, TrendingUp, CheckSquare, Shield,
} from 'lucide-react';

const ACCENT = '#C8203D';
const INACTIVE = '#6B7280';
const BORDER = '#E4E3DC';
const DARK = '#15161A';

// All possible nav targets keyed by a short id.
const ITEMS = {
  dashboard:       { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
  leave:           { icon: ClipboardList,   label: 'Leave',            path: '/leave' },
  calendar:        { icon: Calendar,        label: 'Calendar',         path: '/calendar' },
  performance:     { icon: TrendingUp,      label: 'Performance',      path: '/performance' },
  team:            { icon: Users,           label: 'Team',             path: '/team' },
  leaveApprovals:  { icon: CheckSquare,     label: 'Leave Approvals',  path: '/leave-approvals' },
  employees:       { icon: UserCheck,       label: 'Employees',        path: '/employees' },
  leaveOverview:   { icon: Shield,          label: 'Leave Overview',   path: '/leave-overview' },
  teamPerformance: { icon: BarChart3,       label: 'Team Performance', path: '/team-performance' },
};

// Main bar + overflow ("More") items per resolved role.
const NAV_BY_ROLE = {
  STAFF:       { main: ['dashboard', 'leave', 'calendar'],                more: [] },
  PMO_MEMBER:  { main: ['dashboard', 'leave', 'performance', 'calendar'], more: [] },
  SENIOR:      { main: ['dashboard', 'leave', 'team', 'leaveApprovals'],  more: ['performance', 'calendar'] },
  HR_MANAGER:  { main: ['dashboard', 'employees', 'leaveOverview', 'calendar'], more: ['leaveApprovals'] },
  SUPER_ADMIN: { main: ['dashboard', 'employees', 'leave', 'team'],       more: ['performance', 'calendar', 'leaveOverview', 'teamPerformance'] },
};

const tabBtn = {
  flex: 1, minWidth: 48, minHeight: 48,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
  fontFamily: 'Inter, sans-serif',
};

const tabLabel = { fontSize: 10, whiteSpace: 'nowrap' };

const sheetRow = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 14, height: 48,
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', fontSize: 15, textAlign: 'left',
};

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { resolvedRole, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const config = NAV_BY_ROLE[resolvedRole] || NAV_BY_ROLE.STAFF;
  const hasMore = config.more.length > 0;

  const isActive = (path) => pathname === path;

  const go = (path) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav
        className="bottom-nav-container"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64, background: '#fff', borderTop: `1px solid ${BORDER}`,
          zIndex: 1000, alignItems: 'center', justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {config.main.map((key) => {
          const item = ITEMS[key];
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={key}
              onClick={() => go(item.path)}
              style={{ ...tabBtn, color: active ? ACCENT : INACTIVE }}
            >
              <Icon size={22} />
              <span style={{ ...tabLabel, fontWeight: active ? 600 : 500 }}>{item.label}</span>
            </button>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setSheetOpen(true)}
            style={{ ...tabBtn, color: sheetOpen ? ACCENT : INACTIVE }}
          >
            <MoreHorizontal size={22} />
            <span style={{ ...tabLabel, fontWeight: 500 }}>More</span>
          </button>
        )}
      </nav>

      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', background: '#fff',
              borderTopLeftRadius: 16, borderTopRightRadius: 16,
              padding: 24, maxHeight: '60vh', overflowY: 'auto',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>More</h3>
              <button
                onClick={() => setSheetOpen(false)}
                title="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: INACTIVE, padding: 4, display: 'flex' }}
              >
                <X size={22} />
              </button>
            </div>

            {config.more.map((key) => {
              const item = ITEMS[key];
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={key}
                  onClick={() => go(item.path)}
                  style={{ ...sheetRow, borderBottom: `1px solid ${BORDER}`, color: active ? ACCENT : DARK }}
                >
                  <Icon size={20} color={active ? ACCENT : INACTIVE} />
                  {item.label}
                </button>
              );
            })}

            <button
              onClick={async () => { setSheetOpen(false); await logout(); }}
              style={{ ...sheetRow, color: DARK }}
            >
              <LogOut size={20} color={INACTIVE} />
              Log out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
