import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Users2 } from 'lucide-react';
import api from '../../api/axios';
import { C, card, fieldLabel, inputStyle, scoreColor, formatDate } from '../../components/theme';
import { Spinner, EmptyState, Button, Badge } from '../../components/ui';

const initials = (name) => name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';

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

const ALL_FIELDS = [...PERF_CRITERIA, ...BEHAV_CRITERIA].map((c) => c.field);

const blankForm = () => {
  const f = { notes: '' };
  ALL_FIELDS.forEach((field) => { f[field] = 0; });
  return f;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q}-${now.getFullYear()}`;
};

const getPeriodOptions = () => {
  const qs = ['Q1', 'Q2', 'Q3', 'Q4'];
  const yr = new Date().getFullYear();
  return [...qs.map((q) => `${q}-${yr}`), ...qs.map((q) => `${q}-${yr + 1}`)];
};

function SliderRow({ criteria, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark }}>{criteria.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Weight: {criteria.weight}pts</p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.accent, minWidth: 40, textAlign: 'right' }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.accent, height: 6, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.faint, marginTop: 6 }}>
        <span>0</span>
        <span style={{ color: C.accent, fontWeight: 500 }}>
          {(value / 100 * criteria.weight).toFixed(1)}/{criteria.weight} pts earned
        </span>
        <span>100</span>
      </div>
    </div>
  );
}

export default function EthicsReviewTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [existingReviews, setExistingReviews] = useState([]);
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/ethics/team-members')
      .then((r) => setUsers(r.data || []))
      .catch(() => toast.error('Failed to load team members'))
      .finally(() => setLoading(false));
  }, []);

  // Prefill the form from an existing review for the given period, else blank.
  const applyPeriod = (reviews, per) => {
    const existing = reviews.find((rv) => rv.period === per);
    if (existing) {
      const f = { notes: existing.notes || '' };
      ALL_FIELDS.forEach((field) => { f[field] = Number(existing[field]) || 0; });
      setForm(f);
    } else {
      setForm(blankForm());
    }
  };

  const selectUser = async (u) => {
    setSelectedUser(u);
    setForm(blankForm());
    if (!u.employeeId) {
      setExistingReviews([]);
      return;
    }
    try {
      const r = await api.get(`/ethics/employee/${u.employeeId}`);
      const reviews = r.data || [];
      setExistingReviews(reviews);
      applyPeriod(reviews, period);
    } catch {
      toast.error('Failed to load reviews');
    }
  };

  const changePeriod = (per) => {
    setPeriod(per);
    applyPeriod(existingReviews, per);
  };

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const perfSubtotal = parseFloat(
    PERF_CRITERIA.reduce((s, c) => s + form[c.field] / 100 * c.weight, 0).toFixed(1)
  );
  const behavSubtotal = parseFloat(
    BEHAV_CRITERIA.reduce((s, c) => s + form[c.field] / 100 * c.weight, 0).toFixed(1)
  );
  const previewScore = parseFloat((perfSubtotal + behavSubtotal).toFixed(2));

  const reviewExists = existingReviews.some((rv) => rv.period === period);

  const handleSubmit = async () => {
    if (!selectedUser?.employeeId) {
      return toast.error('This member has no employee record. Ask HR to create one first.');
    }
    setSaving(true);
    try {
      const payload = { employeeId: selectedUser.employeeId, period, notes: form.notes };
      ALL_FIELDS.forEach((field) => { payload[field] = form[field]; });
      await api.post('/ethics', payload);
      toast.success('Ethics review saved');
      const r = await api.get(`/ethics/employee/${selectedUser.employeeId}`);
      setExistingReviews(r.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  // Team members are already scoped to the user's teams — show all of them.
  const filteredUsers = users;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Ethics Review
        </h2>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
          Rate employee performance and behavioral metrics
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }} className="er-grid">
        {/* Member list */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <p style={{ ...fieldLabel, padding: '16px 16px 10px', margin: 0 }}>Team Members</p>
          {filteredUsers.length === 0 ? (
            <p style={{ fontSize: 13, color: C.faint, padding: '0 16px 16px', margin: 0 }}>No users found.</p>
          ) : (
            <div>
              <style>{`.er-row:hover{background:#FAFAF7}`}</style>
              {filteredUsers.map((u) => {
                const active = selectedUser?.userId === u.userId;
                return (
                  <button key={u.userId} className="er-row" onClick={() => selectUser(u)}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
                      borderBottom: `1px solid ${C.border}`, borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
                      background: active ? 'rgba(200,32,61,0.06)' : 'transparent', borderTop: 'none', borderRight: 'none',
                    }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {initials(u.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.dark }}>{u.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{u.designation}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Review form */}
        <div>
          {!selectedUser ? (
            <div style={card}><EmptyState icon={Users2} title="Select a team member to review" /></div>
          ) : (
            <div style={card}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: 0 }}>{selectedUser.name}</h3>
                  <Badge status="ACTIVE">{selectedUser.role?.replace(/_/g, ' ')}</Badge>
                </div>
                <select value={period} onChange={(e) => changePeriod(e.target.value)} style={{ ...inputStyle, width: 140 }}>
                  {getPeriodOptions().map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {reviewExists && (
                <div style={{
                  background: 'rgba(200,32,61,0.06)', border: '1px solid rgba(200,32,61,0.2)', color: C.accent,
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20,
                }}>
                  ✏️ A review exists for {period}. Submitting will update it.
                </div>
              )}

              {!selectedUser.employeeId && (
                <div style={{
                  background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20,
                }}>
                  This member has no employee record yet. Ask HR to create one before submitting.
                </div>
              )}

              {/* Performance Metrics */}
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: '24px 0 4px' }}>Performance Metrics</h3>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>80 points total</p>
              {PERF_CRITERIA.map((c) => (
                <SliderRow key={c.field} criteria={c} value={form[c.field]} onChange={(v) => setField(c.field, v)} />
              ))}

              {/* Behavioral Metrics */}
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: '24px 0 4px' }}>Behavioral Metrics</h3>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>20 points total</p>
              {BEHAV_CRITERIA.map((c) => (
                <SliderRow key={c.field} criteria={c} value={form[c.field]} onChange={(v) => setField(c.field, v)} />
              ))}

              {/* Live preview */}
              <div style={{ background: '#FAFAF7', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, margin: '24px 0' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: C.dark }}>Ethics Score Preview</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
                    <span>Performance Metrics</span>
                    <span style={{ fontWeight: 500, color: C.dark }}>{perfSubtotal} / 80</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
                    <span>Behavioral Metrics</span>
                    <span style={{ fontWeight: 500, color: C.dark }}>{behavSubtotal} / 20</span>
                  </div>
                  <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                    <span style={{ color: C.dark }}>Total Ethics Score</span>
                    <span style={{ color: scoreColor(previewScore) }}>{previewScore} / 100</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <label style={fieldLabel}>Notes (optional)</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Additional comments..."
              />

              <Button
                variant="primary"
                style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
                disabled={saving || !selectedUser.employeeId}
                onClick={handleSubmit}
              >
                {saving ? 'Submitting...' : 'Submit Ethics Review'}
              </Button>

              {/* Previous reviews */}
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: '32px 0 12px' }}>Previous Reviews</h3>
              {existingReviews.length === 0 ? (
                <EmptyState title="No reviews yet" subtitle="Submit a review above to start tracking ethics" />
              ) : (
                existingReviews.map((review) => {
                  const sc = scoreColor(review.ethicsScore);
                  return (
                    <div key={review.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 8, background: '#FAFAF7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{review.period}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: C.muted }}>{formatDate(review.createdAt)}</span>
                          <span style={{
                            background: sc === C.green ? '#dcfce7' : sc === C.amber ? '#fef3c7' : '#fee2e2',
                            color: sc, borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                          }}>
                            {review.ethicsScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:860px){.er-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
