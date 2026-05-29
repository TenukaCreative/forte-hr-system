import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users, UserCheck, UserX, CheckCircle, AlertCircle } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const ROLE_STYLES = {
  IT:          { bg: '#DBEAFE', color: '#1E40AF' },
  HR_MANAGER:  { bg: '#FCE7F3', color: '#9D174D' },
  HEAD_OF_PMO: { bg: '#EDE9FE', color: '#5B21B6' },
  PM:          { bg: '#DCFCE7', color: '#166534' },
  BA:          { bg: '#FEF3C7', color: '#92400E' },
};
const DEFAULT_ROLE = { bg: '#F1F0EC', color: 'rgba(21,22,26,0.6)' };

const card = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  padding: 22,
};

const statLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(21,22,26,0.4)',
  margin: 0,
};

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (iso) =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

function SummaryCard({ label, value, sub, Icon, color, iconBg }) {
  return (
    <div style={{ ...card, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={statLabel}>{label}</p>
        <span style={{
          width: 36, height: 36, borderRadius: '50%', background: iconBg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </span>
      </div>
      <p style={{ fontSize: 42, fontWeight: 700, color, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(21,22,26,0.4)', margin: 0 }}>{sub}</p>
    </div>
  );
}

function SkeletonRow() {
  const cell = { padding: '14px 16px' };
  const bar = (w) => (
    <div className="em-skel" style={{ height: 14, width: w, borderRadius: 4 }} />
  );
  return (
    <tr style={{ borderBottom: '1px solid #E4E3DC' }}>
      <td style={cell}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="em-skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            {bar('60%')}
            <div style={{ height: 6 }} />
            {bar('40%')}
          </div>
        </div>
      </td>
      <td style={cell}>{bar(80)}</td>
      <td style={cell}>{bar(70)}</td>
      <td style={cell}>{bar(90)}</td>
      <td style={cell}>{bar(80)}</td>
      <td style={cell}>{bar(80)}</td>
      <td style={cell}>{bar(90)}</td>
    </tr>
  );
}

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

  const complete   = users.filter((u) => u.employee).length;
  const incomplete = users.filter((u) => !u.employee).length;

  const styleBlock = `
    @keyframes em-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .em-skel { background: linear-gradient(90deg,#f0eeea 25%,#e8e6e1 50%,#f0eeea 75%); background-size: 200% 100%; animation: em-shimmer 1.5s infinite; }
    .em-search { width: 260px; border: 1.5px solid #E4E3DC; border-radius: 10px; padding: 10px 14px 10px 38px; font-size: 14px; font-family: inherit; color: #15161A; background: #fff; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
    .em-search:focus { border-color: #C8203D; box-shadow: 0 0 0 3px rgba(200,32,61,0.08); }
    .em-row { transition: background 0.15s; }
    .em-row:hover td { background: #FAFAF7; }
    .em-action { background: #fff; border: 1.5px solid #E4E3DC; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 500; color: #15161A; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; transition: border-color 0.18s, color 0.18s; }
    .em-action:hover { border-color: #C8203D; color: #C8203D; }
  `;

  return (
    <Shell>
      <style>{styleBlock}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Employee Management
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
            {users.length} team member{users.length === 1 ? '' : 's'}
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(21,22,26,0.35)', pointerEvents: 'none' }} />
          <input
            type="search"
            className="em-search"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        <SummaryCard
          label="Total Staff"
          value={users.length}
          sub="team members"
          Icon={Users}
          color="#C8203D"
          iconBg="rgba(200,32,61,0.08)"
        />
        <SummaryCard
          label="Profiles Complete"
          value={complete}
          sub={`${complete === 1 ? 'profile' : 'profiles'} ready`}
          Icon={UserCheck}
          color="#16A34A"
          iconBg="#DCFCE7"
        />
        <SummaryCard
          label="Incomplete"
          value={incomplete}
          sub="missing details"
          Icon={UserX}
          color={incomplete > 0 ? '#D97706' : '#15161A'}
          iconBg="#FEF3C7"
        />
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 0, overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '20px 24px 16px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#15161A', margin: 0, letterSpacing: '-0.01em' }}>
            All Employees
          </h3>
        </div>

        {!loading && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Users size={40} style={{ color: 'rgba(21,22,26,0.15)', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'rgba(21,22,26,0.4)' }}>No employees found</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(21,22,26,0.3)' }}>
              Try adjusting your search
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #E4E3DC' }}>
                {['Name', 'Role', 'Department', 'Designation', 'Join Date', 'Profile', ''].map((h, i) => (
                  <th key={i} style={{
                    textAlign: 'left',
                    padding: '11px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'rgba(21,22,26,0.4)',
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : (
                filtered.map((u, i) => {
                  const isLast = i === filtered.length - 1;
                  const cellBase = { padding: '14px 16px', fontSize: 14, color: '#15161A', verticalAlign: 'middle' };
                  const rStyle = ROLE_STYLES[u.role] || DEFAULT_ROLE;
                  const join = formatDate(u.employee?.joinDate);

                  return (
                    <tr key={u.id} className="em-row" style={{ borderBottom: isLast ? 'none' : '1px solid #E4E3DC' }}>
                      {/* Name + email + avatar */}
                      <td style={cellBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#C8203D', color: '#fff',
                            fontSize: 13, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {initials(u.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#15161A' }}>{u.name}</div>
                            <div style={{ fontSize: 13, color: 'rgba(21,22,26,0.45)', fontWeight: 400 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role pill */}
                      <td style={cellBase}>
                        {u.role && (
                          <span style={{
                            background: rStyle.bg,
                            color: rStyle.color,
                            borderRadius: 100,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      {/* Department */}
                      <td style={cellBase}>
                        {u.employee?.department
                          ? <span style={{ fontSize: 13, color: 'rgba(21,22,26,0.6)' }}>{u.employee.department}</span>
                          : <span style={{ fontSize: 13, color: 'rgba(21,22,26,0.25)' }}>—</span>}
                      </td>

                      {/* Designation */}
                      <td style={cellBase}>
                        {u.employee?.designation
                          ? <span style={{ fontSize: 13, color: '#15161A' }}>{u.employee.designation}</span>
                          : <span style={{ fontSize: 13, color: 'rgba(21,22,26,0.25)' }}>—</span>}
                      </td>

                      {/* Join Date */}
                      <td style={cellBase}>
                        {join
                          ? <span style={{ fontSize: 13, color: 'rgba(21,22,26,0.6)' }}>{join}</span>
                          : <span style={{ fontSize: 13, color: 'rgba(21,22,26,0.25)' }}>—</span>}
                      </td>

                      {/* Profile status */}
                      <td style={cellBase}>
                        {u.employee ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#DCFCE7', color: '#16A34A',
                            borderRadius: 100, padding: '4px 12px',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            <CheckCircle size={11} /> Complete
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#FEF3C7', color: '#D97706',
                            borderRadius: 100, padding: '4px 12px',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            <AlertCircle size={11} /> Incomplete
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={cellBase}>
                        <button className="em-action" onClick={() => navigate(`/employees/${u.id}`)}>
                          <UserPlus size={14} /> View / Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
