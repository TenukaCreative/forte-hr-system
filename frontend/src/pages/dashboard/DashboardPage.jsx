import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarPlus, Calendar, TrendingUp, Bell, BarChart2 } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import { KpiDates, StatCard, EmptyState } from '../../components/ui';
import { C, card, scoreColor, formatDayMonth, STATUS_STYLES, LEAVE_TYPE_LABELS, getLeaveTypeColor, getLeaveTypeTextColor } from '../../components/theme';

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  const d = Math.floor(diff / 86400000);
  return `${d} day${d !== 1 ? 's' : ''} ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const todayString = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const weekRangeLabel = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const statLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: C.faint,
  margin: 0,
};

const statValue = {
  fontSize: 42,
  fontWeight: 500,
  color: C.dark,
  margin: '10px 0 4px',
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

const statSub = { fontSize: 13, color: C.muted, margin: 0 };

const sectionHeading = {
  fontSize: 20,
  fontWeight: 600,
  color: C.dark,
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
};

function SkeletonBlock({ height = 100, mb = 0 }) {
  return <div className="skel" style={{ height, marginBottom: mb, borderRadius: 12 }} />;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/me'),
      api.get('/notifications/me'),
      api.get('/leaves/my'),
    ])
      .then(([d, n, l]) => { setData(d.data); setNotifications(n.data); setLeaves(l.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const shimmerStyle = `
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .skel { background: linear-gradient(90deg,#f0eeea 25%,#e8e6e1 50%,#f0eeea 75%); background-size:200% 100%; animation: shimmer 1.5s infinite; }
    .qa-card { transition: border-color 0.18s, box-shadow 0.18s; }
    .qa-card:hover { border-color: ${C.accent}; box-shadow: 0 2px 8px rgba(200,32,61,0.08); }
    .notif-row { transition: background 0.15s; }
    .notif-row:hover { background: ${C.bg}; }
    .leave-cta:hover { background: #a81830 !important; }
    @media(max-width:768px){
      .dash-stats{grid-template-columns:1fr 1fr!important}
      .dash-main{grid-template-columns:1fr!important}
      .dash-quick{grid-template-columns:1fr!important}
      .dash-greeting{font-size:28px!important}
    }
  `;

  if (loading) {
    return (
      <Shell>
        <style>{shimmerStyle}</style>
        <SkeletonBlock height={80} mb={28} />
        <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 20 }}>
          <SkeletonBlock height={150} /><SkeletonBlock height={150} /><SkeletonBlock height={150} /><SkeletonBlock height={150} />
        </div>
        <div className="dash-quick" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <SkeletonBlock height={64} /><SkeletonBlock height={64} /><SkeletonBlock height={64} />
        </div>
        <div className="dash-main" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
          <SkeletonBlock height={300} /><SkeletonBlock height={300} />
        </div>
        <SkeletonBlock height={280} />
      </Shell>
    );
  }

  const { user, leave, performance, documents, notifications: notifMeta } = data || {};
  const firstName = user?.name?.split(' ')[0] || user?.name;
  const recentLeaves = leaves.slice(0, 5);
  const recentNotifs = notifications.slice(0, 5);

  const leavePct = Math.min(100, ((leave?.taken || 0) / 14) * 100);
  const perfColor = performance ? scoreColor(performance.overallScore) : C.dark;
  const unread = notifMeta?.unread ?? 0;

  return (
    <Shell>
      <style>{shimmerStyle}</style>

      {/* Section 1 — Welcome header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-greeting" style={{ fontSize: 36, fontWeight: 600, color: C.dark, margin: '0 0 6px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {greeting()}, {firstName}!
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
            {todayString()} · Here&apos;s what&apos;s happening today
          </p>
        </div>
        {user?.designation && (
          <span style={{ background: C.accent, color: '#fff', padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {user.designation}

          </span>
        )}
      </div>

      {/* Section 2 — Stats row */}
      <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 20 }}>
        {/* Leave */}
        <div style={card}>
          <p style={statLabel}>Leave Taken</p>
          <p style={statValue}>{leave?.taken ?? 0}</p>
          <p style={{ ...statSub, marginBottom: 14 }}>{leave?.pending ?? 0} pending approval</p>
          <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${leavePct}%`, background: C.accent, borderRadius: 4, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Performance */}
        <div style={card}>
          <p style={statLabel}>Performance Score</p>
          {performance ? (
            <>
              <p style={{ ...statValue, color: perfColor }}>
                {performance.overallScore}
                <span style={{ fontSize: 22, fontWeight: 400, color: 'rgba(21,22,26,0.3)' }}>/100</span>
              </p>
              <p style={statSub}>{performance.totalKPIs} KPI{performance.totalKPIs !== 1 ? 's' : ''} assigned</p>
            </>
          ) : (
            <>
              <p style={{ ...statValue, color: 'rgba(21,22,26,0.3)' }}>—</p>
              <p style={{ ...statSub, color: C.faint }}>No KPIs assigned yet</p>
            </>
          )}
        </div>

        {/* Documents */}
        <div style={card}>
          <p style={statLabel}>Documents</p>
          <p style={statValue}>{documents?.total ?? 0}</p>
          <p style={statSub}>
            {documents?.latestUpload
              ? `Last upload: ${new Date(documents.latestUpload).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'No documents yet'}
          </p>
        </div>

        {/* Notifications */}
        <div style={card}>
          <p style={statLabel}>Notifications</p>
          <p style={{ ...statValue, color: unread > 0 ? C.accent : 'rgba(21,22,26,0.3)' }}>{unread}</p>
          <p style={statSub}>unread messages</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-quick" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <button className="qa-card" onClick={() => navigate('/leave')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <CalendarPlus size={20} style={{ color: C.accent }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>Request Leave</span>
        </button>
        <button className="qa-card" onClick={() => navigate('/calendar')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <Calendar size={20} style={{ color: C.accent }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>Company Calendar</span>
        </button>
        <button className="qa-card" onClick={() => navigate('/performance')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <TrendingUp size={20} style={{ color: C.accent }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>My Performance</span>
        </button>
      </div>

      {/* Section 3 — Main content row */}
      <div className="dash-main" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24, alignItems: 'start' }}>

        {/* Left — Performance Overview */}
        <div style={card}>
          <h3 style={sectionHeading}>Performance Overview</h3>
          {!performance ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.faint }}>
              <BarChart2 size={32} style={{ color: 'rgba(21,22,26,0.2)', marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(21,22,26,0.55)' }}>No KPIs assigned yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Your manager will assign KPIs to track your performance</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                {(() => {
                  const r = 60;
                  const c = 2 * Math.PI * r;
                  const offset = c - (performance.overallScore / 100) * c;
                  return (
                    <svg width={150} height={150} viewBox="0 0 150 150">
                      <circle cx={75} cy={75} r={r} fill="none" stroke={C.border} strokeWidth={10} />
                      <circle cx={75} cy={75} r={r} fill="none" stroke={perfColor} strokeWidth={10} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 75 75)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={75} y={84} textAnchor="middle" fontSize={32} fontWeight={600} fill={C.dark} letterSpacing="-0.02em">{performance.overallScore}</text>
                    </svg>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(performance.kpis || []).map((kpi) => {
                  const pct = kpi.targetScore ? (kpi.earnedScore / kpi.targetScore) * 100 : 0;
                  return (
                    <div key={kpi.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: C.dark, fontWeight: 500 }}>{kpi.title}</span>
                          <KpiDates startDate={kpi.startDate} endDate={kpi.endDate} size={11} />
                        </div>
                        <span style={{ fontSize: 12, color: C.muted }}>{kpi.earnedScore}/{kpi.targetScore}</span>
                      </div>
                      <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right — Recent Leave */}
        <div style={card}>
          <h3 style={sectionHeading}>Leave Requests</h3>
          {recentLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: C.faint, fontSize: 14 }}>
              No leave requests yet
            </div>
          ) : (
            <div>
              {recentLeaves.map((l, i) => {
                const sStyle = STATUS_STYLES[l.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={l.id} style={{ padding: '12px 0', borderBottom: i < recentLeaves.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: C.dark, fontWeight: 500 }}>
                        {formatDayMonth(l.startDate)} — {formatDayMonth(l.endDate)}
                      </span>
                      <span style={{ background: sStyle.bg, color: sStyle.color, borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
                        {sStyle.label || l.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        backgroundColor: getLeaveTypeColor(l.leaveType),
                        color: getLeaveTypeTextColor(l.leaveType),
                        borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 600
                      }}>
                        {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>{l.daysCount} day{Number(l.daysCount) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            className="leave-cta"
            onClick={() => navigate('/leave')}
            style={{ marginTop: 16, width: '100%', padding: '12px 16px', border: `1.5px solid ${C.accent}`, borderRadius: 8, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}
          >
            Request Leave
          </button>
        </div>
      </div>

      {/* Section 4 — Notifications */}
      <div style={card}>
        <h3 style={sectionHeading}>Recent Notifications</h3>
        {recentNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: C.faint }}>
            <Bell size={28} style={{ color: 'rgba(21,22,26,0.2)', marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 14 }}>You&apos;re all caught up</p>
          </div>
        ) : (
          <div>
            {recentNotifs.map((n, i) => (
              <div
                key={n.id}
                className="notif-row"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 10px', borderBottom: i < recentNotifs.length - 1 ? `1px solid ${C.border}` : 'none', borderRadius: 6 }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                  background: n.isRead ? C.border : C.accent,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: n.isRead ? C.muted : C.dark,
                    fontWeight: n.isRead ? 400 : 500,
                    lineHeight: 1.45,
                  }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span style={{ background: C.accent, color: '#fff', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 600, alignSelf: 'flex-start' }}>
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
