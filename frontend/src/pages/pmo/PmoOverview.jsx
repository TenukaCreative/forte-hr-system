import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Target, Users2 } from 'lucide-react';
import api from '../../api/axios';
import { C, card, scoreColor } from '../../components/theme';
import { StatCard, Spinner, EmptyState } from '../../components/ui';

export default function PmoOverview() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/kpis/my-team')
    .then((r)=> setKpis(r.data || []))
    .catch(()=> toast.error('Failed to load team overview'))
    .finally(() => setLoading(false)) 
  }, []);

  if (loading) return <Spinner />;

  const today = new Date().toISOString().split("T")[0];
  const overdueCount = kpis.filter(k => 
    k.status === 'ACTIVE' && k.endDate && k.endDate < today
  ).length;
  const closedCount = kpis.filter(k => k.status === 'CLOSED').length;
  const mgmtScore = kpis.length ? parseFloat(((closedCount / kpis.length) * 100).toFixed(1)) : 0;

  // Per-member rollup table 
  const byMember = {};
  kpis.forEach((k) => {
    const emp = k.Employee;
    const user = emp?.User;
    if (!user) return;
    const key = user.id;
    if (!byMember[key]) {
      byMember[key] = {
        name: user.name, department: emp.department || '—',
        kpis: 0,closed:0,  overdue: 0,
      };
    }
    const member = byMember[key];
    member.kpis += 1;
    //check overdue
    if(k.status === 'CLOSED' )member.closed += 1 ;
    if(k.status ==='ACTIVE'&& k.endDate && k.endDate < today) member.overdue += 1;
    
  });
  //score calculation
  const members = Object.values(byMember)
    .map((m) => ({ ...m, score: m.kpis ? Math.round((m.closed / m.kpis) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);
//--------------------------------------------------------------
//html styling 
//---------------------------------------------------------------
  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }} className="ov-stats">
        <StatCard label="KPIs Assigned" value={kpis.length} sub={<span><Target size={12} style={{ verticalAlign: 'middle' }} /> across your team</span>} />
        <StatCard label="Completed By Team" value={closedCount} sub="KPIs done" color={C.green} />
        <StatCard label="Overdue KPIs" value={overdueCount} sub="past deadline" color={overdueCount > 0 ? C.red : 'rgba(21,22,26,0.3)'} />
          <StatCard label ="Management Score" value = {mgmtScore} sub={`${closedCount} of ${kpis.length} assigned KPIs completed`}></StatCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr ', gap: 24, alignItems: 'start' }} className="ov-main">
        {/* Team performance table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: 0, padding: '20px 24px 14px' }}>Team Performance</h3>
          {members.length === 0 ? (
            <EmptyState icon={Users2} title="No KPIs assigned yet" subtitle="Assign KPIs from the KPI Assign tab to start tracking" />
          ) : (
            <div style ={{overflow:'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  {['Member', 'Department', 'KPIs', 'Closed', 'Score', 'Overdue'].map((h) => (
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
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: C.dark }}>{m.closed}</td>
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
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:860px){.ov-stats{grid-template-columns:1fr 1fr!important}.ov-main{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
