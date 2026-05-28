import { useEffect, useState } from 'react';
import { CalendarDays, BarChart2, FolderOpen, Bell } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

function StatCard({ icon: Icon, title, value, sub, empty }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <p className="stat-card-title">{title}</p>
        <span className="stat-card-icon"><Icon size={18} /></span>
      </div>
      {empty ? (
        <p className="stat-card-sub" style={{ marginTop: 8 }}>{empty}</p>
      ) : (
        <>
          <p className="stat-card-value">{value}</p>
          <p className="stat-card-sub">{sub}</p>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/me'),
      api.get('/notifications/me'),
    ])
      .then(([d, n]) => { setData(d.data); setNotifications(n.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="spinner-full"><div className="spinner" /></div>
      </Shell>
    );
  }

  const { user, employee, leave, performance, documents, notifications: notifMeta } = data || {};
  const firstName = user?.name?.split(' ')[0] || user?.name;

  return (
    <Shell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, fontWeight: 400, color: '#15161A', margin: '0 0 4px' }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
            {employee?.designation && employee?.department
              ? `${employee.designation} · ${employee.department}`
              : 'Complete your employee profile to unlock all features'}
          </p>
        </div>
        {user?.role && <span className="badge badge-role">{user.role.replace(/_/g, ' ')}</span>}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={CalendarDays}
          title="Leave"
          value={leave?.taken ?? 0}
          sub={`${leave?.pending ?? 0} pending approval`}
          empty={!leave ? 'No leave records yet' : null}
        />
        <StatCard
          icon={BarChart2}
          title="Performance"
          value={performance ? `${performance.overallScore}` : '—'}
          sub={performance ? `${performance.totalKPIs} KPI${performance.totalKPIs !== 1 ? 's' : ''} · ${performance.completedTasks}/${performance.totalTasks} tasks` : ''}
          empty={!performance ? 'No KPIs assigned yet' : null}
        />
        <StatCard
          icon={FolderOpen}
          title="Documents"
          value={documents?.total ?? 0}
          sub={documents?.latestUpload ? `Last upload: ${new Date(documents.latestUpload).toLocaleDateString()}` : 'No uploads yet'}
          empty={!documents ? 'No documents yet' : null}
        />
      </div>

      {/* Notifications */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Bell size={18} style={{ color: 'rgba(21,22,26,0.4)' }} />
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, fontWeight: 400, color: '#15161A', margin: 0 }}>
            Notifications
          </h3>
          {notifMeta?.unread > 0 && (
            <span style={{ background: '#C8203D', color: '#fff', borderRadius: '100px', fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
              {notifMeta.unread}
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={28} style={{ color: 'rgba(21,22,26,0.2)' }} />
            <p>You're all caught up</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #E4E3DC' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                  background: n.isRead ? '#D1D5DB' : '#C8203D',
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#15161A', lineHeight: 1.45 }}>{n.message}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.4)' }}>{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
