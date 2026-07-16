import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { msalInstance, loginRequest } from '../../auth/msalConfig';
import { C, formatDate, LEAVE_CALENDAR, withAlpha } from '../../components/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
const { hasPermission } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [outlookEvents, setOutlookEvents] = useState([]);
  const [sharedEvents, setSharedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // dateStr or null

  useEffect(() => {
    // HR / Super Admin see everyone's approved leave; other roles only their own.
    const isHr = hasPermission('employee_management');
    if(isHr){  
    api.get('/leaves/all')
      .then((r) => setLeaves(r.data.filter((l) => l.status === 'APPROVED')))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
    }
    else{
      setLoading(false);
    }

    // Outlook events are a bonus layer — fail silently so the calendar
    // still renders leaves if the user hasn't granted calendar access.
    const fetchOutlookEvents = async () => {
      try {
        // Wait for MSAL to finish restoring state from cache
        await msalInstance.initialize();
        await msalInstance.handleRedirectPromise();

        const accounts = msalInstance.getAllAccounts();
        console.log('MSAL accounts found:', accounts.length);
        console.log('Account details:', accounts[0]?.username);
        if (!accounts.length) return;

        const account = accounts[0];
        msalInstance.setActiveAccount(account);

        let msToken;
        try {
          const tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account,
          });
          msToken = tokenResponse.accessToken;
        } catch {
          // fail silently — don't redirect, just skip outlook events
          return;
        }

        const r = await api.get('/calendar/outlook', {
          headers: { 'x-ms-token': msToken },
        });
        setOutlookEvents(r.data || []);
      } catch {
        // fail silently — outlook events are a bonus layer
      }
    };
    fetchOutlookEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const outlookMap = {};
  outlookEvents.forEach((e) => {
    const d = (e.start || '').slice(0, 10);
    if (!d) return;
    if (!outlookMap[d]) outlookMap[d] = [];
    outlookMap[d].push(e);
  });

  const holidayMap = {};
  sharedEvents.forEach((e) => {
    const dateStr = (e.start || '').slice(0, 10);
    if (!dateStr) return;
    holidayMap[dateStr] = { name: e.title, date: dateStr };
  });

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  useEffect(() => {
    api.get('/calendar/shared')
      .then((r) => setSharedEvents(r.data || []))
      .catch(() => {});
  }, []);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (loading) return <Shell><div className="spinner-full"><div className="spinner" /></div></Shell>;

  return (
    <>
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
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.faint, padding: '6px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: 72 }} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaveMap[dateStr] || [];
            const dayOutlook = outlookMap[dateStr] || [];
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const holiday = holidayMap[dateStr];
            return (
              <div
                key={dateStr}
                onClick={() => {
                  const hasEvents =
                    holidayMap[dateStr] ||
                    (leaveMap[dateStr] || []).length > 0 ||
                    (outlookMap[dateStr] || []).length > 0;
                  if (hasEvents) setSelectedDay(dateStr);
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                style={{
                  height: 90,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: `1px solid ${isToday ? LEAVE_CALENDAR.todayBorder : C.border}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  background: isToday
                    ? withAlpha(C.accent, 0.04)
                    : holiday
                      ? withAlpha(C.accent, 0.03)
                      : LEAVE_CALENDAR.defaultBg,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? C.accent : C.dark }}>{day}</span>
                {holiday && (
                  <div
                    title={holiday.name}
                    style={{
                      marginTop: 3,
                      borderRadius: 3,
                      padding: '2px 5px',
                      fontSize: 10,
                      fontWeight: 600,
                      background: LEAVE_CALENDAR.holidayBg,
                      color: LEAVE_CALENDAR.holidayText,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🇰🇭 {holiday.name}
                  </div>
                )}
                {dayLeaves.slice(0, 3).map((l, idx) => (
                  <div
                    key={idx}
                    title={l.employee?.name}
                    style={{
                      marginTop: 3,
                      borderRadius: 3,
                      padding: '2px 5px',
                      fontSize: 10,
                      fontWeight: 500,
                      background: l.status === 'APPROVED' ? withAlpha(LEAVE_CALENDAR.approvedBg, 0.15)
                                : l.status === 'PENDING'  ? withAlpha(C.amber, 0.15)
                                : withAlpha(C.red, 0.15),
                      color:      l.status === 'APPROVED' ? LEAVE_CALENDAR.approvedBg
                                : l.status === 'PENDING'  ? C.amber
                                : C.red,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.employee?.name?.split(' ')[0] || 'Leave'}
                  </div>
                ))}
                {dayLeaves.length > 3 && (
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>+{dayLeaves.length - 3} more</div>
                )}
                {dayOutlook.slice(0, 2).map((e, idx) => (
                  <div
                    key={`o-${e.id || idx}`}
                    title={e.title}
                    style={{
                      marginTop: 3,
                      borderRadius: 3,
                      padding: '2px 5px',
                      fontSize: 10,
                      fontWeight: 500,
                      background: withAlpha('#0070C0', 0.12),
                      color: '#0070C0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.title || 'Event'}
                  </div>
                ))}
                {dayOutlook.length > 2 && (
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>+{dayOutlook.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: C.muted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: withAlpha(LEAVE_CALENDAR.approvedBg, 0.15), borderRadius: 3 }} />
            Approved Leave
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: LEAVE_CALENDAR.holidayBg, borderRadius: 3, border: `1px solid ${withAlpha(C.accent, 0.3)}` }} />
            Public Holiday
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: withAlpha('#0070C0', 0.12), borderRadius: 3 }} />
            Outlook Event
          </span>
        </div>
      </div>

      {selectedDay && (() => {
        const selHoliday = holidayMap[selectedDay];
        const selLeaves  = leaveMap[selectedDay]  || [];
        const selOutlook = outlookMap[selectedDay] || [];

        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSelectedDay(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(21,22,26,0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 50,
              }}
            />

            {/* Modal */}
            <div
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 51,
                width: 360,
                maxWidth: 'calc(100vw - 32px)',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px 14px',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted, marginBottom: 2 }}>
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.muted, padding: 6, borderRadius: 8,
                    fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>

                {/* Public Holiday section */}
                {selHoliday && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.accent, marginBottom: 8 }}>
                      🇰🇭 Public Holiday
                    </div>
                    <div style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: LEAVE_CALENDAR.holidayBg,
                      border: `1px solid ${withAlpha(C.accent, 0.2)}`,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{selHoliday.name}</div>
                    </div>
                  </div>
                )}

                {/* Leave section */}
                {selLeaves.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 8 }}>
                      🌿 Leave
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selLeaves.map((l, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 14px', borderRadius: 10,
                          background: withAlpha(LEAVE_CALENDAR.approvedBg, 0.08),
                          border: `1px solid ${withAlpha(LEAVE_CALENDAR.approvedBg, 0.2)}`,
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                              {l.employee?.name || 'Employee'}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                              {l.leaveType?.replace(/_/g, ' ')} · {formatDate(l.startDate)} → {formatDate(l.endDate)}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 8px',
                            borderRadius: 20,
                            background: withAlpha(LEAVE_CALENDAR.approvedBg, 0.15),
                            color: LEAVE_CALENDAR.approvedBg,
                          }}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outlook Events section */}
                {selOutlook.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 8 }}>
                      📅 Outlook Events
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selOutlook.map((e, idx) => (
                        <div key={idx} style={{
                          padding: '9px 14px', borderRadius: 10,
                          background: withAlpha('#0070C0', 0.08),
                          border: `1px solid ${withAlpha('#0070C0', 0.2)}`,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                            {e.title || 'Event'}
                          </div>
                          {e.start && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                              {new Date(e.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              {e.end ? ` → ${new Date(e.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        );
      })()}
    </Shell>
    </>
  );
}
