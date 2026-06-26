import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Shell from '../../components/layout/Shell';
import { C, card, scoreColor, formatDate, isOverdue } from '../../components/theme';
import { StatCard, Spinner, EmptyState, Badge, Button } from '../../components/ui';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return `${m}m ago`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return `${h}h ago`;
  }
  const d = Math.floor(diff / 86400000);
  return `${d}d ago`;
};

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const formatType = (t) =>
  t ? t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

export default function SeniorDashboardPage() {
  const { user, resolvedRole } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = resolvedRole === 'SUPER_ADMIN';
  // Pending queue: Super Admin reviews the final-approval queue; everyone else
  // (SENIOR) reviews their own team's manager-step queue.
  const pendingEndpoint = isSuperAdmin ? '/leaves/pending-approval' : '/leaves/pending-manager';

  const [dashData, setDashData] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    // On Leave Today: Super Admin reads all approved leave (filtered client-side);
    // SENIOR reads their own team's approved-today leave (filtered server-side).
    const todayEndpoint = isSuperAdmin ? '/leaves/all' : '/leaves/team-approved';
    const todayStr = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.get('/dashboard/me'),
      api.get(pendingEndpoint),
      api.get('/notifications/me'),
      api.get('/kpis/my-team'),
      api.get('/tasks/overdue'),
      api.get(todayEndpoint),
    ])
      .then(([d, p, n, k, o, t]) => {
        setDashData(d.data);
        setPendingLeaves(p.data || []);
        setNotifications(n.data || []);
        setKpis(k.data || []);
        setOverdueTasks(o.data || []);
        setOnLeaveToday(
          (t.data || []).filter(
            (l) => l.status === 'APPROVED' && l.startDate <= todayStr && l.endDate >= todayStr
          )
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeave = async (id, action) => {
    setApprovingId(id + action);
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const reviewPath = isSuperAdmin ? `/leaves/${id}/final-review` : `/leaves/${id}/manager-review`;
      await api.patch(reviewPath, { status });
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected');
      const { data } = await api.get(pendingEndpoint);
      setPendingLeaves(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return <Shell><Spinner /></Shell>;

  const firstName =
    dashData?.user?.name?.split(' ')[0]
    || user?.name?.split(' ')[0]
    || 'there';

  const mgmtScore = dashData?.performance?.managementScore ?? 0;

  const unread = notifications.filter((n) => !n.isRead).length;

  const allTasks = kpis.flatMap((kpi) =>
    (kpi.tasks || kpi.Tasks || []).map((t) => ({
      ...t,
      employeeName: kpi.Employee?.User?.name || 'Unknown',
      kpiTitle: kpi.title,
    }))
  );

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;

  const recentNotifs = notifications.slice(0, 5);

  const sortedTasks = [...allTasks]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return (
    <Shell>
      {/* Section 1 — Welcome header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {greeting()}, {firstName}!
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
            {todayString()} · Here&apos;s what&apos;s happening today
          </p>
        </div>
        <span style={{
          background: C.accent, color: '#fff', padding: '6px 14px', borderRadius: 100,
          fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          HEAD OF PMO
        </span>
      </div>

      {/* Section 2 — 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }} className="pmo-dash-stats">
        <StatCard
          label="MANAGEMENT SCORE"
          value={mgmtScore}
          color={scoreColor(mgmtScore)}
          sub="based on team performance"
        />
        <StatCard
          label="PENDING APPROVALS"
          value={pendingLeaves.length}
          color={pendingLeaves.length > 0 ? C.amber : 'rgba(21,22,26,0.3)'}
          sub="leave requests awaiting"
        />
        <StatCard
          label="OVERDUE TASKS"
          value={overdueTasks.length}
          color={overdueTasks.length > 0 ? C.red : 'rgba(21,22,26,0.3)'}
          sub="tasks past deadline"
        />
        <StatCard
          label="NOTIFICATIONS"
          value={unread}
          color={unread > 0 ? C.accent : 'rgba(21,22,26,0.3)'}
          sub="unread messages"
        />
      </div>

      {/* Section 3 — two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24, alignItems: 'start' }} className="pmo-dash-main">
        {/* LEFT COLUMN */}
        <div>
          {/* Card A — Team Tasks */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: 0 }}>Team Tasks</h3>
              <span style={{ fontSize: 13, color: C.muted }}>{completedTasks}/{totalTasks} done</span>
            </div>

            <div style={{ height: 8, background: C.border, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{
                height: '100%',
                width: `${totalTasks ? (completedTasks / totalTasks * 100) : 0}%`,
                background: C.green,
                borderRadius: 6,
                transition: 'width 0.4s',
              }} />
            </div>

            {sortedTasks.map((t, i) => {
              const overdue = isOverdue(t.deadline, t.status);
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < 4 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: t.status === 'COMPLETED' ? C.green : overdue ? C.red : C.amber,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                      {t.employeeName} · {formatDate(t.deadline)}
                    </p>
                  </div>
                  <Badge status={overdue ? 'OVERDUE' : t.status} />
                </div>
              );
            })}

            {allTasks.length === 0 && (
              <EmptyState
                title="No tasks assigned yet"
                subtitle="Assign KPIs and tasks from Team Performance"
              />
            )}

            {allTasks.length > 5 && (
              <Button
                variant="ghost"
                style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
                onClick={() => navigate('/team')}
              >
                View all {allTasks.length} tasks
              </Button>
            )}
          </div>

          {/* Card B — On Leave Today */}
          <div style={card}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: '0 0 16px' }}>On Leave Today</h3>

            {onLeaveToday.length === 0 ? (
              <p style={{ textAlign: 'center', color: C.faint, fontSize: 14, padding: '16px 0' }}>
                🎉 Everyone is in today
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {onLeaveToday.map((leave, i) => (
                  <div key={leave.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: i < onLeaveToday.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: C.accent, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}>
                      {initials(leave.employee?.name || '?')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark }}>
                        {leave.employee?.name || 'Unknown'}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                        {formatType(leave.leaveType)} · Until {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <Badge status="APPROVED" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Pending Leave Requests */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: 0 }}>Leave Requests</h3>
            {pendingLeaves.length > 0 && (
              <span style={{
                background: '#fef3c7', color: C.amber, borderRadius: 100,
                padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>
                {pendingLeaves.length} pending
              </span>
            )}
          </div>

          {pendingLeaves.length === 0 ? (
            <EmptyState
              title="No pending requests"
              subtitle="All leave requests have been reviewed"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.dark }}>
                        {leave.employee?.name || 'Unknown'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>
                        {formatType(leave.leaveType)} · {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.daysCount} day{Number(leave.daysCount) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge status="PENDING" />
                  </div>
                  {leave.reason && (
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                      &ldquo;{leave.reason}&rdquo;
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      disabled={!!approvingId}
                      style={{
                        flex: 1, background: C.green, border: `1.5px solid ${C.green}`,
                        justifyContent: 'center',
                        opacity: approvingId === leave.id + 'approve' ? 0.6 : 1,
                      }}
                      onClick={() => handleLeave(leave.id, 'approve')}
                    >
                      {approvingId === leave.id + 'approve' ? '...' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!!approvingId}
                      style={{
                        flex: 1, color: C.red, border: `1.5px solid ${C.red}`,
                        justifyContent: 'center',
                        opacity: approvingId === leave.id + 'reject' ? 0.6 : 1,
                      }}
                      onClick={() => handleLeave(leave.id, 'reject')}
                    >
                      {approvingId === leave.id + 'reject' ? '...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingLeaves.length > 5 && (
                <Button
                  variant="ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/leave-approvals')}
                >
                  View all {pendingLeaves.length} requests
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 4 — Notifications */}
      <div style={{ ...card, marginTop: 0 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: '0 0 16px' }}>Recent Notifications</h3>

        {recentNotifs.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            subtitle="No new notifications"
          />
        ) : (
          <div>
            {recentNotifs.map((n, i) => (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 10px',
                borderBottom: i < recentNotifs.length - 1 ? `1px solid ${C.border}` : 'none',
                borderRadius: 6,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                  background: n.isRead ? C.border : C.accent,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, color: n.isRead ? C.muted : C.dark, fontWeight: n.isRead ? 400 : 500, lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span style={{
                    background: C.accent, color: '#fff', borderRadius: 100,
                    padding: '2px 8px', fontSize: 10, fontWeight: 600,
                  }}>
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){
          .pmo-dash-stats{
            grid-template-columns: 1fr 1fr!important
          }
          .pmo-dash-main{
            grid-template-columns: 1fr!important
          }
        }
      `}</style>
    </Shell>
  );
}
