import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronRight, Target } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TasksDuePanel from '../../components/TasksDuePanel';
import WeeklyChart from '../../components/WeeklyChart';
import { C, card, scoreColor, formatDate, isOverdue } from '../../components/theme';
import { Spinner, EmptyState, Badge, KpiDates } from '../../components/ui';

const sectionHeading = { fontSize: 18, fontWeight: 600, color: C.dark, margin: '0 0 16px', letterSpacing: '-0.01em' };
const statLabel = { fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.faint, margin: 0 };

const PERF_CRITERIA = [
  { field: 'timeliness', label: 'Timeliness & Task Completion', weight: 20 },
  { field: 'workQuality', label: 'Work Quality & Accuracy', weight: 20 },
  { field: 'workDiscipline', label: 'Work Discipline & Availability', weight: 15 },
  { field: 'ownership', label: 'Ownership & Accountability', weight: 15 },
  { field: 'collaboration', label: 'Collaboration & Communication', weight: 10 },
  { field: 'productOwnership', label: 'Product Ownership & Contribution', weight: 10 },
  { field: 'businessDevelopment', label: 'Business Development Contribution', weight: 5 },
  { field: 'learningImprovement', label: 'Learning & Improvement', weight: 5 },
];

const BEHAV_CRITERIA = [
  { field: 'behavioralMetrics', label: 'Behavioral Metrics', weight: 5 },
  { field: 'attitude', label: 'Attitude', weight: 5 },
  { field: 'effort', label: 'Effort', weight: 5 },
  { field: 'trust', label: 'Trust', weight: 5 },
];

