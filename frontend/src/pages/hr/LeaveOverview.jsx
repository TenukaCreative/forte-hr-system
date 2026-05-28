import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const STATUS_COLORS = {
  PENDING:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  APPROVED: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

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
      <div className="page-header">
        <div>
          <h1>Leave Overview</h1>
          <p>{leaves.length} total requests</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="stat-card-title">Pending</p>
            <span className="stat-card-icon"><Clock size={18} /></span>
          </div>
          <p className="stat-card-value" style={{ color: '#92400E' }}>{counts.pending}</p>
          <p className="stat-card-sub">Awaiting approval</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="stat-card-title">Approved</p>
            <span className="stat-card-icon"><CheckCircle size={18} /></span>
          </div>
          <p className="stat-card-value" style={{ color: '#065F46' }}>{counts.approved}</p>
          <p className="stat-card-sub">This period</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="stat-card-title">Rejected</p>
            <span className="stat-card-icon"><XCircle size={18} /></span>
          </div>
          <p className="stat-card-value" style={{ color: '#991B1B' }}>{counts.rejected}</p>
          <p className="stat-card-sub">This period</p>
        </div>
      </div>

      {/* Requests table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'rgba(21,22,26,0.4)', padding: '40px 0' }}>
                  No leave requests found
                </td>
              </tr>
            )}
            {leaves.map((l) => {
              const st = STATUS_COLORS[l.status] || STATUS_COLORS.PENDING;
              const isPending = l.status === 'PENDING';
              return (
                <tr key={l.id}>
                  <td style={{ fontWeight: 500 }}>{l.Employee?.User?.name || '—'}</td>
                  <td style={{ color: 'rgba(21,22,26,0.6)' }}>{l.Employee?.department || '—'}</td>
                  <td>{l.leaveType}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>{l.totalDays}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(21,22,26,0.6)' }}>
                    {l.reason || '—'}
                  </td>
                  <td>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>
                      {st.label}
                    </span>
                  </td>
                  <td>
                    {isPending ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          disabled={!!acting}
                          onClick={() => handle(l.id, 'approve')}
                        >
                          {acting === l.id + 'approve' ? '…' : 'Approve'}
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          disabled={!!acting}
                          onClick={() => handle(l.id, 'reject')}
                        >
                          {acting === l.id + 'reject' ? '…' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
