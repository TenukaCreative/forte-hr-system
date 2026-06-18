import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../api/axios';
import NotificationPanel from '../NotificationPanel';

export default function Topbar({ title }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api.get('/notifications/me')
      .then((r) => setUnreadCount((r.data || []).filter((n) => !n.isRead).length))
      .catch(() => {});
  }, []);

  return (
    <>
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-right">
        <button
          className="topbar-bell"
          aria-label="Notifications"
          onClick={() => setNotifOpen(true)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </div>

      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}
