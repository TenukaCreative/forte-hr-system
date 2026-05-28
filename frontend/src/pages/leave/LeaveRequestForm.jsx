import { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

export default function LeaveRequestForm({ onSubmitted }) {
  const [form, setForm] = useState({
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

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

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 className="section-title">New Leave Request</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Leave Type</label>
          <select className="form-select" value={form.leaveType} onChange={f('leaveType')}>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={form.startDate} onChange={f('startDate')} required />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={form.endDate} onChange={f('endDate')} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Reason</label>
          <textarea className="form-textarea" value={form.reason} onChange={f('reason')} placeholder="Brief reason for leave…" rows={3} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
