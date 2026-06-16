import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Tabs } from '../../components/ui';
import LeaveDetailModal from '../../components/leave/LeaveDetailModal';
import TeamLeaveGantt from '../../components/leave/TeamLeaveGantt';

const STATUS_STYLES = {
  PENDING:          { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  MANAGER_APPROVED: { bg: '#DBEAFE', color: '#2563EB', label: 'Manager Approved' },
  APPROVED:         { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  REJECTED:         { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
};

const TYPE_STYLES = {
  PAID:   { bg: '#DCFCE7', color: '#16A34A' },
  UNPAID: { bg: '#FEF3C7', color: '#D97706' },
};

const formatType = (t) =>
  t ? t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

const formatDate = (iso) =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const initial = (name) => (name ? name.trim().charAt(0).toUpperCase() : '?');

function SummaryCard({ label, count, sub, Icon, color, iconBg }) {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      padding: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(21,22,26,0.4)',
          margin: 0,
        }}>
          {label}
        </p>
        <span style={{
          width: 36, height: 36, borderRadius: '50%',
          background: iconBg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </span>
      </div>
      <p style={{ fontSize: 48, fontWeight: 700, color, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {count}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(21,22,26,0.4)', margin: 0 }}>{sub}</p>
      <span style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, background: color, borderRadius: '0 0 12px 12px',
      }} />
    </div>
  );
}

// ── Tab 1: All Requests ───────────────────────────────────────
function AllRequestsView() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/all');
      setLeaves(data);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const counts = {
    pending:  leaves.filter((l) => l.status === 'PENDING' || l.status === 'MANAGER_APPROVED').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  };

  if (loading) return <div className="spinner-full"><div className="spinner" /></div>;

  return (
    <>
      <style>{`
        .lo-row { transition: background 0.15s; }
        .lo-row:hover td { background: #FAFAF7; }
      `}</style>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        <SummaryCard label="Pending"  count={counts.pending}  sub="Awaiting approval" Icon={Clock}       color="#D97706" iconBg="#FEF3C7" />
        <SummaryCard label="Approved" count={counts.approved} sub="This period"       Icon={CheckCircle} color="#16A34A" iconBg="#DCFCE7" />
        <SummaryCard label="Rejected" count={counts.rejected} sub="This period"       Icon={XCircle}     color="#DC2626" iconBg="#FEE2E2" />
      </div>

      {/* Requests table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#15161A', margin: 0, letterSpacing: '-0.01em' }}>
            Leave Requests
          </h3>
          <span style={{
            background: '#C8203D', color: '#fff',
            padding: '4px 12px', borderRadius: 100,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            All
          </span>
        </div>

        {leaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Calendar size={40} style={{ color: 'rgba(21,22,26,0.15)', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'rgba(21,22,26,0.4)' }}>No leave requests found</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(21,22,26,0.3)' }}>
              Leave requests will appear here once submitted
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #E4E3DC' }}>
                {['Employee', 'Department', 'Type', 'From', 'To', 'Days', 'Reason', 'Status'].map((h) => (
                  <th key={h} style={{
                    textAlign: h === 'Days' ? 'center' : 'left',
                    padding: '12px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'rgba(21,22,26,0.4)',
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l, i) => {
                const sStyle = STATUS_STYLES[l.status] || STATUS_STYLES.PENDING;
                const tStyle = TYPE_STYLES[l.leaveType] || TYPE_STYLES.PAID;
                const name = l.employee?.name;
                const isLast = i === leaves.length - 1;
                const cellBase = { padding: '14px 16px', fontSize: 14, color: '#15161A', verticalAlign: 'middle' };
                const rowBorder = isLast ? 'none' : '1px solid #E4E3DC';

                return (
                  <tr key={l.id} className="lo-row" onClick={() => setSelectedRequest(l)} style={{ borderBottom: rowBorder, cursor: 'pointer' }}>
                    {/* Employee with avatar */}
                    <td style={{ ...cellBase, fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'row' }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#C8203D', color: '#fff',
                          fontSize: 11, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          marginRight: 10, flexShrink: 0,
                        }}>
                          {initial(name)}
                        </span>
                        {name || '—'}
                      </span>
                    </td>

                    {/* Department */}
                    <td style={{ ...cellBase, color: 'rgba(21,22,26,0.5)', fontSize: 13 }}>
                      {l.employee?.department || '—'}
                    </td>

                    {/* Type pill */}
                    <td style={cellBase}>
                      <span style={{
                        background: tStyle.bg, color: tStyle.color,
                        borderRadius: 100, padding: '3px 10px',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {formatType(l.leaveType)}
                      </span>
                    </td>

                    {/* From */}
                    <td style={{ ...cellBase, fontSize: 13 }}>{formatDate(l.startDate)}</td>

                    {/* To */}
                    <td style={{ ...cellBase, fontSize: 13 }}>{formatDate(l.endDate)}</td>

                    {/* Days */}
                    <td style={{ ...cellBase, fontWeight: 600, textAlign: 'center' }}>{l.daysCount}</td>

                    {/* Reason */}
                    <td
                      style={{
                        ...cellBase,
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'rgba(21,22,26,0.5)',
                        fontSize: 13,
                      }}
                      title={l.reason || ''}
                    >
                      {l.reason || '—'}
                    </td>

                    {/* Status pill */}
                    <td style={cellBase}>
                      <span style={{
                        background: sStyle.bg, color: sStyle.color,
                        borderRadius: 100, padding: '4px 12px',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {sStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedRequest && (
        <LeaveDetailModal
          request={selectedRequest}
          mode="final"
          readOnly={selectedRequest.status !== 'MANAGER_APPROVED'}
          onClose={() => setSelectedRequest(null)}
          onAction={() => {
            setSelectedRequest(null);
            fetchLeaves();
          }}
        />
      )}
    </>
  );
}

// ── Tabs 2 & 3: Approvals (manager Step 1 / final Step 2) ─────
function ApprovalsView({ kind }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const endpoint = kind === 'team' ? '/leaves/pending-manager' : '/leaves/pending-approval';

  const load = () =>
    api.get(endpoint).then((r) => setRequests(r.data || [])).catch(() => toast.error('Failed to load requests'));

  useEffect(() => { load().finally(() => setLoading(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="spinner-full"><div className="spinner" /></div>;

  if (requests.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '48px 24px', textAlign: 'center' }}>
        <Calendar size={40} style={{ color: 'rgba(21,22,26,0.15)', marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'rgba(21,22,26,0.4)' }}>Nothing to review</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(21,22,26,0.3)' }}>
          There are no requests awaiting your decision.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {requests.map((r) => {
          const sStyle = STATUS_STYLES[r.status] || STATUS_STYLES.PENDING;
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#15161A' }}>{r.employee?.name || 'Employee'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.5)' }}>{r.employee?.jobTitle || r.employee?.email}</p>
                </div>
                <span style={{ background: sStyle.bg, color: sStyle.color, borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>
                  {sStyle.label}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#15161A', marginBottom: 12 }}>
                <span><strong style={{ color: 'rgba(21,22,26,0.5)', fontWeight: 600 }}>Type:</strong> {formatType(r.leaveType)}</span>
                <span><strong style={{ color: 'rgba(21,22,26,0.5)', fontWeight: 600 }}>Dates:</strong> {formatDate(r.startDate)} → {formatDate(r.endDate)}</span>
                <span><strong style={{ color: 'rgba(21,22,26,0.5)', fontWeight: 600 }}>Days:</strong> {r.daysCount}</span>
              </div>

              {r.reason && (
                <p style={{ fontSize: 13, color: '#15161A', margin: '0 0 12px', padding: '10px 12px', background: '#FAFAF7', border: '1px solid #E4E3DC', borderRadius: 8 }}>
                  {r.reason}
                </p>
              )}

              {kind === 'final' && r.manager && (
                <p style={{ fontSize: 12, color: 'rgba(21,22,26,0.5)', margin: '0 0 12px' }}>
                  Approved by manager: <strong style={{ color: '#15161A' }}>{r.manager.name}</strong>
                  {r.managerNote ? ` — “${r.managerNote}”` : ''}
                </p>
              )}

              <Button onClick={() => setSelectedRequest(r)} style={{ padding: '6px 14px', fontSize: 12 }}>Review</Button>
            </div>
          );
        })}
      </div>

      {selectedRequest && (
        <LeaveDetailModal
          request={selectedRequest}
          mode={kind === 'team' ? 'manager' : 'final'}
          onClose={() => setSelectedRequest(null)}
          onAction={() => {
            setSelectedRequest(null);
            load();
          }}
        />
      )}
    </>
  );
}

// ── Tab 4: Team Leave (Gantt timeline, view-only) ─────────────
function TeamLeaveView() {
  const { resolvedRole } = useAuth();
  const isHr = resolvedRole === 'HR_MANAGER' || resolvedRole === 'SUPER_ADMIN';

  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    // HR / Super Admin see all leaves; SENIOR sees their direct reports' approved leaves.
    const endpoint = isHr ? '/leaves/all' : '/leaves/team-approved';
    api.get(endpoint)
      .then((r) => setTeamLeaves(r.data || []))
      .catch(() => toast.error('Failed to load team leaves'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="spinner-full"><div className="spinner" /></div>;

  return (
    <>
      <TeamLeaveGantt requests={teamLeaves} onSelectRequest={(r) => setSelectedRequest(r)} />

      {selectedRequest && (
        <LeaveDetailModal
          request={selectedRequest}
          mode="final"
          readOnly
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </>
  );
}

export default function LeaveOverview() {
  const { resolvedRole } = useAuth();
  const isSenior = resolvedRole === 'SENIOR' || resolvedRole === 'SUPER_ADMIN';
  const isHr = resolvedRole === 'HR_MANAGER' || resolvedRole === 'SUPER_ADMIN';

  const tabs = [];
  if (isHr) tabs.push({ key: 'all', label: 'All Requests' });
  if (isSenior) tabs.push({ key: 'team', label: 'Team Approvals' });
  if (isHr) tabs.push({ key: 'final', label: 'Final Approvals' });
  if (isHr || isSenior) tabs.push({ key: 'team-leave', label: 'Team Leave' });

  const [tab, setTab] = useState(null);
  const activeTab = tab || tabs[0]?.key;

  return (
    <Shell>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Leave Overview
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
          Review and manage leave requests
        </p>
      </div>

      {tabs.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <Tabs tabs={tabs} active={activeTab} onChange={setTab} />
        </div>
      )}

      {activeTab === 'all' && <AllRequestsView />}
      {activeTab === 'team' && <ApprovalsView kind="team" />}
      {activeTab === 'final' && <ApprovalsView kind="final" />}
      {activeTab === 'team-leave' && <TeamLeaveView />}
    </Shell>
  );
}
