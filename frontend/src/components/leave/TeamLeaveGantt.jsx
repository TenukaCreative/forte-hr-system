import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C, card, formatDate, LEAVE_TYPE_LABELS, getLeaveTypeColor, getLeaveTypeTextColor } from '../../components/theme';
import { EmptyState } from '../ui';

const DAY_W = 36;
const COL_W = 160;
const WINDOW_DAYS = 30;

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  ...Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'MANAGER_APPROVED', label: 'Manager Approved' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const BAR = {
  PENDING:          { bg: '#FEF3C7', color: '#92400E', border: '1px dashed #92400E' },
  MANAGER_APPROVED: { bg: '#DBEAFE', color: '#1E40AF', border: '1px solid #1E40AF' },
  APPROVED:         { bg: '#D1FAE5', color: '#065F46', border: '1px solid #065F46' },
  REJECTED:         { bg: '#FEE2E2', color: '#991B1B', border: '1px solid #991B1B' },
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 30 consecutive Date objects beginning at startDate.
const getWindowDates = (startDate, days = WINDOW_DAYS) =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

const isLeaveOnDate = (request, date) => {
  const day = ymd(date);
  return request.startDate <= day && day <= request.endDate;
};

const getUniqueEmployees = (requests) => {
  const map = new Map();
  requests.forEach((r) => {
    const id = r.employee?.id || r.employeeId;
    if (id && !map.has(id)) {
      map.set(id, { id, name: r.employee?.name || 'Employee', jobTitle: r.employee?.jobTitle || '' });
    }
  });
  return [...map.values()];
};

const initials = (name) =>
  (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const dm = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const dmy = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const selectStyle = {
  padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', color: C.dark, background: '#fff', cursor: 'pointer',
};
const navBtn = {
  background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '6px 8px', cursor: 'pointer', color: C.dark, display: 'flex', alignItems: 'center',
};

export default function TeamLeaveGantt({ requests = [], onSelectRequest }) {
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const windowDates = getWindowDates(windowStart);
  const todayStr = ymd(new Date());

  const filtered = requests.filter((r) =>
    (typeFilter === 'ALL' || r.leaveType === typeFilter) &&
    (statusFilter === 'ALL' || r.status === statusFilter)
  );
  const inWindow = filtered.filter((r) => windowDates.some((d) => isLeaveOnDate(r, d)));
  const employees = getUniqueEmployees(inWindow);

  const shift = (deltaDays) => {
    const d = new Date(windowStart);
    d.setDate(windowStart.getDate() + deltaDays);
    setWindowStart(d);
  };

  // First/last window index a request covers (component-scoped so it sees windowDates).
  const barRange = (request) => {
    const start = windowDates.findIndex((d) => isLeaveOnDate(request, d));
    let end = -1;
    for (let i = windowDates.length - 1; i >= 0; i--) {
      if (isLeaveOnDate(request, windowDates[i])) { end = i; break; }
    }
    return { start, end };
  };

  const gridWidth = COL_W + WINDOW_DAYS * DAY_W;

  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setWindowStart(startOfDay(new Date()))} style={{ ...navBtn, padding: '7px 14px', fontWeight: 600, fontSize: 13 }}>
          Today
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => shift(-WINDOW_DAYS)} title="Previous 30 days" style={navBtn}><ChevronLeft size={16} /></button>
          <button onClick={() => shift(WINDOW_DAYS)} title="Next 30 days" style={navBtn}><ChevronRight size={16} /></button>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>
          {dm(windowDates[0])} – {dmy(windowDates[WINDOW_DAYS - 1])}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select style={selectStyle} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {employees.length === 0 ? (
        <div style={{ padding: 32 }}>
          <EmptyState title="No leaves scheduled in this period" subtitle="Try a different date range or filter." />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: gridWidth }}>
            {/* Header row */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              <div style={{
                width: COL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 2,
                background: '#fff', borderRight: `1px solid ${C.border}`,
              }} />
              {windowDates.map((d) => {
                const weekday = (d.getDay() + 6) % 7;
                const isWeekend = weekday >= 5;
                const isToday = ymd(d) === todayStr;
                return (
                  <div key={ymd(d)} style={{
                    width: DAY_W, flexShrink: 0, textAlign: 'center', padding: '8px 0',
                    background: isToday ? '#FFF5F5' : (isWeekend ? '#F9FAFB' : '#fff'),
                    borderTop: isToday ? '2px solid #C8203D' : '2px solid transparent',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: C.dark }}>{d.getDate()}</div>
                    <div style={{ fontSize: 10, color: C.faint, textTransform: 'uppercase' }}>
                      {d.toLocaleDateString('en-GB', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Employee rows */}
            {employees.map((emp) => {
              const empLeaves = inWindow.filter((r) => (r.employee?.id || r.employeeId) === emp.id);
              return (
                <div key={emp.id} style={{ display: 'flex', height: 52, borderBottom: `1px solid ${C.border}` }}>
                  {/* Sticky left employee cell */}
                  <div style={{
                    width: COL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 2,
                    background: '#fff', borderRight: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: '#C8203D', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      {initials(emp.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                      {emp.jobTitle && (
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.jobTitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Day cells + leave bars */}
                  <div style={{ position: 'relative', display: 'flex' }}>
                    {windowDates.map((d) => {
                      const weekday = (d.getDay() + 6) % 7;
                      const isWeekend = weekday >= 5;
                      const isToday = ymd(d) === todayStr;
                      return (
                        <div key={ymd(d)} style={{
                          width: DAY_W, flexShrink: 0,
                          background: isToday ? '#FFF5F5' : (isWeekend ? '#F9FAFB' : '#fff'),
                          borderRight: `1px solid #F1F0EB`,
                        }} />
                      );
                    })}

                    {empLeaves.map((r) => {
                      const { start, end } = barRange(r);
                      if (start === -1 || end === -1) return null;
                      const left = start * DAY_W + 3;
                      const width = (end - start + 1) * DAY_W - 6;
                      const style = BAR[r.status] || BAR.PENDING;
                      return (
                        <div
                          key={r.id}
                          onClick={() => onSelectRequest?.(r)}
                          title={`${emp.name} · ${LEAVE_TYPE_LABELS[r.leaveType] || r.leaveType} · ${formatDate(r.startDate)} → ${formatDate(r.endDate)} · ${r.daysCount} day(s)`}
                          style={{
                            position: 'absolute', top: 11, left, width, height: 30,
                            background: style.bg, color: style.color, border: style.border,
                            borderRadius: 6, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', padding: '0 8px',
                            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {LEAVE_TYPE_LABELS[r.leaveType] || r.leaveType}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, borderTop: `1px solid ${C.border}` }}>
        {[
          { label: 'Pending', key: 'PENDING' },
          { label: 'Manager Approved', key: 'MANAGER_APPROVED' },
          { label: 'Approved', key: 'APPROVED' },
          { label: 'Rejected', key: 'REJECTED' },
        ].map((l) => (
          <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: BAR[l.key].bg, border: BAR[l.key].border }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
