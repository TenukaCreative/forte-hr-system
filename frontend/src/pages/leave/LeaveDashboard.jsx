import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

const STATUS_COLORS = {
  PENDING:  { bg: '#FEF3C7', color: '#92400E' },
  APPROVED: { bg: '#D1FAE5', color: '#065F46' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
};

export default function LeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaves/my')
      .then((r) => setLeaves(r.data))
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-full"><div className="spinner" /></div>;

  const taken   = leaves.filter((l) => l.status === 'APPROVED').reduce((s, l) => s + (l.totalDays || 0), 0);
  const pending = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div>
      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <p className="stat-card-title">Days Taken</p>
          <p className="stat-card-value">{taken}</p>
          <p className="stat-card-sub">Approved leave days</p>
        </div>
        <div className="stat-card">
          <p className="stat-card-title">Pending</p>
          <p className="stat-card-value">{pending}</p>
          <p className="stat-card-sub">Awaiting approval</p>
        </div>
      </div>

      {/* History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'rgba(21,22,26,0.4)', padding: '32px 0' }}>
                  No leave requests yet
                </td>
              </tr>
            )}
            {leaves.map((l) => {
              const st = STATUS_COLORS[l.status] || STATUS_COLORS.PENDING;
              return (
                <tr key={l.id}>
                  <td>{l.leaveType}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>{l.totalDays}</td>
                  <td style={{ color: 'rgba(21,22,26,0.6)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.reason || '—'}
                  </td>
                  <td>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
