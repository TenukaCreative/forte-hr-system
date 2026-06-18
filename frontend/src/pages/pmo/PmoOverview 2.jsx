import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Target, ListChecks, Users2 } from 'lucide-react';
import api from '../../api/axios';
import { C, card, scoreColor, isOverdue } from '../../components/theme';
import { StatCard, Spinner, EmptyState } from '../../components/ui';

export default function PmoOverview() {
  const [kpis, setKpis] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/kpis/my-team'), api.get('/tasks/overdue')])
      .then(([k, o]) => { setKpis(k.data || []); setOverdue(o.data || []); })
      .catch(() => toast.error('Failed to load team overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // Aggregate totals
  let totalTasks = 0;
  let completedTasks = 0;
  kpis.forEach((k) => {
    const tasks = k.tasks || [];
    totalTasks += tasks.length;
    completedTasks += tasks.filter((t) => t.status === 'COMPLETED').length;
  });
  const overdueCount = overdue.length;
  const mgmtScore = totalTasks ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

  // Per-member rollup
  const byMember = {};
  kpis.forEach((k) => {
    const emp = k.Employee;
    const user = emp?.User;
    if (!user) return;
    const key = user.id;
    if (!byMember[key]) {
      byMember[key] = {
        name: user.name, department: emp.department || '—',
        kpis: 0, total: 0, done: 0, overdue: 0,
      };
    }
    const m = byMember[key];
    m.kpis += 1;
    (k.tasks || []).forEach((t) => {
      m.total += 1;
      if (t.status === 'COMPLETED') m.done += 1;
      if (isOverdue(t.deadline, t.status)) m.overdue += 1;
    });
  });
  const members = Object.values(byMember)
    .map((m) => ({ ...m, score: m.total ? Math.round((m.done / m.total) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }} className="ov-stats">
        <StatCard label="KPIs Assigned" value={kpis.length} sub={<span><Target size={12} style={{ verticalAlign: 'middle' }} /> across your team</span>} />
        <StatCard label="Tasks Assigned" value={totalTasks} sub={<span><ListChecks size={12} style={{ verticalAlign: 'middle' }} /> total</span>} />
        <StatCard label="Completed" value={completedTasks} sub="tasks done" color={C.green} />
        <StatCard label="Overdue" value={overdueCount} sub="past deadline" color={overdueCount > 0 ? C.red : 'rgba(21,22,26,0.3)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }} className="ov-main">
        {/* Team performance table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: 0, padding: '20px 24px 14px' }}>Team Performance</h3>
          {members.length === 0 ? (
            <EmptyState icon={Users2} title="No KPIs assigned yet" subtitle="Assign KPIs from the KPI Assign tab to start tracking" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  {['Member', 'Department', 'KPIs', 'Tasks', 'Done', 'Score', 'Overdue'].map((h) => (
                    <th key={h} style={{ textAlign: h === 'Member' || h === 'Department' ? 'left' : 'center', padding: '10px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.faint, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E4E3DC' }}>
                    <td style={{ padding: '14px 16px', color: C.dark, fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '14px 16px', color: C.muted }}>{m.department}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: C.dark }}>{m.kpis}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: C.dark }}>{m.total}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: C.dark }}>{m.done}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: scoreColor(m.score) }}>{m.score}%</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: m.overdue > 0 ? C.red : 'rgba(21,22,26,0.35)' }}>{m.overdue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PMO own management score */}
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.faint, margin: '0 0 16px' }}>
            Your Management Score
          </p>
          {(() => {
            const r = 56; const c = 2 * Math.PI * r; const offset = c - (mgmtScore / 100) * c;
            return (
              <svg width={140} height={140} viewBox="0 0 140 140">
                <circle cx={70} cy={70} r={r} fill="none" stroke="#E4E3DC" strokeWidth={10} />
                <circle cx={70} cy={70} r={r} fill="none" stroke={scoreColor(mgmtScore)} strokeWidth={10} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                <text x={70} y={78} textAnchor="middle" fontSize={30} fontWeight={700} fill={scoreColor(mgmtScore)}>{mgmtScore}</text>
              </svg>
            );
          })()}
          <p style={{ fontSize: 13, color: C.muted, margin: '14px 0 0' }}>
            {completedTasks} of {totalTasks} assigned tasks completed
          </p>
        </div>
      </div>

      <style>{`@media(max-width:860px){.ov-stats{grid-template-columns:1fr 1fr!important}.ov-main{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
