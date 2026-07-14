import { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationPanel from '../NotificationPanel';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title }) {
  const { notifCount, setNotifCount } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

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
          {notifCount > 0 && (
            <span className="bell-badge">{notifCount > 9 ? '9+' : notifCount}</span>
          )}
        </button>
      </div>

      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setNotifCount}
      />
    </>
  );
}
