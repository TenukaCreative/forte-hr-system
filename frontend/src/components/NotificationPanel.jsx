import { useEffect, useState } from 'react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from './ui';

// Relative time: "just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", then date.
const timeAgo = (date) => {
  if (!date) return '';
  const then = new Date(date);
  const diff = Date.now() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const unread = items.filter((n) => !n.isRead).length;

  // Fetch fresh notifications each time the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/notifications/me')
      .then((r) => {
        const data = r.data || [];
        setItems(data);
        onUnreadCountChange?.(data.filter((n) => !n.isRead).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    const next = items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setItems(next);
    onUnreadCountChange?.(next.filter((n) => !n.isRead).length);
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // best-effort; UI already reflects the read state
    }
  };

  const markAllRead = async () => {
    if (unread === 0) return;
    const next = items.map((n) => ({ ...n, isRead: true }));
    setItems(next);
    onUnreadCountChange?.(0);
    try {
      await api.patch('/notifications/read-all');
    } catch {
      // best-effort optimistic update
    }
  };

  const clearAll = async () => {
    if (items.length === 0) return;
    setItems([]);
    onUnreadCountChange?.(0);
    try {
      await api.delete('/notifications/clear-all');
    } catch {
      // best-effort optimistic update
    }
  };

  return (
    <>
      <style>{`
        .notif-panel { width: 380px; }
        @media (max-width: 480px) { .notif-panel { width: 100vw; } }
        .notif-item { transition: background 0.15s; cursor: pointer; }
        .notif-item:hover { background: #F4F3EE !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Panel */}
      <aside
        className="notif-panel"
        style={{
          position: 'fixed', top: 0, right: 0, height: '100%', maxWidth: '100vw',
          background: '#FFFFFF', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid #E4E3DC', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#15161A', letterSpacing: '-0.01em' }}>
              Notifications
            </h3>
            {unread > 0 && (
              <span style={{
                background: '#C8203D', color: '#fff', borderRadius: 100,
                minWidth: 20, height: 20, padding: '0 6px', fontSize: 11, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'transparent',
                  border: 'none', cursor: 'pointer', color: '#C8203D', fontSize: 12.5,
                  fontWeight: 600, fontFamily: 'inherit', padding: '6px 8px', borderRadius: 7,
                }}
              >
                <CheckCheck size={15} /> Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'transparent',
                  border: 'none', cursor: 'pointer', color: '#5a5b61', fontSize: 12.5,
                  fontWeight: 600, fontFamily: 'inherit', padding: '6px 8px', borderRadius: 7,
                }}
              >
                <Trash2 size={15} /> Clear All
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(21,22,26,0.5)', padding: 6, borderRadius: 7,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(21,22,26,0.4)' }}>
              <Bell size={30} style={{ color: 'rgba(21,22,26,0.18)', marginBottom: 12 }} />
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: 'rgba(21,22,26,0.55)' }}>
                No notifications yet
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>You&apos;re all caught up</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className="notif-item"
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 20px', borderBottom: '1px solid #F0EFE9',
                  background: n.isRead ? '#FFFFFF' : '#FAFAF7',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                  background: n.isRead ? '#D8D7D0' : '#C8203D',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 14, lineHeight: 1.45,
                    color: n.isRead ? 'rgba(21,22,26,0.55)' : '#15161A',
                    fontWeight: n.isRead ? 400 : 500,
                  }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.4)' }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
