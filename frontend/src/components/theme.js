// Forte design tokens, style objects and date helpers.
// Kept separate from ui.jsx so the component file stays fast-refresh friendly.

export const C = {
  bg: '#FAFAF7',
  accent: '#C8203D',
  accentDark: '#a81830',
  dark: '#15161A',
  border: '#E4E3DC',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  muted: 'rgba(21,22,26,0.5)',
  faint: 'rgba(21,22,26,0.4)',
};

export const card = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  padding: 24,
};

export const inputStyle = {
  width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', color: C.dark, background: '#fff', boxSizing: 'border-box',
};

export const fieldLabel = {
  display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

export const STATUS_BADGE = {
  PENDING:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  COMPLETED: { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  ACTIVE:    { bg: '#DCFCE7', color: '#16A34A', label: 'Active' },
  CLOSED:    { bg: '#F1F0EB', color: 'rgba(21,22,26,0.5)', label: 'Closed' },
  OVERDUE:   { bg: '#FEE2E2', color: '#DC2626', label: 'Overdue' },
};

export const scoreColor = (score) => {
  if (score >= 80) return C.green;
  if (score >= 50) return C.amber;
  return C.red;
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDayMonth = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';

export const isOverdue = (deadline, status) =>
  status === 'PENDING' && deadline && new Date(`${deadline}T23:59:59`) < new Date();

// Colour for a KPI's ETA / end date: red if past, amber if within 7 days, else normal.
export const etaColor = (endDate) => {
  if (!endDate) return C.muted;
  const end = new Date(`${endDate}T23:59:59`);
  const now = new Date();
  if (end < now) return C.red;
  const days = (end - now) / (1000 * 60 * 60 * 24);
  if (days <= 7) return C.amber;
  return C.dark;
};

// --- Week / day helpers (week runs Monday → Sunday) ---
export const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  return date;
};

export const endOfWeek = (d = new Date()) => {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

export const sameDay = (a, b) =>
  a && b && new Date(a).toDateString() === new Date(b).toDateString();

export const isToday = (iso) => sameDay(iso, new Date());

export const isThisWeek = (iso) => {
  if (!iso) return false;
  const t = new Date(iso);
  return t >= startOfWeek() && t <= endOfWeek();
};
