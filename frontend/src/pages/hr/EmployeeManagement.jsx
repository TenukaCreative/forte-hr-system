import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

export default function EmployeeManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/employees').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Shell><div className="spinner-full"><div className="spinner" /></div></Shell>;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1>Employee Management</h1>
          <p>{users.length} team members</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-wrap">
            <Search size={15} />
            <input
              type="search"
              className="search-input"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Join Date</th>
              <th>Profile</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'rgba(21,22,26,0.4)', padding: '40px 0' }}>
                  No employees found
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td style={{ color: 'rgba(21,22,26,0.6)' }}>{u.email}</td>
                <td><span style={{ fontSize: 12, color: 'rgba(21,22,26,0.6)', fontWeight: 500 }}>{u.role?.replace(/_/g, ' ')}</span></td>
                <td>{u.employee?.department || <span style={{ color: 'rgba(21,22,26,0.3)' }}>—</span>}</td>
                <td>{u.employee?.designation || <span style={{ color: 'rgba(21,22,26,0.3)' }}>—</span>}</td>
                <td>{u.employee?.joinDate || <span style={{ color: 'rgba(21,22,26,0.3)' }}>—</span>}</td>
                <td>
                  {u.employee
                    ? <span className="badge badge-active">Complete</span>
                    : <span className="badge badge-incomplete">Incomplete</span>}
                </td>
                <td>
                  <button className="btn-ghost" onClick={() => navigate(`/employees/${u.id}`)}>
                    <UserPlus size={14} /> View / Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
