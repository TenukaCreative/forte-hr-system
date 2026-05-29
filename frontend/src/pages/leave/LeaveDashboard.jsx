import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar } from 'lucide-react';
import api from '../../api/axios';

const STATUS_STYLES = {
  PENDING:  { bg: '#FEF3C7', color: '#D97706' },
  APPROVED: { bg: '#DCFCE7', color: '#16A34A' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
};

const TYPE_STYLES = {
  PAID:   { bg: '#DCFCE7', color: '#16A34A' },
  UNPAID: { bg: '#FEF3C7', color: '#D97706' },
};

const ENTITLEMENT = 14;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const card = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  padding: 24,
};

const statLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(21,22,26,0.4)',
  margin: 0,
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
  const takenPct = Math.min(100, (taken / ENTITLEMENT) * 100);

  return (
    <div>
      <style>{`.leave-row:hover td { background: #FAFAF7; }`}</style>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Card 1 — Days Taken */}
        <div style={card}>
          <p style={statLabel}>Days Taken</p>
          <p style={{ fontSize: 48, fontWeight: 700, color: '#15161A', margin: '8px 0 14px', lineHeight: 1, letterSpacing: '-0.02em' }}>{taken}</p>
          <div style={{ height: 6, background: '#E4E3DC', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${takenPct}%`, background: '#C8203D', borderRadius: 4, transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(21,22,26,0.4)', margin: 0 }}>of {ENTITLEMENT} days entitlement</p>
        </div>

        {/* Card 2 — Pending */}
        <div style={card}>
          <p style={statLabel}>Pending Approval</p>
          <p style={{ fontSize: 48, fontWeight: 700, color: pending > 0 ? '#d97706' : '#15161A', margin: '8px 0 14px', lineHeight: 1, letterSpacing: '-0.02em' }}>{pending}</p>
          <p style={{ fontSize: 12, color: 'rgba(21,22,26,0.4)', margin: 0 }}>awaiting review</p>
        </div>
      </div>

      {/* History */}
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#15161A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
        Leave History
      </h3>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {leaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(21,22,26,0.4)' }}>
            <Calendar size={32} style={{ color: 'rgba(21,22,26,0.2)', marginBottom: 10 }} />
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: 'rgba(21,22,26,0.55)' }}>No leave requests yet</p>
            <p style={{ margin: 0, fontSize: 13 }}>Submit your first leave request using the Request Leave tab</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF7' }}>
                {['Type', 'From', 'To', 'Days', 'Reason', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(21,22,26,0.4)', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => {
                const sStyle = STATUS_STYLES[l.status] || STATUS_STYLES.PENDING;
                const tStyle = TYPE_STYLES[l.leaveType] || TYPE_STYLES.PAID;
                return (
                  <tr key={l.id} className="leave-row" style={{ borderBottom: '1px solid #E4E3DC' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: tStyle.bg, color: tStyle.color, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {l.leaveType}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#15161A' }}>{formatDate(l.startDate)}</td>
                    <td style={{ padding: '14px 16px', color: '#15161A' }}>{formatDate(l.endDate)}</td>
                    <td style={{ padding: '14px 16px', color: '#15161A' }}>{l.totalDays}</td>
                    <td style={{ padding: '14px 16px', color: 'rgba(21,22,26,0.6)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.reason || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: sStyle.bg, color: sStyle.color, borderRadius: 100, fontSize: 11, fontWeight: 600, padding: '4px 12px', letterSpacing: '0.03em' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
