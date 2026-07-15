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
  // Leave workflow statuses
  MANAGER_APPROVED: { bg: '#DBEAFE', color: '#2563EB', label: 'Manager Approved' },
  APPROVED:  { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  REJECTED:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
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

// Apply an alpha channel to a 6-digit hex colour → rgba() string.
export const withAlpha = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Planned leave color
export const PLAN_COLOR = '#305669';

// Leave status styles — shared across all leave UI
export const STATUS_STYLES = {
  PENDING:          { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  MANAGER_APPROVED: { bg: '#DBEAFE', color: '#2563EB', label: 'Manager Approved' },
  APPROVED:         { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  REJECTED:         { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
};

// Leave type background colors
export const LEAVE_TYPE_COLORS = {
  ANNUAL:          '#BA5A5A',
  FULL_DAY:        '#778873',
  HALF_DAY:        '#428475',
  CHANGE:          '#EC6530',
  HOSPITALIZATION: '#9FA1FF',
  MATERNITY:       '#39B1D1',
  SICK:            '#ECB65F',
  SPECIAL:         '#C1EBE9',
  OTHER:           '#7288AE',
};

export const getLeaveTypeColor = (type) => LEAVE_TYPE_COLORS[type] || '#7288AE';

export const LIGHT_LEAVE_TYPES = ['SPECIAL', 'HOSPITALIZATION'];
export const getLeaveTypeTextColor = (type) =>
  LIGHT_LEAVE_TYPES.includes(type) ? C.dark : '#FFFFFF';

export const LEAVE_TYPE_LABELS = {
  ANNUAL:          'Annual Leave',
  FULL_DAY:        'Full Day',
  HALF_DAY:        'Half Day',
  CHANGE:          'Change Leave',
  HOSPITALIZATION: 'Hospitalization',
  MATERNITY:       'Maternity Leave',
  SICK:            'Sick Leave',
  SPECIAL:         'Special Leave',
  OTHER:           'Other',
};

// Leave calendar cell colours — single source of truth for LeaveCalendarView
export const LEAVE_CALENDAR = {
  approvedBg:   '#0070C0',                   // blue
  approvedText: '#ffffff',
  pendingBg:    withAlpha(C.green, 0.5),     // green with alpha
  pendingText:  C.dark,
  planBg:       withAlpha('#BFC6C4', 0.6),   // purple with alpha
  planText:     '#ffffff',
  planDot:      '#BFC6C4',                   // purple dot
  holidayBg:    withAlpha(C.accent, 0.10),   // red tint (unchanged)
  holidayText:  C.accent,
  weekendBg:    '#F9FAFB',
  defaultBg:    '#ffffff',
  todayBorder:  C.accent,                    // red
};
