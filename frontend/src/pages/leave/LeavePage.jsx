import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDays, Inbox, Upload, FileText } from 'lucide-react';
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

export default function LeavePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  // Shared leave list for the Calendar tab — fetched lazily the first time the
  // tab is opened, then cached (so it isn't refetched on every tab switch).
  const [myRequests, setMyRequests] = useState(null);

  useEffect(() => {
    if (tab === 'calendar' && myRequests === null) {
      api.get('/leaves/my')
        .then((r) => setMyRequests(r.data || []))
        .catch(() => setMyRequests([]));
    }
  }, [tab, myRequests]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'request',  label: 'New Request' },
    { key: 'calendar', label: 'Calendar' },
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
      {tab === 'request'  && <RequestTab onSubmitted={() => setTab('overview')} />}
      {tab === 'calendar' && <LeaveCalendarView requests={myRequests || []} />}
    </Shell>
  );
}

// ── Overview ──────────────────────────────────────────────────
function OverviewTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      api.get('/leaves/entitlement/me').then((r) => r.data).catch(() => null),
      api.get('/leaves/my').then((r) => r.data).catch(() => []),
    ])
      .then(([ent, reqs]) => {
        setEntitlement(ent);
        setRequests(reqs || []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

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
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, background: '#FAFAF7' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.dark }}>{typeLabel(r.leaveType)}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
                    {formatDate(r.startDate)} → {formatDate(r.endDate)} · {num(r.daysCount)} day{num(r.daysCount) !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge status={r.status} />
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
function RequestTab({ onSubmitted }) {
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
      toast.error(err.response?.data?.message || 'Failed to submit request');
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

        <Button type="submit" disabled={submitting} style={{ width: '100%', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
      </form>
    </div>
  );
}

