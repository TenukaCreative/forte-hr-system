import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDays, Inbox, Upload, FileText, Trash2 } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { C, card, fieldLabel, inputStyle, formatDate } from '../../components/theme';
import { Spinner, EmptyState, Badge, Button, Tabs } from '../../components/ui';
import LeaveCalendarView from '../../components/leave/LeaveCalendarView';

const LEAVE_TYPES = [
  { value: 'ANNUAL',          label: 'Annual Leave' },
  { value: 'FULL_DAY',        label: 'Full Day Leave' },
  { value: 'HALF_DAY',        label: 'Half Day Leave' },
  { value: 'CHANGE',          label: 'Change Leave' },
  { value: 'HOSPITALIZATION', label: 'Hospitalization Leave' },
  { value: 'MATERNITY',       label: 'Maternity Leave' },
  { value: 'SICK',            label: 'Sick Leave' },
  { value: 'SPECIAL',         label: 'Special Leave' },
];

const typeLabel = (v) => LEAVE_TYPES.find((t) => t.value === v)?.label || v;
const num = (v) => parseFloat(v ?? 0) || 0;

// Saturday (getDay() === 6) and Sunday (getDay() === 0) are non-working days
// and may not be picked for leave. Parse at local midnight so the weekday is
// not shifted by the timezone offset of a yyyy-mm-dd string.
const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
};

// Working days between two yyyy-mm-dd dates inclusive, excluding weekends —
// mirrors the backend countWorkingDays so the displayed count matches what is
// saved.
const countWorkingDays = (start, end) => {
  if (!start || !end) return 0;
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (endDate < current) return 0;
  let count = 0;
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Leave type → pill colours, shared across the leave UI. Light backgrounds
// (SPECIAL, HOSPITALIZATION) use dark text for contrast; the rest use white.
const LEAVE_TYPE_COLORS = {
  ANNUAL:          '#BA5A5A',
  FULL_DAY:        '#778873',
  HALF_DAY:        '#428475',
  CHANGE:          '#EC6530',
  HOSPITALIZATION: '#9FA1FF',
  MATERNITY:       '#39B1D1',
  SICK:            '#ECB65F',
  SPECIAL:         '#C1EBE9',
  OTHER:           '#7288AE',
};
const getLeaveTypeColor = (type) => LEAVE_TYPE_COLORS[type] || '#7288AE';

const LIGHT_LEAVE_TYPES = ['SPECIAL', 'HOSPITALIZATION'];
const getLeaveTypeTextColor = (type) =>
  LIGHT_LEAVE_TYPES.includes(type) ? '#15161A' : '#FFFFFF';

const LEAVE_TYPE_LABELS = {
  ANNUAL:          'Annual Leave',
  FULL_DAY:        'Full Day',
  HALF_DAY:        'Half Day',
  CHANGE:          'Change Leave',
  HOSPITALIZATION: 'Hospitalization',
  MATERNITY:       'Maternity Leave',
  SICK:            'Sick Leave',
  SPECIAL:         'Special Leave',
  OTHER:           'Other',
};

// Pill style used by the Leave Plan list (white text on the type colour).
const planPill = (bg) => ({
  background: bg, color: '#fff', borderRadius: 100, padding: '3px 10px',
  fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap', display: 'inline-block',
});

// True if [start, end] overlaps any of the employee's non-rejected requests.
const hasDateOverlap = (start, end, requests) => {
  if (!start || !end) return false;
  const s = new Date(start);
  const e = new Date(end);
  return requests
    .filter((r) => r.status !== 'REJECTED')
    .some((r) => {
      const rs = new Date(r.startDate);
      const re = new Date(r.endDate);
      return s <= re && e >= rs;
    });
};

// "24 Jun 2026" — two-digit day, per the Leave Plan spec.
const fmtPlanDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function LeavePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  // Shared leave list for the Calendar tab — fetched lazily the first time the
  // tab is opened, then cached (so it isn't refetched on every tab switch).
  const [myRequests, setMyRequests] = useState(null);
  const [myPlans, setMyPlans] = useState([]);

  useEffect(() => {
    if (tab === 'calendar' && myRequests === null) {
      api.get('/leaves/my')
        .then((r) => setMyRequests(r.data || []))
        .catch(() => setMyRequests([]));
      // Both endpoints return all of the user's items (not month-scoped), so a
      // single fetch covers every month the calendar can navigate to.
      api.get('/leave-plans/my')
        .then((r) => setMyPlans(r.data || []))
        .catch(() => setMyPlans([]));
    }
  }, [tab, myRequests]);

  // Refetch the employee's requests every time the New Request tab opens, so
  // the overlap check always runs against the latest data (not a cached list).
  useEffect(() => {
    if (tab === 'request') {
      api.get('/leaves/my')
        .then((r) => setMyRequests(r.data || []))
        .catch(() => setMyRequests([]));
    }
  }, [tab]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'request',  label: 'New Request' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'plan',     label: 'Leave Plan' },
  ];

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Leave
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          Manage your leave balance and requests
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <OverviewTab userId={user?.id} />}
      {tab === 'request'  && <RequestTab requests={myRequests || []} onSubmitted={() => setTab('overview')} />}
      {tab === 'calendar' && (
        <LeaveCalendarView
          requests={myRequests || []}
          plans={myPlans}
          getLeaveTypeColor={getLeaveTypeColor}
          getLeaveTypeTextColor={getLeaveTypeTextColor}
          leaveTypeLabels={LEAVE_TYPE_LABELS}
        />
      )}
      {tab === 'plan'     && <PlanTab />}
    </Shell>
  );
}

