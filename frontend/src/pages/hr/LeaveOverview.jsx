import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const STATUS_STYLES = {
  PENDING:  { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  APPROVED: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
};

const TYPE_STYLES = {
  PAID:   { bg: '#DCFCE7', color: '#16A34A' },
  UNPAID: { bg: '#FEF3C7', color: '#D97706' },
};

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

export default function LeaveOverview() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/all');
      setLeaves(data);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handle = async (id, action) => {
    setActing(id + action);
    try {
      const { data } = await api.patch(`/leaves/${id}/${action}`);
      toast.success(data.message || (action === 'approve' ? 'Leave approved' : 'Leave rejected'));
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} leave`);
    } finally { setActing(null); }
  };

  const counts = {
    pending:  leaves.filter((l) => l.status === 'PENDING').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  };

  if (loading) return <Shell><div className="spinner-full"><div className="spinner" /></div></Shell>;

  return (
    <Shell>
      <style>{`
        .lo-row { transition: background 0.15s; }
        .lo-row:hover td { background: #FAFAF7; }
        .lo-approve { background: #16A34A; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s, opacity 0.15s; }
        .lo-approve:hover:not(:disabled) { background: #15803d; }
        .lo-approve:disabled { opacity: 0.5; cursor: not-allowed; }
        .lo-reject { background: #fff; color: #DC2626; border: 1.5px solid #DC2626; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s, opacity 0.15s; }
        .lo-reject:hover:not(:disabled) { background: #FEE2E2; }
        .lo-reject:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Leave Overview
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
          {leaves.length} total request{leaves.length === 1 ? '' : 's'}
        </p>
      </div>

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
                {['Employee', 'Department', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map((h) => (
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
                const isPending = l.status === 'PENDING';
                const name = l.Employee?.User?.name;
                const isLast = i === leaves.length - 1;
                const cellBase = { padding: '14px 16px', fontSize: 14, color: '#15161A', verticalAlign: 'middle' };
                const rowBorder = isLast ? 'none' : '1px solid #E4E3DC';

                return (
                  <tr key={l.id} className="lo-row" style={{ borderBottom: rowBorder }}>
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
                      {l.Employee?.department || '—'}
                    </td>

                    {/* Type pill */}
                    <td style={cellBase}>
                      <span style={{
                        background: tStyle.bg, color: tStyle.color,
                        borderRadius: 100, padding: '3px 10px',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {l.leaveType}
                      </span>
                    </td>

                    {/* From */}
                    <td style={{ ...cellBase, fontSize: 13 }}>{formatDate(l.startDate)}</td>

                    {/* To */}
                    <td style={{ ...cellBase, fontSize: 13 }}>{formatDate(l.endDate)}</td>

                    {/* Days */}
                    <td style={{ ...cellBase, fontWeight: 600, textAlign: 'center' }}>{l.totalDays}</td>

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

                    {/* Actions */}
                    <td style={cellBase}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="lo-approve"
                            disabled={!!acting}
                            onClick={() => handle(l.id, 'approve')}
                            style={acting === l.id + 'approve' ? { opacity: 0.6 } : undefined}
                          >
                            {acting === l.id + 'approve' ? '…' : 'Approve'}
                          </button>
                          <button
                            className="lo-reject"
                            disabled={!!acting}
                            onClick={() => handle(l.id, 'reject')}
                            style={acting === l.id + 'reject' ? { opacity: 0.6 } : undefined}
                          >
                            {acting === l.id + 'reject' ? '…' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: 'rgba(21,22,26,0.25)', display: 'block', textAlign: 'center' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
