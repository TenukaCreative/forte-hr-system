// Shared presentational components for the performance / PMO modules.
// Design tokens and helpers live in ./theme.js.
import { X } from 'lucide-react';
import { C, card, STATUS_BADGE, formatDate, etaColor } from './theme';

// "01 Jun 2026 → 30 Jun 2026" with the end date (ETA) colour-coded.
export function KpiDates({ startDate, endDate, size = 12 }) {
  if (!startDate && !endDate) return null;
  return (
    <span style={{ fontSize: size, fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span style={{ color: C.muted }}>{startDate ? formatDate(startDate) : '—'}</span>
      <span style={{ color: 'rgba(21,22,26,0.3)', margin: '0 6px' }}>→</span>
      <span style={{ color: etaColor(endDate) }}>{endDate ? formatDate(endDate) : '—'}</span>
    </span>
  );
}

const statLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: C.faint,
  margin: 0,
};

export function StatCard({ label, value, sub, color = C.dark }) {
  return (
    <div style={card}>
      <p style={statLabel}>{label}</p>
      <p style={{ fontSize: 40, fontWeight: 600, color, margin: '10px 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub != null && <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        border: '3px solid #E4E3DC', borderTopColor: '#C8203D',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '44px 16px', color: C.faint }}>
      {Icon && <Icon size={30} style={{ color: 'rgba(21,22,26,0.2)', marginBottom: 10 }} />}
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: 'rgba(21,22,26,0.55)' }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: 13 }}>{subtitle}</p>}
    </div>
  );
}

export function Button({ variant = 'primary', children, style = {}, ...props }) {
  const variants = {
    primary: { background: C.accent, color: '#fff', border: `1.5px solid ${C.accent}` },
    outline: { background: '#fff', color: C.accent, border: `1.5px solid ${C.accent}` },
    danger: { background: C.red, color: '#fff', border: `1.5px solid ${C.red}` },
    ghost: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button
      {...props}
      style={{
        padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'opacity 0.15s', ...variants[variant], ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  );
}

export function Badge({ status, children }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.PENDING;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {children || s.label}
    </span>
  );
}

// Pill tab bar matching the Leave page
export function Tabs({ tabs, active, onChange }) {
  return (
    <>
      <style>{`
        .ui-tab { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.18s; background: transparent; color: rgba(21,22,26,0.5); font-family: inherit; }
        .ui-tab:hover { background: rgba(21,22,26,0.05); }
        .ui-tab.active { background: #C8203D; color: #fff; }
      `}</style>
      <div style={{ display: 'inline-flex', flexWrap: 'wrap', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, gap: 2 }}>
        {tabs.map((t) => (
          <button key={t.key} className={`ui-tab${active === t.key ? ' active' : ''}`} onClick={() => onChange(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function Toast({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 340,
    }}>
      {notifications.map((n) => (
        <div key={n.id} style={{
          background: '#15161A',
          color: '#fff',
          borderRadius: 10,
          padding: '14px 16px',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 24px rgba(21,22,26,0.18)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontFamily: 'inherit',
          borderLeft: '3px solid #C8203D',
        }}>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{n.message}</span>
          <button
            onClick={() => onDismiss(n.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 0,
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
