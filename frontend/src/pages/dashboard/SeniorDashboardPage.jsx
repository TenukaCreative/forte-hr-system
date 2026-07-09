import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Shell from '../../components/layout/Shell';
import { C, card, scoreColor, formatDate } from '../../components/theme';
import { StatCard, Spinner, EmptyState, Badge, Button } from '../../components/ui';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

//greetings 
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

//todays date and day of week 
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
//intials 
const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const formatType = (t) =>
  t ? t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

export default function SeniorDashboardPage() {
  const { user, hasPermission } = useAuth();
  const isSuperUser = hasPermission('leave_overview');

  const navigate = useNavigate();

//super user only gets all access
  const pendingEndpoint =  '/leaves/pending-manager';

  const [dashData, setDashData] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [finalLeaves, setFinalLeaves] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    // On Leave Today: Super Admin reads all approved leave (filtered client-side);
    // SENIOR reads their own team's approved-today leave (filtered server-side).
    const todayEndpoint = isSuperUser ? '/leaves/all' : '/leaves/team-approved';
    const todayStr = new Date().toISOString().slice(0, 10);
    const fetches = [
      api.get('/dashboard/me'),
      api.get('/leaves/pending-manager'),
      api.get('/notifications/me'),
      api.get(todayEndpoint),
    ];
    if (isSuperUser) fetches.push(api.get('/leaves/pending-approval'));

    Promise.all(fetches)
      .then(([d, p, n, t, f]) => {
        setDashData(d.data);
        setPendingLeaves(p.data || []);
        setNotifications(n.data || []);
        setFinalLeaves(isSuperUser ? (f?.data || []) : []);
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
      const reviewPath =  `/leaves/${id}/manager-review`;
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

  const handleFinalLeave = async (id, action) => {
    setApprovingId(id + action);
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await api.patch(`/leaves/${id}/final-review`, { status });
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected');
      const { data } = await api.get('/leaves/pending-approval');
      setFinalLeaves(data || []);
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

  const unread = notifications.filter((n) => !n.isRead).length;

  const recentNotifs = notifications.slice(0, 5);

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

      {/* Section 2 — 3 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 24 }} className="pmo-dash-stats">
        <StatCard
          label="MY PERFORMANCE"
          value={dashData?.performance?.overallScore != null ? dashData.performance.overallScore : '—'}
          color={dashData?.performance?.overallScore != null ? scoreColor(dashData.performance.overallScore) : 'rgba(21,22,26,0.3)'}
          sub={`${dashData?.performance?.totalKPIs ?? 0} KPI${dashData?.performance?.totalKPIs !== 1 ? 's' : ''} assigned`}
        />
        <StatCard
          label="LEAVE TAKEN"
          value={dashData?.leave?.taken ?? 0}
          sub={`${dashData?.leave?.pending ?? 0} pending approval`}
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
            {(pendingLeaves.length + finalLeaves.length) > 0 && (
              <span style={{
                background: '#fef3c7', color: C.amber, borderRadius: 100,
                padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>
                {pendingLeaves.length + finalLeaves.length} pending
              </span>
            )}
          </div>

          {/* Section A — Awaiting My Approval */}
          <div style={{ marginBottom: finalLeaves.length > 0 ? 20 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.faint, margin: '0 0 12px' }}>
              Awaiting My Approval
            </p>
            {pendingLeaves.length === 0 ? (
              <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No requests pending your approval</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingLeaves.slice(0, 3).map((leave) => (
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
                      <Badge status={leave.status} />
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
                        style={{ flex: 1, background: C.green, border: `1.5px solid ${C.green}`, justifyContent: 'center', opacity: approvingId === leave.id + 'approve' ? 0.6 : 1 }}
                        onClick={() => handleLeave(leave.id, 'approve')}
                      >
                        {approvingId === leave.id + 'approve' ? '...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!!approvingId}
                        style={{ flex: 1, color: C.red, border: `1.5px solid ${C.red}`, justifyContent: 'center', opacity: approvingId === leave.id + 'reject' ? 0.6 : 1 }}
                        onClick={() => handleLeave(leave.id, 'reject')}
                      >
                        {approvingId === leave.id + 'reject' ? '...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingLeaves.length > 3 && (
                  <Button variant="ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/leave-approvals')}>
                    View all {pendingLeaves.length} requests
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Section B — Awaiting Final Approval (isSuperUser only) */}
          {isSuperUser && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.faint, margin: '0 0 12px' }}>
                Awaiting Final Approval
              </p>
              {finalLeaves.length === 0 ? (
                <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No requests awaiting final approval</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {finalLeaves.slice(0, 3).map((leave) => (
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
                        <Badge status={leave.status} />
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
                          style={{ flex: 1, background: C.green, border: `1.5px solid ${C.green}`, justifyContent: 'center', opacity: approvingId === leave.id + 'approve' ? 0.6 : 1 }}
                          onClick={() => handleFinalLeave(leave.id, 'approve')}
                        >
                          {approvingId === leave.id + 'approve' ? '...' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!!approvingId}
                          style={{ flex: 1, color: C.red, border: `1.5px solid ${C.red}`, justifyContent: 'center', opacity: approvingId === leave.id + 'reject' ? 0.6 : 1 }}
                          onClick={() => handleFinalLeave(leave.id, 'reject')}
                        >
                          {approvingId === leave.id + 'reject' ? '...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {finalLeaves.length > 3 && (
                    <Button variant="ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/leave-approvals')}>
                      View all {finalLeaves.length} requests
                    </Button>
                  )}
                </div>
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