// One criteria row: label + weight, score bar, points earned.
function EthicsBar({ criteria, review }) {
  const value = Number(review[criteria.field]) || 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 13, color: C.dark }}>{criteria.label}</span>
        <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: C.accent, borderRadius: 4 }} />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: C.faint }}>
        {(value / 100 * criteria.weight).toFixed(1)}/{criteria.weight} pts
      </p>
    </div>
  );
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [perf, setPerf] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const load = () =>
    Promise.all([api.get('/dashboard/me'), api.get('/tasks/my')])
      .then(([d, t]) => { setPerf(d.data?.performance || null); setTasks(t.data || []); })
      .catch(() => toast.error('Failed to load performance'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      toast.success('Task marked complete');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  if (loading) return <Shell><Spinner /></Shell>;

  const overall = perf?.overallScore ?? 0;
  const totalTasks = perf?.totalTasks ?? tasks.length;
  const completedTasks = perf?.completedTasks ?? tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.deadline, t.status)).length;
  const taskPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by KPI for the breakdown
  const tasksByKpi = {};
  tasks.forEach((t) => {
    const id = t.KPI?.id || 'none';
    (tasksByKpi[id] = tasksByKpi[id] || []).push(t);
  });

  const showMgmt = user?.role === 'HEAD_OF_PMO' && perf?.managementScore != null;
  const hasData = perf && (perf.kpis?.length || tasks.length || showMgmt);

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>My Performance</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Your KPIs, tasks and weekly activity</p>
      </div>

      {!hasData ? (
        <div style={card}>
          <EmptyState icon={Target} title="No KPIs assigned yet" subtitle="Your manager will assign KPIs to start tracking your performance" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${showMgmt ? 4 : 3},1fr)`, gap: 20, marginBottom: 20 }} className="pf-stats">
            {showMgmt && (
              <div style={card}>
                <p style={statLabel}>Management Score</p>
                <p style={{ fontSize: 42, fontWeight: 600, color: scoreColor(perf.managementScore), margin: '10px 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {perf.managementScore}<span style={{ fontSize: 20, fontWeight: 400, color: 'rgba(21,22,26,0.3)' }}>/100</span>
                </p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                  based on team performance · {perf.teamCompletedTasks ?? 0}/{perf.teamTotalTasks ?? 0} tasks completed
                </p>
              </div>
            )}
            <div style={card}>
              <p style={statLabel}>Overall Score</p>
              <p style={{ fontSize: 42, fontWeight: 600, color: scoreColor(overall), margin: '10px 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {overall}<span style={{ fontSize: 20, fontWeight: 400, color: 'rgba(21,22,26,0.3)' }}>/100</span>
              </p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                KPI {perf?.kpiScore ?? 0} ({perf?.kpiWeight ?? 50}%) · Ethics {perf?.ethicsScore ?? 0} ({perf?.ethicsWeight ?? 50}%)
              </p>
            </div>
            <div style={card}>
              <p style={statLabel}>Tasks</p>
              <p style={{ fontSize: 42, fontWeight: 600, color: C.dark, margin: '10px 0 8px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {completedTasks}<span style={{ fontSize: 20, fontWeight: 400, color: 'rgba(21,22,26,0.3)' }}>/{totalTasks}</span>
              </p>
              <div style={{ height: 6, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${taskPct}%`, background: C.accent, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={card}>
              <p style={statLabel}>Overdue</p>
              <p style={{ fontSize: 42, fontWeight: 600, color: overdueCount > 0 ? C.red : 'rgba(21,22,26,0.3)', margin: '10px 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>{overdueCount}</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>task{overdueCount !== 1 ? 's' : ''} past deadline</p>
            </div>
          </div>

          {/* Gauge + KPI breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, marginBottom: 20, alignItems: 'start' }} className="pf-main">
            <div style={{ ...card, textAlign: 'center' }}>
              <p style={{ ...statLabel, marginBottom: 16 }}>Performance</p>
              {(() => {
                const r = 82; const c = 2 * Math.PI * r; const offset = c - (overall / 100) * c;
                return (
                  <svg width={200} height={200} viewBox="0 0 200 200">
                    <circle cx={100} cy={100} r={r} fill="none" stroke="#E4E3DC" strokeWidth={14} />
                    <circle cx={100} cy={100} r={r} fill="none" stroke={scoreColor(overall)} strokeWidth={14} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                    <text x={100} y={106} textAnchor="middle" fontSize={46} fontWeight={700} fill={scoreColor(overall)} letterSpacing="-0.02em">{overall}</text>
                    <text x={100} y={130} textAnchor="middle" fontSize={13} fill="rgba(21,22,26,0.4)">out of 100</text>
                  </svg>
                );
              })()}
            </div>

            <div style={card}>
              <h3 style={sectionHeading}>KPI Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(perf?.kpis || []).map((kpi) => {
                  const pct = kpi.totalTasks ? (kpi.completedTasks / kpi.totalTasks) * 100 : 0;
                  const open = expanded[kpi.id];
                  const kpiTasks = tasksByKpi[kpi.id] || [];
                  return (
                    <div key={kpi.id} style={{ paddingBottom: 14, borderBottom: '1px solid #E4E3DC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{kpi.title}</span>
                          <KpiDates startDate={kpi.startDate} endDate={kpi.endDate} size={11} />
                        </div>
                        <span style={{ fontSize: 12, color: C.muted }}>{kpi.earnedScore}/{kpi.targetScore}</span>
                      </div>
                      <div style={{ height: 6, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 4 }} />
                      </div>
                      {kpiTasks.length > 0 && (
                        <button onClick={() => setExpanded({ ...expanded, [kpi.id]: !open })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>
                          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} {kpi.completedTasks}/{kpi.totalTasks} tasks
                        </button>
                      )}
                      {open && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                          {kpiTasks.map((t) => {
                            const overdue = isOverdue(t.deadline, t.status);
                            return (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FAFAF7', borderRadius: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.dark }}>{t.title}</p>
                                  {t.deadline && (
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: overdue ? C.red : t.status === 'COMPLETED' ? C.green : C.muted }}>
                                      {t.status === 'COMPLETED' ? 'Completed' : overdue ? 'Overdue' : 'Due'} {formatDate(t.deadline)}
                                    </p>
                                  )}
                                </div>
                                <Badge status={overdue ? 'OVERDUE' : t.status} />
                                {t.status === 'PENDING' && !overdue && (
                                  <button onClick={() => completeTask(t.id)}
                                    style={{ padding: '6px 12px', border: `1.5px solid ${C.accent}`, borderRadius: 7, background: '#fff', color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Mark Complete
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ethics review */}
          {perf?.ethicsReview ? (
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: 0 }}>Ethics Review</h3>
                <span style={{ background: '#F5F4EF', color: C.muted, borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  {perf.ethicsReview.period}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="pf-ethics">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.dark, margin: '0 0 14px' }}>Performance Metrics</p>
                  {PERF_CRITERIA.map((c) => <EthicsBar key={c.field} criteria={c} review={perf.ethicsReview} />)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.dark, margin: '0 0 14px' }}>Behavioral Metrics</p>
                  {BEHAV_CRITERIA.map((c) => <EthicsBar key={c.field} criteria={c} review={perf.ethicsReview} />)}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${C.border}`, marginTop: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>Ethics Total</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: scoreColor(Number(perf.ethicsReview.ethicsScore)) }}>
                  {perf.ethicsReview.ethicsScore}<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/100</span>
                </span>
              </div>
              {perf.ethicsReview.notes && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
                  &ldquo;{perf.ethicsReview.notes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div style={{ ...card, marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: '0 0 12px' }}>Ethics Review</h3>
              <EmptyState title="No ethics review yet" subtitle="Your manager will submit an ethics review for your performance period" />
            </div>
          )}

          {/* Tasks due */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h3 style={sectionHeading}>Upcoming &amp; Overdue Tasks</h3>
            <TasksDuePanel tasks={tasks} tabs={['overdue', 'week', 'all']} onComplete={completeTask} />
          </div>

          {/* Weekly chart */}
          <div style={card}>
            <h3 style={{ ...sectionHeading, marginBottom: 4 }}>This Week&apos;s Activity</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>Tasks completed and tasks that became overdue, by day</p>
            <WeeklyChart tasks={tasks} height={180} />
          </div>
        </>
      )}

      <style>{`@media(max-width:860px){.pf-stats{grid-template-columns:1fr!important}.pf-main{grid-template-columns:1fr!important}.pf-ethics{grid-template-columns:1fr!important}}`}</style>
    </Shell>
  );
}