// ── Overview ──────────────────────────────────────────────────
function OverviewTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(null);
  const [requests, setRequests] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.get('/leaves/entitlement/me').then((r) => r.data).catch(() => null),
      api.get('/leaves/my').then((r) => r.data).catch(() => []),
    ])
      .then(([ent, reqs]) => {
        setEntitlement(ent);
        setRequests(reqs || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelRequest = async (id) => {
    try {
      await api.delete(`/leaves/${id}`);
      toast.success('Leave request cancelled');
      setConfirmId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel request');
    }
  };

  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const canCancel = (r) =>
    r.status !== 'APPROVED' &&
    r.status !== 'REJECTED' &&
    new Date(`${r.startDate}T00:00:00`) > todayMid;

  if (loading) return <Spinner />;

  const total = num(entitlement?.totalDays);
  const used = num(entitlement?.usedDays);
  const remaining = total - used;
  const hasEntitlement = entitlement && total > 0;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={card}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>
          Leave Entitlement {entitlement?.year ? `· ${entitlement.year}` : ''}
        </h3>

        {!hasEntitlement ? (
          <EmptyState
            icon={CalendarDays}
            title="No leave entitlement assigned yet"
            subtitle="Please contact HR."
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <Stat label="Total Days" value={total} />
              <Stat label="Used Days" value={used} />
              <Stat label="Remaining" value={remaining} color={remaining > 0 ? C.green : C.red} />
            </div>
            <div style={{ height: 8, background: '#E4E3DC', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 6, transition: 'width 0.4s' }} />
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: '8px 0 0' }}>
              {used} of {total} days used
            </p>
          </>
        )}
      </div>

      <div style={card}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>
          My Requests
        </h3>
        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title="No leave requests yet" subtitle="Submit a request from the New Request tab." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r) => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: '#FAFAF7' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      backgroundColor: getLeaveTypeColor(r.leaveType),
                      color: getLeaveTypeTextColor(r.leaveType),
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'inline-block',
                    }}>
                      {LEAVE_TYPE_LABELS[r.leaveType] || 'Other'}
                    </span>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
                      {formatDate(r.startDate)} → {formatDate(r.endDate)} · {num(r.daysCount)} day{num(r.daysCount) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge status={r.status} />
                </div>

                {canCancel(r) && (
                  confirmId === r.id ? (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: C.dark }}>
                        Are you sure you want to cancel this leave request? This cannot be undone.
                      </p>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button variant="danger" onClick={() => cancelRequest(r.id)} style={{ padding: '6px 12px', fontSize: 12 }}>Yes, Cancel Request</Button>
                        <Button variant="ghost" onClick={() => setConfirmId(null)} style={{ padding: '6px 12px', fontSize: 12 }}>Keep It</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmId(r.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: C.muted, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px', transition: 'color 0.15s' }}
                      >
                        <Trash2 size={14} /> Cancel Request
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = C.dark }) {
  return (
    <div style={{ background: '#FAFAF7', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.faint, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 600, color, margin: '6px 0 0', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  );
}

// ── New Request ───────────────────────────────────────────────
function RequestTab({ requests = [], onSubmitted }) {
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const isHalf = leaveType === 'HALF_DAY';

  // Day count excludes weekends — a Mon→Fri range counts as 5 days, not 7.
  const days = (() => {
    if (isHalf) return 0.5;
    if (!startDate || !endDate) return 0;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (e < s) return 0;
    let count = 0;
    const current = new Date(s);
    while (current <= e) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  })();

  // Block weekends from being selected at all in the native date inputs.
  const guardWeekend = (v) => {
    if (isWeekend(v)) {
      toast.error('Weekends cannot be selected for leave');
      return false;
    }
    return true;
  };
  const setSingleDate = (v) => { if (!guardWeekend(v)) return; setStartDate(v); setEndDate(v); };
  const handleStartDate = (v) => { if (!guardWeekend(v)) return; setStartDate(v); };
  const handleEndDate = (v) => { if (!guardWeekend(v)) return; setEndDate(v); };

  // Re-evaluated each render, so it clears automatically when dates change.
  const overlap = hasDateOverlap(startDate, endDate, requests);

  const pickFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast.error('File must be 10MB or smaller');
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error('Please select a date');
    setSubmitting(true);
    try {
      const { data } = await api.post('/leaves/request', { leaveType, startDate, endDate, reason });
      let docAttached = false;
      if (file && data?.id) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          await api.post(`/leaves/${data.id}/document`, fd);
          docAttached = true;
        } catch {
          toast.error('Request submitted, but document upload failed');
        }
      }
      toast.success(`Leave request submitted successfully${docAttached ? '. Document attached.' : ''}`);
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ ...card, maxWidth: 560 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>New Leave Request</h3>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Leave Type</label>
          <select style={inputStyle} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {isHalf ? (
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Date</label>
            <input type="date" style={inputStyle} value={startDate} onChange={(e) => setSingleDate(e.target.value)} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={fieldLabel}>Start Date</label>
              <input type="date" style={inputStyle} value={startDate} onChange={(e) => handleStartDate(e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>End Date</label>
              <input type="date" style={inputStyle} value={endDate} onChange={(e) => handleEndDate(e.target.value)} />
            </div>
          </div>
        )}

        {overlap && (
          <p style={{ fontSize: 13, color: C.red, margin: '0 0 16px', padding: '10px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
            You already have a leave request on these dates. Please cancel the existing request first before submitting a new one.
          </p>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Reason (optional)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a note for your manager"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Supporting Document (optional)</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${dragging ? C.accent : C.border}`,
              borderRadius: 10, padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(200,32,61,0.03)' : '#FAFAF7',
              transition: 'border-color 0.18s, background 0.18s',
            }}
          >
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FileText size={16} style={{ color: C.accent }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{file.name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>· click to replace</span>
              </div>
            ) : (
              <>
                <Upload size={20} style={{ color: 'rgba(21,22,26,0.3)', marginBottom: 6 }} />
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(21,22,26,0.6)' }}>
                  Drag &amp; drop or <span style={{ color: C.accent, fontWeight: 500 }}>click to upload</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>
                  Attach medical certificate, approval letter, etc. · Max 10 MB
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ''; }}
            />
          </div>
        </div>

        {days > 0 && (
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', padding: '10px 12px', background: '#FAFAF7', border: `1px solid ${C.border}`, borderRadius: 8 }}>
            This request will use <strong style={{ color: C.accent }}>{days}</strong> day{days !== 1 ? 's' : ''} from your balance.
          </p>
        )}

        <Button type="submit" disabled={submitting || overlap} style={{ width: '100%', opacity: (submitting || overlap) ? 0.6 : 1 }}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
      </form>
    </div>
  );
}

// ── Leave Plan ────────────────────────────────────────────────
function PlanTab() {
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [plans, setPlans] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const loadPlans = () => {
    setPlans(null);
    setLoadError(false);
    api.get('/leave-plans/my')
      .then((r) => setPlans(r.data || []))
      .catch(() => { setLoadError(true); setPlans([]); });
  };

  useEffect(() => { loadPlans(); }, []);

  const workingDays = countWorkingDays(startDate, endDate);

  // Block weekends from being selected at all, matching the New Request form.
  const guardWeekend = (v) => {
    if (isWeekend(v)) {
      toast.error('Weekends cannot be selected for leave');
      return false;
    }
    return true;
  };
  const handleStartDate = (v) => { if (!guardWeekend(v)) return; setStartDate(v); };
  const handleEndDate = (v) => { if (!guardWeekend(v)) return; setEndDate(v); };

  const submit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error('Please select start and end dates');
    setSubmitting(true);
    try {
      await api.post('/leave-plans', { leaveType, startDate, endDate, note });
      toast.success('Added to your leave plan');
      setLeaveType('ANNUAL');
      setStartDate('');
      setEndDate('');
      setNote('');
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add plan');
    } finally {
      setSubmitting(false);
    }
  };

  const removePlan = async (id) => {
    try {
      await api.delete(`/leave-plans/${id}`);
      toast.success('Leave plan removed');
      setConfirmId(null);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove plan');
    }
  };

  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const canDelete = (p) => new Date(`${p.startDate}T00:00:00`) > todayMid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section A — New Plan Form */}
      <div style={{ ...card, maxWidth: 560 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>Plan Future Leave</h3>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Leave Type</label>
            <select style={inputStyle} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={fieldLabel}>Start Date</label>
              <input type="date" style={inputStyle} value={startDate} onChange={(e) => handleStartDate(e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>End Date</label>
              <input type="date" style={inputStyle} value={endDate} onChange={(e) => handleEndDate(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Note (optional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>

          {workingDays > 0 && (
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px', padding: '10px 12px', background: '#FAFAF7', border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <strong style={{ color: C.accent }}>{workingDays}</strong> working day{workingDays !== 1 ? 's' : ''}
            </p>
          )}

          <Button type="submit" disabled={submitting} style={{ width: '100%', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Adding…' : 'Add to Plan'}
          </Button>
        </form>
      </div>

      {/* Section B — My Plans List */}
      <div style={card}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>My Plans</h3>

        {plans === null ? (
          <Spinner />
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: C.red }}>Failed to load plans.</p>
            <Button variant="outline" onClick={loadPlans}>Retry</Button>
          </div>
        ) : plans.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No leave plans yet" subtitle="Add your first plan above." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: '#FAFAF7' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={planPill(getLeaveTypeColor(p.leaveType))}>{typeLabel(p.leaveType)}</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: C.dark }}>
                    {fmtPlanDate(p.startDate)} → {fmtPlanDate(p.endDate)} · {num(p.daysCount)} working day{num(p.daysCount) !== 1 ? 's' : ''}
                  </p>
                  {p.note && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{p.note}</p>}
                </div>

                {canDelete(p) && (
                  confirmId === p.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Are you sure?</span>
                      <Button variant="danger" onClick={() => removePlan(p.id)} style={{ padding: '5px 10px', fontSize: 12 }}>Confirm</Button>
                      <Button variant="ghost" onClick={() => setConfirmId(null)} style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(p.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, background: 'transparent', border: 'none', color: C.muted, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 6px' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

