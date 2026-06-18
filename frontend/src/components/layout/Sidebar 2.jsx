import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { NAV } from './navConfig';
import forteLogo from '../../assets/forte-logo.webp';

export default function Sidebar() {
  const { user, logout, resolvedRole } = useAuth();
  const sections = NAV[resolvedRole] || [];

  // The JWT name can be stale after an HR edit — pull the live name from /auth/me.
  const [name, setName] = useState(user?.name);
  useEffect(() => {
    api.get('/auth/me')
      .then((r) => setName(r.data?.name || user?.name))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      <div className="sidebar-logo">
        <img src={forteLogo} alt="Forte" />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map((s) => (
          <div key={s.section} className="nav-section">
            <p className="nav-section-label">{s.section}</p>
            {s.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <p className="user-name">{name}</p>
          <p className="user-role">{user?.designation ?? ''}</p>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </>
  );
}
