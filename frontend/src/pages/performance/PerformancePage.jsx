import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Target } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { C, card, scoreColor } from '../../components/theme';
import { Spinner, EmptyState, KpiDates } from '../../components/ui';

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
  const [loading, setLoading] = useState(true);
  const [evalModal, setEvalModal] = useState(null); // kpi object or null
  const [selfRating, setSelfRating] = useState(5);
  const [selfComment, setSelfComment] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  const load = () =>
    api.get('/performance/me')
      .then((p) => { setPerf(p.data || null); })
      .catch(() => toast.error('Failed to load performance'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const submitSelfEvaluation = async () => {
    if (!evalModal) return;
    setSubmittingEval(true);
    try {
      await api.post(`/kpis/${evalModal.id}/self-evaluate`, {
        selfRating,
        selfComment,
      });
      toast.success('Self evaluation submitted — awaiting manager review');
      setEvalModal(null);
      setSelfRating(5);
      setSelfComment('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmittingEval(false);
    }
  };

  if (loading) return <Shell><Spinner /></Shell>;

  const overall = perf?.overallScore ?? 0;

  const showMgmt = user?.role === 'HEAD_OF_PMO' && perf?.managementScore != null;
  const hasData = perf && perf.kpis?.length;

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
          <div style={{ display: 'grid', gridTemplateColumns: showMgmt ? 'repeat(2,1fr)' : '1fr', gap: 20, marginBottom: 20 }} className="pf-stats">
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
                  return (
                    <div key={kpi.id} style={{ paddingBottom: 14, borderBottom: '1px solid #E4E3DC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{kpi.title}</span>
                          <KpiDates startDate={kpi.startDate} endDate={kpi.endDate} size={11} />
                        </div>
                        <span style={{ fontSize: 12, color: C.muted }}>{kpi.earnedScore}/{kpi.targetScore}</span>
                      </div>
                      {/* Self evaluation button or status */}
                      {kpi.status === 'ACTIVE' && (
                        <button
                          onClick={() => { setEvalModal(kpi); setSelfRating(5); setSelfComment(''); }}
                          style={{
                            marginTop: 10, padding: '8px 14px',
                            background: C.accent, color: '#fff',
                            border: 'none', borderRadius: 8,
                            fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Close KPI & Self Evaluate
                        </button>
                      )}
                      {kpi.status === 'PENDING_REVIEW' && (
                        <div style={{
                          marginTop: 10, padding: '8px 14px',
                          background: '#FEF3C7', color: '#D97706',
                          borderRadius: 8, fontSize: 13, fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          Awaiting Manager Review
                        </div>
                      )}
                      {kpi.status === 'CLOSED' && kpi.evaluation?.managerRating && (
                        <div style={{
                          marginTop: 10, padding: '10px 14px',
                          background: '#DCFCE7', borderRadius: 8,
                          fontSize: 13, color: '#16a34a', fontWeight: 600,
                        }}>
                          Manager Rating: {kpi.evaluation.managerRating}/5
                          {kpi.evaluation.managerComment && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 400, color: C.muted, fontStyle: 'italic' }}>
                              "{kpi.evaluation.managerComment}"
                            </p>
                          )}
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
        </>
      )}

      <style>{`@media(max-width:860px){.pf-stats{grid-template-columns:1fr!important}.pf-main{grid-template-columns:1fr!important}.pf-ethics{grid-template-columns:1fr!important}}`}</style>

      {evalModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }}
          onClick={() => setEvalModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28,
              width: '100%', maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: '0 0 6px' }}>
              Self Evaluation
            </h3>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
              {evalModal.title}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Your Rating
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelfRating(n)}
                    style={{
                      width: 48, height: 48,
                      borderRadius: 10,
                      border: `2px solid ${selfRating === n ? C.accent : C.border}`,
                      background: selfRating === n ? C.accent : '#fff',
                      color: selfRating === n ? '#fff' : C.dark,
                      fontSize: 18, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Comment (optional)
              </label>
              <textarea
                value={selfComment}
                onChange={(e) => setSelfComment(e.target.value)}
                placeholder="Describe your work, challenges faced, and achievements..."
                style={{
                  width: '100%', minHeight: 100, padding: '10px 12px',
                  border: `1.5px solid ${C.border}`, borderRadius: 8,
                  fontSize: 14, fontFamily: 'inherit', color: C.dark,
                  background: '#FAFAF7', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={submitSelfEvaluation}
                disabled={submittingEval}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: C.accent, color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: submittingEval ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: submittingEval ? 0.6 : 1,
                }}
              >
                {submittingEval ? 'Submitting...' : 'Submit Evaluation'}
              </button>
              <button
                onClick={() => setEvalModal(null)}
                style={{
                  padding: '12px 16px',
                  background: '#fff', color: C.dark,
                  border: `1.5px solid ${C.border}`, borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
