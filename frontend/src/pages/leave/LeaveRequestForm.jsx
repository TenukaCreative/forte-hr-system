import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar } from 'lucide-react';
import api from '../../api/axios';

const inputStyle = {
  width: '100%',
  border: '1.5px solid #E4E3DC',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#15161A',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s, box-shadow 0.18s',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#15161A',
  marginBottom: 6,
};

export default function LeaveRequestForm({ onSubmitted }) {
  const [form, setForm] = useState({
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setType = (leaveType) => setForm((p) => ({ ...p, leaveType }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.startDate > form.endDate) return toast.error('End date must be after start date');
    setSaving(true);
    try {
      await api.post('/leaves/request', form);
      toast.success('Leave request submitted');
      setForm({ leaveType: 'PAID', startDate: '', endDate: '', reason: '' });
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSaving(false); }
  };

  const dayCount = (() => {
    if (!form.startDate || !form.endDate) return null;
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    if (e < s) return null;
    return Math.floor((e - s) / 86400000) + 1;
  })();

  const typeBtn = (selected) => ({
    flex: 1,
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.18s',
    background: selected ? '#C8203D' : '#fff',
    color: selected ? '#fff' : 'rgba(21,22,26,0.6)',
    border: selected ? '1px solid #C8203D' : '1px solid #E4E3DC',
  });

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      padding: 32,
    }}>
      <style>{`
        .lr-input:focus { border-color: #C8203D !important; box-shadow: 0 0 0 3px rgba(200,32,61,0.08); }
        .lr-submit:hover:not(:disabled) { background: #a81830 !important; }
      `}</style>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#15161A', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
        New Leave Request
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Leave type pill toggle */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Leave Type</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={typeBtn(form.leaveType === 'PAID')} onClick={() => setType('PAID')}>Paid</button>
            <button type="button" style={typeBtn(form.leaveType === 'UNPAID')} onClick={() => setType('UNPAID')}>Unpaid</button>
          </div>
        </div>

        {/* Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" className="lr-input" style={inputStyle} value={form.startDate} onChange={f('startDate')} required />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input type="date" className="lr-input" style={inputStyle} value={form.endDate} onChange={f('endDate')} required />
          </div>
        </div>

        {/* Day count preview */}
        {dayCount !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(200,32,61,0.06)',
            border: '1px solid rgba(200,32,61,0.15)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 18,
          }}>
            <Calendar size={14} color="#C8203D" />
            <span style={{ fontSize: 14, color: '#C8203D', fontWeight: 500 }}>
              {dayCount} working day{dayCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}

        {/* Reason */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>
            Reason <span style={{ color: 'rgba(21,22,26,0.35)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            className="lr-input"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 92 }}
            value={form.reason}
            onChange={f('reason')}
            placeholder="Brief reason for your leave…"
            rows={4}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="lr-submit"
          disabled={saving}
          style={{
            width: '100%',
            background: '#C8203D',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 13,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'background 0.18s',
          }}
        >
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
