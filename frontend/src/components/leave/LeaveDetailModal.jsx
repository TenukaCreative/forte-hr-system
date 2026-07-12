import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { C, card, formatDate, LEAVE_TYPE_COLORS, getLeaveTypeColor, getLeaveTypeTextColor, LEAVE_TYPE_LABELS } from '../../components/theme';
import { Badge, Button } from '../ui';

const typeLabel = (v) => LEAVE_TYPE_LABELS[v] || v;

const labelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: C.faint, margin: '0 0 6px',
};

function Detail({ label, value }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: C.dark, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

export default function LeaveDetailModal({ request, onClose, onAction, mode = 'manager', readOnly = false }) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!request) return null;

  // The employee may cancel their own request while it is still pending and
  // its start date is in the future.
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const canDelete =
    user?.id === request.employeeId &&
    request.status !== 'APPROVED' &&
    request.status !== 'REJECTED' &&
    new Date(`${request.startDate}T00:00:00`) > todayMid;

  const reviewPath = mode === 'final'
    ? `/leaves/${request.id}/final-review`
    : `/leaves/${request.id}/manager-review`;

  const del = async () => {
    setBusy(true);
    try {
      await api.delete(`/leaves/${request.id}`);
      toast.success('Leave request cancelled');
      onAction?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel request');
    } finally {
      setBusy(false);
    }
  };

  const act = async (status) => {
    setBusy(true);
    try {
      const { data } = await api.patch(reviewPath, { status, note: note || null });
      toast.success(status === 'APPROVED' ? 'Approved' : 'Rejected');
      onAction?.(data);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const viewDocument = async () => {
    try {
      const res = await api.get(`/leaves/${request.id}/document`);
      if (res.data.url) {
        const a = document.createElement('a');
        a.href = res.data.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 20, overflowY: 'auto',
      }}
    >
      <style>{`@keyframes ldm-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...card, width: '100%', maxWidth: 520, marginTop: 80,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'ldm-in 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.dark }}>Leave Request</h3>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Employee */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.dark }}>{request.employee?.name || 'Employee'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.muted }}>{request.employee?.jobTitle || '—'}</p>
            <span style={{
              marginTop: 8,
              backgroundColor: getLeaveTypeColor(request.leaveType),
              color: getLeaveTypeTextColor(request.leaveType),
              borderRadius: '9999px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
            }}>
              {typeLabel(request.leaveType)}
            </span>
          </div>
          <Badge status={request.status} />
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <Detail label="From" value={formatDate(request.startDate)} />
          <Detail label="To" value={formatDate(request.endDate)} />
          <Detail label="Days" value={request.daysCount} />
          <Detail label="Submitted" value={formatDate(request.createdAt)} />
        </div>

        {/* Reason */}
        {request.reason && (
          <div style={{ marginBottom: 18 }}>
            <p style={labelStyle}>Reason</p>
            <p style={{ margin: 0, fontSize: 14, color: C.dark, padding: '10px 12px', background: '#FAFAF7', border: `1px solid ${C.border}`, borderRadius: 8 }}>
              {request.reason}
            </p>
          </div>
        )}

        {/* Document */}
        <div style={{ marginBottom: 18 }}>
          <p style={labelStyle}>Document</p>
          {request.documentUrl ? (
            <Button variant="outline" onClick={viewDocument}>View Document</Button>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: C.faint }}>No document attached</p>
          )}
        </div>

        {/* Manager note (final mode) */}
        {mode === 'final' && request.managerNote && (
          <div style={{ marginBottom: 18 }}>
            <p style={labelStyle}>Manager Note</p>
            <p style={{ margin: 0, fontSize: 14, color: C.dark }}>{request.managerNote}</p>
          </div>
        )}

        {/* Actions */}
        {!readOnly && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              style={{
                width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: C.dark,
                background: '#fff', boxSizing: 'border-box', minHeight: 70, resize: 'vertical', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" disabled={busy} onClick={() => act('REJECTED')} style={{ flex: 1, color: C.red, borderColor: C.red }}>
                Reject
              </Button>
              <Button disabled={busy} onClick={() => act('APPROVED')} style={{ flex: 1 }}>
                {busy ? 'Working…' : 'Approve'}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel / delete — only for the employee viewing their own pending request */}
        {canDelete && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: !readOnly ? 16 : 0 }}>
            {confirmDelete ? (
              <>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: C.dark }}>
                  Are you sure you want to cancel this leave request? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="danger" disabled={busy} onClick={del} style={{ padding: '6px 12px', fontSize: 12 }}>
                    {busy ? 'Cancelling…' : 'Yes, Cancel Request'}
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', fontSize: 12 }}>
                    Keep It
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmDelete(true)}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: C.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px', transition: 'color 0.15s' }}
                >
                  <Trash2 size={14} /> Cancel Request
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
