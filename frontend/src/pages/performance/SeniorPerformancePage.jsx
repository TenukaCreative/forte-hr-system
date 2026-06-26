import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import WeeklyChart from '../../components/WeeklyChart';
import { C, card, scoreColor, formatDate, isOverdue } from '../../components/theme';
import { StatCard, Spinner, Badge, Tabs } from '../../components/ui';

const statLabel = {
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: C.faint, margin: 0,
};

const TASK_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

const initials = (name = '') =>
  name.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function SeniorPerformancePage() {
  const [dashData, setDashData] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamEthics, setTeamEthics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/me'),
      api.get('/kpis/my-team'),
      api.get('/tasks/overdue'),
      api.get('/employees/users'),
      api.get('/ethics/team'),
    ])
      .then(([dash, team, , usr, ethics]) => {
        setDashData(dash.data || null);
        setKpis(team.data || []);
        setUsers(usr.data || []);
        setTeamEthics(ethics.data || []);
      })
      .catch(() => toast.error('Failed to load team performance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Shell><Spinner /></Shell>;

  // userId → user map
  const userMap = {};
  users.forEach((u) => { userMap[u.id] = u; });

  // employeeId → latest ethics review
  const ethicsMap = {};
  teamEthics.forEach((e) => { ethicsMap[e.employeeId] = e; });

  // Flatten all tasks from KPIs
  const allTasks = kpis.flatMap((kpi) =>
    (kpi.tasks || kpi.Tasks || []).map((t) => ({
      ...t,
      kpiTitle: kpi.title,
      employeeId: kpi.employeeId,
      employeeName: kpi.Employee?.User?.name
        || userMap[kpi.employeeId]?.name
        || 'Unknown',
    }))
  );

  // Team overview per employee
  const employeeMap = {};
  kpis.forEach((kpi) => {
    const empId = kpi.employeeId;
    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        employeeId: empId,
        name: kpi.Employee?.User?.name
          || userMap[empId]?.name
          || 'Unknown',
        role: kpi.Employee?.User?.role
          || userMap[empId]?.role || '',
        totalKPIs: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
      };
    }
    const emp = employeeMap[empId];
    emp.totalKPIs++;
    const tasks = kpi.tasks || kpi.Tasks || [];
    emp.totalTasks += tasks.length;
    emp.completedTasks += tasks.filter((t) => t.status === 'COMPLETED').length;
    emp.overdueTasks += tasks.filter((t) => isOverdue(t.deadline, t.status)).length;
  });

  const teamRows = Object.values(employeeMap);
  teamRows.forEach((emp) => {
    emp.score = emp.totalTasks
      ? parseFloat((emp.completedTasks / emp.totalTasks * 100).toFixed(2))
      : 0;
  });
  teamRows.sort((a, b) => b.score - a.score);

  // Filter tasks by tab
  const filteredTasks = allTasks.filter((t) => {
    if (activeTab === 'pending') return t.status === 'PENDING' && !isOverdue(t.deadline, t.status);
    if (activeTab === 'completed') return t.status === 'COMPLETED';
    if (activeTab === 'overdue') return isOverdue(t.deadline, t.status);
    return true;
  });

  const mgmtScore = dashData?.performance?.managementScore ?? 0;
  const teamTotal = dashData?.performance?.teamTotalTasks ?? 0;
  const teamDone = dashData?.performance?.teamCompletedTasks ?? 0;
  const teamOverdue = dashData?.performance?.teamOverdueTasks ?? 0;

  return (
    <Shell>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          My Performance
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          Your management score and team performance overview
        </p>
      </div>

      {/* Section 1 — stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="pmo-stats">
        <StatCard
          label="MANAGEMENT SCORE"
          value={`${mgmtScore}`}
          color={scoreColor(mgmtScore)}
          sub="based on team performance"
        />
        <StatCard
          label="TASKS ASSIGNED"
          value={teamTotal}
          color={C.dark}
          sub="across all team members"
        />
        <div style={card}>
          <p style={statLabel}>COMPLETED</p>
          <p style={{ fontSize: 40, fontWeight: 600, color: C.green, margin: '10px 0 8px', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {teamDone}
          </p>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px' }}>by your team</p>
          <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${teamTotal ? (teamDone / teamTotal * 100) : 0}%`,
              background: C.green,
              borderRadius: 4,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
        <StatCard
          label="OVERDUE"
          value={teamOverdue}
          color={teamOverdue > 0 ? C.red : 'rgba(21,22,26,0.3)'}
          sub="tasks past deadline"
        />
      </div>

      {/* Section 2 — team overview table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: 24, marginTop: 24 }} className="pmo-table">
        <div style={{ padding: '20px 24px 0' }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: 0, letterSpacing: '-0.01em' }}>
            Team Overview
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Employee', 'KPIs', 'Tasks', 'Done', 'Overdue', 'Score', 'Ethics'].map((h) => (
                <th key={h} style={{
                  padding: '10px 16px',
                  fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase',
                  color: C.faint,
                  letterSpacing: '0.06em',
                  textAlign: h === 'Employee' ? 'left' : 'center',
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamRows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: C.faint, fontSize: 14 }}>
                  No KPIs assigned yet
                </td>
              </tr>
            )}
            {teamRows.map((emp, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid ${C.border}`,
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32,
                      borderRadius: '50%',
                      background: C.accent,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {initials(emp.name)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.dark }}>
                        {emp.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                        {emp.role?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: C.dark }}>
                  {emp.totalKPIs}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: C.dark, fontWeight: 500 }}>
                  {emp.completedTasks}/{emp.totalTasks}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: C.green, fontWeight: 600 }}>
                  {emp.completedTasks}
                </td>
                <td style={{
                  padding: '14px 16px',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: emp.overdueTasks > 0 ? C.red : 'rgba(21,22,26,0.3)',
                }}>
                  {emp.overdueTasks}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{
                    background: emp.score >= 80 ? '#dcfce7' : emp.score >= 50 ? '#fef3c7' : '#fee2e2',
                    color: emp.score >= 80 ? C.green : emp.score >= 50 ? C.amber : C.red,
                    borderRadius: 100,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {emp.score.toFixed(1)}%
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  {ethicsMap[emp.employeeId]?.latestReview?.ethicsScore != null ? (() => {
                    const sc = scoreColor(Number(ethicsMap[emp.employeeId].latestReview.ethicsScore));
                    return (
                      <span style={{
                        background: sc === C.green ? '#dcfce7' : sc === C.amber ? '#fef3c7' : '#fee2e2',
                        color: sc,
                        borderRadius: 100,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {ethicsMap[emp.employeeId].latestReview.ethicsScore}
                      </span>
                    );
                  })() : (
                    <span style={{ color: 'rgba(21,22,26,0.25)', fontSize: 13 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3 — tasks list */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: 0, letterSpacing: '-0.01em' }}>
            All Team Tasks
          </h3>
          <Tabs tabs={TASK_TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }} className="pmo-table">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Task', 'Employee', 'KPI', 'Deadline', 'Status'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: C.faint,
                    letterSpacing: '0.06em',
                    textAlign: 'left',
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: C.faint, fontSize: 14 }}>
                    {activeTab === 'completed'
                      ? 'No completed tasks 🎉'
                      : activeTab === 'overdue'
                      ? 'No overdue tasks 🎉'
                      : activeTab === 'pending'
                      ? 'No pending tasks'
                      : 'No tasks assigned yet'}
                  </td>
                </tr>
              )}
              {filteredTasks.map((t) => {
                const overdue = isOverdue(t.deadline, t.status);
                const status = overdue ? 'OVERDUE' : t.status;
                return (
                  <tr key={t.id} style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: overdue
                      ? 'rgba(220,38,38,0.03)'
                      : t.status === 'COMPLETED'
                      ? 'rgba(22,163,74,0.02)'
                      : '#fff',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark }}>
                        {t.title}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26,
                          borderRadius: '50%',
                          background: C.accent,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {initials(t.employeeName)}
                        </div>
                        <span style={{ fontSize: 13, color: C.dark }}>
                          {t.employeeName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.muted, maxWidth: 180 }}>
                      {t.kpiTitle}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: overdue ? C.red : t.status === 'COMPLETED' ? C.green : C.muted,
                      whiteSpace: 'nowrap',
                    }}>
                      {formatDate(t.deadline)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 — weekly team chart */}
      <div style={card}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Team&apos;s Weekly Activity
        </h3>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>
          Tasks completed and overdue across the whole team
        </p>
        <WeeklyChart tasks={allTasks} height={180} />
      </div>

      <style>{`
        @media(max-width:768px){
          .pmo-stats{
            grid-template-columns: 1fr 1fr!important
          }
          .pmo-table{
            overflow-x:auto
          }
        }
      `}</style>
    </Shell>
  );
}
