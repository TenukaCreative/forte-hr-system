import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { C, card, formatDate } from '../theme';
import { Badge } from '../ui';

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Annual Leave',
  FULL_DAY: 'Full Day Leave',
  HALF_DAY: 'Half Day Leave',
  CHANGE: 'Change Leave',
  HOSPITALIZATION: 'Hospitalization Leave',
  MATERNITY: 'Maternity Leave',
  SICK: 'Sick Leave',
  SPECIAL: 'Special Leave',
};
const leaveTypeLabel = (type) => LEAVE_TYPE_LABELS[type] || type;

const STATUS_CELL = {
  PENDING:          { bg: '#FEF3C7', color: '#D97706' },
  MANAGER_APPROVED: { bg: '#DBEAFE', color: '#2563EB' },
  APPROVED:         { bg: '#D1FAE5', color: '#065F46' },
  REJECTED:         { bg: '#FEE2E2', color: '#991B1B' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Local YYYY-MM-DD (avoids UTC shifting that `toISOString` would introduce).
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Array of Date objects for each day in the given month.
const getDaysInMonth = (year, month) => {
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => new Date(year, month, i + 1));
};

// Whether a date falls within a request's range (inclusive).
const isLeaveOnDate = (request, date) => {
  const day = ymd(date);
  return request.startDate <= day && day <= request.endDate;
};

// First request that covers the given date.
const getLeaveForDate = (requests, date) =>
  requests.find((r) => isLeaveOnDate(r, date)) || null;

export default function LeaveCalendarView({ requests = [] }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [openDay, setOpenDay] = useState(null); // YYYY-MM-DD of the open popover

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = ymd(new Date());

  const days = getDaysInMonth(year, month);
  // Leading blanks so the 1st lands under the right weekday (Mon-first grid).
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const leading = Array.from({ length: firstWeekday }, () => null);
  const cells = [...leading, ...days];

  const prev = () => { setOpenDay(null); setViewDate(new Date(year, month - 1, 1)); };
  const next = () => { setOpenDay(null); setViewDate(new Date(year, month + 1, 1)); };

  return (
    <div style={{ ...card }}>
      {/* Header / month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={prev} title="Previous month" style={navBtn}><ChevronLeft size={18} /></button>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.dark }}>{MONTHS[month]} {year}</h3>
        <button onClick={next} title="Next month" style={navBtn}><ChevronRight size={18} /></button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: i >= 5 ? 'rgba(21,22,26,0.35)' : C.faint, padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} style={{ minHeight: 40 }} />;

          const dateStr = ymd(date);
          const weekday = (date.getDay() + 6) % 7;
          const isWeekend = weekday >= 5;
          const isToday = dateStr === todayStr;
          const leave = getLeaveForDate(requests, date);
          const cellStyle = leave ? STATUS_CELL[leave.status] || STATUS_CELL.PENDING : null;

          return (
            <div
              key={dateStr}
              onClick={() => leave && setOpenDay(openDay === dateStr ? null : dateStr)}
              style={{
                position: 'relative',
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                fontSize: 13,
                cursor: leave ? 'pointer' : 'default',
                background: cellStyle ? cellStyle.bg : (isWeekend ? '#F9FAFB' : '#fff'),
                color: cellStyle ? cellStyle.color : C.dark,
                fontWeight: isToday ? 700 : (leave ? 600 : 400),
                textDecoration: isToday ? 'underline' : 'none',
                border: `1px solid ${C.border}`,
              }}
            >
              {date.getDate()}

              {leave && openDay === dateStr && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10,
                    width: 220, background: '#fff', border: `1px solid ${C.border}`,
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 14,
                    textAlign: 'left', cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{leaveTypeLabel(leave.leaveType)}</span>
                    <button onClick={() => setOpenDay(null)} title="Close" style={{ ...navBtn, padding: 2, border: 'none', background: 'none' }}>
                      <X size={16} />
                    </button>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: C.muted }}>
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted }}>
                    {parseFloat(leave.daysCount) || 0} day{(parseFloat(leave.daysCount) || 0) !== 1 ? 's' : ''}
                  </p>
                  <Badge status={leave.status} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
        {[
          { label: 'Pending', key: 'PENDING' },
          { label: 'Manager Approved', key: 'MANAGER_APPROVED' },
          { label: 'Approved', key: 'APPROVED' },
          { label: 'Rejected', key: 'REJECTED' },
        ].map((l) => (
          <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: STATUS_CELL[l.key].bg, border: `1px solid ${C.border}` }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const navBtn = {
  background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 8px', cursor: 'pointer', color: C.dark, display: 'flex', alignItems: 'center',
};
