import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_BG = { APPROVED: '#D1FAE5', PENDING: '#FEF3C7', REJECTED: '#FEE2E2' };
const STATUS_COLOR = { APPROVED: '#065F46', PENDING: '#92400E', REJECTED: '#991B1B' };

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

export default function CompanyCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    api.get('/leaves/all')
      .then((r) => setLeaves(r.data.filter((l) => l.status === 'APPROVED')))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
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

  if (loading) return <Shell><div className="spinner-full"><div className="spinner" /></div></Shell>;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1>Company Calendar</h1>
          <p>Approved leave across all staff</p>
        </div>
      </div>

      <div className="card">
        {/* Calendar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={prev}><ChevronLeft size={16} /></button>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {MONTHS[month]} {year}
          </h3>
          <button className="btn-ghost" style={{ padding: '6px 10px' }} onClick={next}><ChevronRight size={16} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(21,22,26,0.4)', padding: '6px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: 72 }} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaveMap[dateStr] || [];
            const isToday = dateStr === today.toISOString().slice(0, 10);
            return (
              <div
                key={dateStr}
                style={{
                  minHeight: 72,
                  border: `1px solid ${isToday ? '#C8203D' : '#E4E3DC'}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  background: isToday ? 'rgba(200,32,61,0.04)' : '#fff',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#C8203D' : '#15161A' }}>{day}</span>
                {dayLeaves.slice(0, 3).map((l, idx) => (
                  <div
                    key={idx}
                    title={l.Employee?.User?.name}
                    style={{
                      marginTop: 3,
                      borderRadius: 3,
                      padding: '2px 5px',
                      fontSize: 10,
                      fontWeight: 500,
                      background: STATUS_BG[l.status] || '#F3F4F6',
                      color: STATUS_COLOR[l.status] || '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.Employee?.User?.name?.split(' ')[0] || 'Leave'}
                  </div>
                ))}
                {dayLeaves.length > 3 && (
                  <div style={{ fontSize: 10, color: 'rgba(21,22,26,0.4)', marginTop: 2 }}>+{dayLeaves.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
