import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../api/axios';

export default function Topbar({ title }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/me')
      .then((r) => setUnread(r.data.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, []);

  return (
    <>
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-right">
        <button className="topbar-bell" aria-label="Notifications">
          <Bell size={20} />
          {unread > 0 && <span className="bell-dot" />}
        </button>
      </div>
    </>
  );
}
