import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, LogOut,
  ClipboardList, BarChart3, UserCheck, MoreHorizontal,
  X, TrendingUp, CheckSquare, Shield,
} from 'lucide-react';
import { MASTER_NAV } from './navConfig';

const ACCENT = '#C8203D';
const INACTIVE = '#6B7280';
const BORDER = '#E4E3DC';
const DARK = '#15161A';

// Number of items shown in the main bar; the rest go in the "More" sheet.
const MAIN_COUNT = 4;

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
  const { logout, hasPermission } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Every master-nav item the user has permission for; first few in the bar,
  // the rest in the "More" sheet.
  const visibleItems = MASTER_NAV
    .flatMap((s) => s.items)
    .filter((item) => hasPermission(item.permission));
  const mainItems = visibleItems.slice(0, MAIN_COUNT);
  const moreItems = visibleItems.slice(MAIN_COUNT);
  const hasMore = moreItems.length > 0;

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
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
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

            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
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
