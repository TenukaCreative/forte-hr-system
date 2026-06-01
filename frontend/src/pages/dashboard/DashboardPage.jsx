import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarPlus, FolderOpen, TrendingUp, Bell, BarChart2, ListChecks } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import TasksDuePanel from '../../components/TasksDuePanel';
import WeeklyChart from '../../components/WeeklyChart';

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

const formatDayMonth = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const scoreColor = (score) => {
  if (score >= 80) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#C8203D';
};

const STATUS_STYLES = {
  PENDING:  { bg: '#FEF3C7', color: '#D97706' },
  APPROVED: { bg: '#DCFCE7', color: '#16A34A' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
};

const TYPE_STYLES = {
  PAID:   { bg: '#DCFCE7', color: '#16A34A' },
  UNPAID: { bg: '#FEF3C7', color: '#D97706' },
};

const card = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  padding: 24,
};

const statLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'rgba(21,22,26,0.4)',
  margin: 0,
};

const statValue = {
  fontSize: 42,
  fontWeight: 500,
  color: '#15161A',
  margin: '10px 0 4px',
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

const statSub = { fontSize: 13, color: 'rgba(21,22,26,0.5)', margin: 0 };

const sectionHeading = {
  fontSize: 20,
  fontWeight: 600,
  color: '#15161A',
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = () => api.get('/tasks/my').then((t) => setTasks(t.data || []));

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/me'),
      api.get('/notifications/me'),
      api.get('/leaves/my'),
      loadTasks(),
    ])
      .then(([d, n, l]) => { setData(d.data); setNotifications(n.data); setLeaves(l.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      toast.success('Task marked complete');
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const shimmerStyle = `
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .skel { background: linear-gradient(90deg,#f0eeea 25%,#e8e6e1 50%,#f0eeea 75%); background-size:200% 100%; animation: shimmer 1.5s infinite; }
    .qa-card { transition: border-color 0.18s, box-shadow 0.18s; }
    .qa-card:hover { border-color: #C8203D; box-shadow: 0 2px 8px rgba(200,32,61,0.08); }
    .notif-row { transition: background 0.15s; }
    .notif-row:hover { background: #FAFAF7; }
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
  const perfColor = performance ? scoreColor(performance.overallScore) : '#15161A';
  const unread = notifMeta?.unread ?? 0;

  const handleDocsNav = () => {
    if (user?.role === 'HR_MANAGER' && user?.id) navigate(`/employees/${user.id}`);
  };

  return (
    <Shell>
      <style>{shimmerStyle}</style>

      {/* Section 1 — Welcome header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="dash-greeting" style={{ fontSize: 36, fontWeight: 600, color: '#15161A', margin: '0 0 6px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {greeting()}, {firstName}!
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
            {todayString()} · Here&apos;s what&apos;s happening today
          </p>
        </div>
        {user?.role && (
          <span style={{ background: '#C8203D', color: '#fff', padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {user.role.replace(/_/g, ' ')}
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
          <div style={{ height: 4, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${leavePct}%`, background: '#C8203D', borderRadius: 4, transition: 'width 0.4s' }} />
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
              <p style={{ ...statSub, color: 'rgba(21,22,26,0.4)' }}>No KPIs assigned yet</p>
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
          <p style={{ ...statValue, color: unread > 0 ? '#C8203D' : 'rgba(21,22,26,0.3)' }}>{unread}</p>
          <p style={statSub}>unread messages</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-quick" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <button className="qa-card" onClick={() => navigate('/leave')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: '1px solid #E4E3DC', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <CalendarPlus size={20} style={{ color: '#C8203D' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#15161A' }}>Request Leave</span>
        </button>
        <button className="qa-card" onClick={handleDocsNav} disabled={user?.role !== 'HR_MANAGER'} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: '1px solid #E4E3DC', borderRadius: 12, cursor: user?.role === 'HR_MANAGER' ? 'pointer' : 'not-allowed', textAlign: 'left', fontFamily: 'inherit', opacity: user?.role === 'HR_MANAGER' ? 1 : 0.55 }}>
          <FolderOpen size={20} style={{ color: '#C8203D' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#15161A' }}>View Documents</span>
        </button>
        <button className="qa-card" onClick={() => navigate('/performance')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', border: '1px solid #E4E3DC', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
          <TrendingUp size={20} style={{ color: '#C8203D' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#15161A' }}>My Performance</span>
        </button>
      </div>

      {/* Section A — Tasks & Deadlines */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ ...sectionHeading, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListChecks size={18} style={{ color: '#C8203D' }} /> Tasks &amp; Deadlines
        </h3>
        <TasksDuePanel tasks={tasks} tabs={['overdue', 'today', 'week']} onComplete={completeTask} />
      </div>

      {/* Section 3 — Main content row */}
      <div className="dash-main" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24, alignItems: 'start' }}>

        {/* Left — Performance Overview */}
        <div style={card}>
          <h3 style={sectionHeading}>Performance Overview</h3>
          {!performance ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(21,22,26,0.4)' }}>
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
                      <circle cx={75} cy={75} r={r} fill="none" stroke="#E4E3DC" strokeWidth={10} />
                      <circle cx={75} cy={75} r={r} fill="none" stroke={perfColor} strokeWidth={10} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 75 75)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={75} y={84} textAnchor="middle" fontSize={32} fontWeight={600} fill="#15161A" letterSpacing="-0.02em">{performance.overallScore}</text>
                    </svg>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(performance.kpis || []).map((kpi) => {
                  const pct = kpi.totalTasks ? (kpi.completedTasks / kpi.totalTasks) * 100 : 0;
                  return (
                    <div key={kpi.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: '#15161A', fontWeight: 500 }}>{kpi.title}</span>
                          {kpi.quarter && <span style={{ background: '#F5F4EF', color: 'rgba(21,22,26,0.6)', borderRadius: 6, padding: '1px 7px', fontSize: 11, fontWeight: 500 }}>{kpi.quarter}</span>}
                        </div>
                        <span style={{ fontSize: 12, color: 'rgba(21,22,26,0.5)' }}>{kpi.earnedScore}/{kpi.targetScore}</span>
                      </div>
                      <div style={{ height: 6, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#C8203D', borderRadius: 4 }} />
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
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'rgba(21,22,26,0.4)', fontSize: 14 }}>
              No leave requests yet
            </div>
          ) : (
            <div>
              {recentLeaves.map((l, i) => {
                const tStyle = TYPE_STYLES[l.leaveType] || TYPE_STYLES.PAID;
                const sStyle = STATUS_STYLES[l.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={l.id} style={{ padding: '12px 0', borderBottom: i < recentLeaves.length - 1 ? '1px solid #E4E3DC' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#15161A', fontWeight: 500 }}>
                        {formatDayMonth(l.startDate)} — {formatDayMonth(l.endDate)}
                      </span>
                      <span style={{ background: sStyle.bg, color: sStyle.color, borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
                        {l.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: tStyle.bg, color: tStyle.color, borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 600 }}>{l.leaveType}</span>
                      <span style={{ fontSize: 12, color: 'rgba(21,22,26,0.5)' }}>{l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            className="leave-cta"
            onClick={() => navigate('/leave')}
            style={{ marginTop: 16, width: '100%', padding: '12px 16px', border: '1.5px solid #C8203D', borderRadius: 8, background: '#C8203D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}
          >
            Request Leave
          </button>
        </div>
      </div>

      {/* Section B — Weekly Overview */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ ...sectionHeading, marginBottom: 2 }}>Weekly Overview</h3>
        <p style={{ fontSize: 13, color: 'rgba(21,22,26,0.5)', margin: '0 0 16px' }}>
          {weekRangeLabel()}
        </p>
        <WeeklyChart tasks={tasks} height={160} />
      </div>

      {/* Section 4 — Notifications */}
      <div style={card}>
        <h3 style={sectionHeading}>Recent Notifications</h3>
        {recentNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'rgba(21,22,26,0.4)' }}>
            <Bell size={28} style={{ color: 'rgba(21,22,26,0.2)', marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 14 }}>You&apos;re all caught up</p>
          </div>
        ) : (
          <div>
            {recentNotifs.map((n, i) => (
              <div
                key={n.id}
                className="notif-row"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 10px', borderBottom: i < recentNotifs.length - 1 ? '1px solid #E4E3DC' : 'none', borderRadius: 6 }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                  background: n.isRead ? '#E4E3DC' : '#C8203D',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: n.isRead ? 'rgba(21,22,26,0.5)' : '#15161A',
                    fontWeight: n.isRead ? 400 : 500,
                    lineHeight: 1.45,
                  }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span style={{ background: '#C8203D', color: '#fff', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 600, alignSelf: 'flex-start' }}>
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
