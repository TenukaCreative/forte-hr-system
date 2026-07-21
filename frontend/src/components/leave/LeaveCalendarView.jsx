import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { C, card, formatDate, LEAVE_CALENDAR } from '../theme';
import { Badge } from '../ui';
import api from '../../api/axios';

// Human-readable status text for the day tooltip.
const STATUS_TEXT = {
  PENDING: 'Pending',
  MANAGER_APPROVED: 'Manager Approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
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

// Whether a date falls within a request's/plan's range (inclusive).
const isLeaveOnDate = (item, date) => {
  const day = ymd(date);
  return item.startDate <= day && day <= item.endDate;
};

export default function LeaveCalendarView({
  requests = [],
  plans = [],
  getLeaveTypeColor = () => '#7288AE',
  getLeaveTypeTextColor = () => '#FFFFFF',
  leaveTypeLabels = {},
}) {
  const typeLabel = (type) => leaveTypeLabels[type] || type;
  const [viewDate, setViewDate] = useState(new Date());
  const [openDay, setOpenDay] = useState(null); // YYYY-MM-DD of the open popover
  const [holidays, setHolidays] = useState([]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = ymd(new Date());

  useEffect(() => {
    api.get('/calendar/shared')
      .then((r) => {
        const events = Array.isArray(r.data) ? r.data : (r.data?.value || []);
        setHolidays(events);
      })
      .catch((err) => {
        console.error('[LeaveCalendar] Failed to fetch shared calendar:', err?.response?.status, err?.response?.data || err?.message);
        setHolidays([]);
      });
  }, [year]);

  const days = getDaysInMonth(year, month);
  // Leading blanks so the 1st lands under the right weekday (Mon-first grid).
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const leading = Array.from({ length: firstWeekday }, () => null);
  const cells = [...leading, ...days];

  // Outlook events (from the shared mailbox) keyed by YYYY-MM-DD. A single day
  // may carry more than one holiday, so each key holds an array of subjects.
  const holidayMap = {};
  holidays.forEach((event) => {
    // Backend returns start as a flat string (already extracted from Graph's start.dateTime)
    const raw = typeof event.start === 'string'
      ? event.start
      : (event.start?.dateTime || event.start?.date);
    if (!raw) return;
    const key = raw.slice(0, 10); // "YYYY-MM-DD"
    if (!holidayMap[key]) holidayMap[key] = [];
    // Backend renames subject → title
    holidayMap[key].push(event.title || event.subject || 'Holiday');
  });

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
            color: i >= 5 ? C.muted : C.faint, padding: '4px 0',
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
          // Rejected requests are ignored on the calendar (not highlighted).
          const leave = requests.find(
            (r) => isLeaveOnDate(r, date)
          ) || null;
          const plan = plans.find((p) => isLeaveOnDate(p, date)) || null;
          const dayHolidays = holidayMap[dateStr] || [];

          // Background + text. A leave request takes priority over a plan.
          let bg = isWeekend ? LEAVE_CALENDAR.weekendBg : LEAVE_CALENDAR.defaultBg;
          let textColor = C.dark;
          if (leave) {
            if (leave.status === 'APPROVED') {
              bg = LEAVE_CALENDAR.approvedBg;
              textColor = LEAVE_CALENDAR.approvedText;
            } else if (leave.status === 'REJECTED') {
              bg = LEAVE_CALENDAR.rejectedBg;
              textColor = LEAVE_CALENDAR.rejectedText;
            } else {
              bg = LEAVE_CALENDAR.pendingBg;
              textColor = LEAVE_CALENDAR.pendingText;
            }
          } else if (plan) {
            bg = LEAVE_CALENDAR.planBg;
            textColor = LEAVE_CALENDAR.planText;
          }
          // A day with both a request and a plan shows the request colour plus a dot.
          const showPlanDot = !!(leave && plan);

          // Day tooltip text.
          const titleParts = [];
          if (leave) titleParts.push(`${typeLabel(leave.leaveType)} — ${STATUS_TEXT[leave.status] || leave.status}`);
          if (plan) titleParts.push('Planned Leave');
          const title = titleParts.join(' · ');

          return (
            <div
              key={dateStr}
              title={title || undefined}
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
                background: bg,
                color: textColor,
                fontWeight: isToday ? 700 : (leave || plan ? 600 : 400),
                textDecoration: isToday ? 'underline' : 'none',
                border: isToday ? `1px solid ${LEAVE_CALENDAR.todayBorder}` : `1px solid ${C.border}`,
              }}
            >
              {date.getDate()}

              {dayHolidays.map((name, hi) => (
                <div key={hi} style={{
                  position: 'absolute',
                  bottom: 4 + hi * 14,
                  left: 2,
                  right: 2,
                  borderRadius: 3,
                  padding: '1px 4px',
                  fontSize: 9,
                  fontWeight: 600,
                  background: LEAVE_CALENDAR.holidayBg,
                  color: LEAVE_CALENDAR.holidayText,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
                  title={name}
                >
                  🇰🇭 {name}
                </div>
              ))}

              {showPlanDot && (
                <span style={{
                  position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 5, height: 5, borderRadius: '50%', background: LEAVE_CALENDAR.planDot,
                }} />
              )}

              {leave && openDay === dateStr && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10,
                    width: 220, background: LEAVE_CALENDAR.defaultBg, border: `1px solid ${C.border}`,
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 14,
                    textAlign: 'left', cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{typeLabel(leave.leaveType)}</span>
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
          { label: 'Approved Leave', color: LEAVE_CALENDAR.approvedBg },
          { label: 'Pending Leave', color: LEAVE_CALENDAR.pendingBg },
          { label: 'Rejected Leave', color: LEAVE_CALENDAR.rejectedBg },
          { label: 'Planned Leave', color: LEAVE_CALENDAR.planDot },
          { label: 'Public Holiday', color: LEAVE_CALENDAR.holidayBg },
          { label: 'Today', color: LEAVE_CALENDAR.todayBorder },
        ].map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, border: `1px solid ${C.border}` }} />
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
