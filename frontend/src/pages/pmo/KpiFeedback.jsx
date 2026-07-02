import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ClipboardCheck } from 'lucide-react';
import api from '../../api/axios';
import { C, card, inputStyle, fieldLabel, formatDate } from '../../components/theme';
import { Spinner, EmptyState, Button } from '../../components/ui';

export default function KpiFeedback() {
  const [kpis, setKpis] = useState(null); // null = loading
  const [reviewing, setReviewing] = useState(null); // kpi object being reviewed
  const [managerRating, setManagerRating] = useState(5);
  const [managerComment, setManagerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get('/kpis/pending-evaluations')
      .then((r) => setKpis(r.data || []))
      .catch(() => { toast.error('Failed to load pending evaluations'); setKpis([]); });

  useEffect(() => { load(); }, []);

  const openReview = (kpi) => {
    setReviewing(kpi);
    setManagerRating(5);
    setManagerComment('');
  };

  const submit = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await api.post(`/kpis/${reviewing.id}/manager-evaluate`, {
        managerRating,
        managerComment,
      });
      toast.success('Evaluation submitted, KPI closed');
      setReviewing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (kpis === null) return <Spinner />;

  return (
    <div>
      {kpis.length === 0 ? (
        <div style={card}>
          <EmptyState
            icon={ClipboardCheck}
            title="No pending evaluations"
            subtitle="Self evaluations submitted by your team will appear here for review"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {kpis.map((kpi) => (
            <div key={kpi.id} style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.dark }}>{kpi.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
                    {kpi.Employee?.User?.name || 'Unknown'} · {kpi.Employee?.designation || ''}
                  </p>
                  {kpi.startDate && kpi.endDate && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.faint }}>
                      {formatDate(kpi.startDate)} → {formatDate(kpi.endDate)}
                    </p>
                  )}
                </div>
                <span style={{
                  background: '#FEF3C7', color: '#D97706', borderRadius: 100,
                  padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                  Pending Review
                </span>
              </div>

              {kpi.evaluation && (
                <div style={{ background: '#FAFAF7', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    Employee Self Evaluation
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{kpi.evaluation.selfRating}</span>
                    <span style={{ fontSize: 13, color: C.muted }}>/5</span>
                  </div>
                  {kpi.evaluation.selfComment && (
                    <p style={{ margin: 0, fontSize: 13, color: C.dark, fontStyle: 'italic' }}>
                      "{kpi.evaluation.selfComment}"
                    </p>
                  )}
                </div>
              )}

              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>
                {kpi.tasks?.filter((t) => t.status === 'COMPLETED').length || 0}/{kpi.tasks?.length || 0} tasks completed
              </p>

              <Button onClick={() => openReview(kpi)}>Review & Close KPI</Button>
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
          onClick={() => setReviewing(null)}
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
              Manager Evaluation
            </h3>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
              {reviewing.title} — {reviewing.Employee?.User?.name}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={fieldLabel}>Your Rating</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setManagerRating(n)}
                    style={{
                      width: 48, height: 48,
                      borderRadius: 10,
                      border: `2px solid ${managerRating === n ? C.accent : C.border}`,
                      background: managerRating === n ? C.accent : '#fff',
                      color: managerRating === n ? '#fff' : C.dark,
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
              <label style={fieldLabel}>Comment</label>
              <textarea
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder="Provide feedback on the employee's work..."
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', marginTop: 8 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={submit} disabled={submitting} style={{ flex: 1, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit & Close KPI'}
              </Button>
              <Button variant="ghost" onClick={() => setReviewing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
