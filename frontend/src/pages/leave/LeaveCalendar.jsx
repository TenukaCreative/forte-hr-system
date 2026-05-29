import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_STYLES = {
  APPROVED: { bg: '#DCFCE7', color: '#16A34A' },
  PENDING:  { bg: '#FEF3C7', color: '#D97706' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
};

function datesInRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const navBtn = {
  background: '#fff',
  border: '1px solid #E4E3DC',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  color: '#15161A',
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'inherit',
  transition: 'border-color 0.18s',
};

export default function LeaveCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    api.get('/leaves/my')
      .then((r) => setLeaves(r.data))
      .catch(() => toast.error('Failed to load calendar'));
  }, []);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const leaveMap = {};
  leaves.forEach((l) => {
    datesInRange(l.startDate, l.endDate).forEach((d) => {
      if (!leaveMap[d]) leaveMap[d] = [];
      leaveMap[d].push(l);
    });
  });

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24 }}>
      <style>{`.cal-nav:hover { border-color: #C8203D !important; }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button className="cal-nav" style={navBtn} onClick={prev}><ChevronLeft size={16} /></button>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#15161A', letterSpacing: '-0.01em' }}>
          {MONTHS[month]} {year}
        </h3>
        <button className="cal-nav" style={navBtn} onClick={next}><ChevronRight size={16} /></button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {DAYS.map((d) => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'rgba(21,22,26,0.35)',
            padding: '8px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} style={{ background: 'transparent' }} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayLeaves = leaveMap[dateStr] || [];
          const isToday = dateStr === todayStr;
          const weekdayIdx = new Date(year, month, day).getDay();
          const isWeekend = weekdayIdx === 0 || weekdayIdx === 6;

          let bg = '#fff';
          if (isToday) bg = 'rgba(200,32,61,0.03)';
          else if (isWeekend) bg = '#FAFAF7';

          return (
            <div
              key={dateStr}
              style={{
                minHeight: 80,
                border: `1px solid ${isToday ? '#C8203D' : '#E4E3DC'}`,
                borderRadius: 8,
                padding: 8,
                background: bg,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: isToday ? 600 : 500,
                color: isToday ? '#C8203D' : '#15161A',
              }}>
                {day}
              </span>
              {dayLeaves.map((l, idx) => {
                const s = STATUS_STYLES[l.status] || STATUS_STYLES.PENDING;
                return (
                  <div
                    key={idx}
                    title={`${l.leaveType} · ${l.status}`}
                    style={{
                      marginTop: idx === 0 ? 4 : 0,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      background: s.bg,
                      color: s.color,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.leaveType}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_STYLES).map(([status, s]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: 12, color: 'rgba(21,22,26,0.5)' }}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
