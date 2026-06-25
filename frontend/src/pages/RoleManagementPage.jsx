import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Lock, Plus, Pencil, Trash2 } from 'lucide-react';
import Shell from '../components/layout/Shell';
import { C, card, fieldLabel, inputStyle } from '../components/theme';
import { Spinner, EmptyState, Button } from '../components/ui';
import api from '../api/axios';

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'leave_management', label: 'My Leave' },
  { key: 'leave_overview', label: 'Leave Overview (Admin)' },
  { key: 'employee_management', label: 'Employee Management' },
  { key: 'team_performance', label: 'Team Performance' },
  { key: 'performance_evaluation', label: 'Performance Evaluation' },
  { key: 'company_calendar', label: 'Company Calendar' },
  { key: 'role_management', label: 'Role Management' },
  { key: 'manage_holidays', label: 'Manage Public Holidays' },
];

const permLabel = (key) =>
  AVAILABLE_PERMISSIONS.find((p) => p.key === key)?.label || key;

// Roles come back from the API with permissions as [{ permissionKey }].
const permKeys = (role) => (role?.permissions || []).map((p) => p.permissionKey);

const systemPill = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: '#F1F0EB', color: C.muted, borderRadius: 100,
  padding: '3px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState(null); // null = loading
  const [error, setError] = useState(false);

  // Editor state. mode: null | 'create' | 'edit' | 'view'
  const [mode, setMode] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadRoles = () => {
    setRoles(null);
    setError(false);
    api.get('/roles')
      .then((r) => setRoles(r.data || []))
      .catch(() => { setError(true); setRoles([]); });
  };

  useEffect(() => { loadRoles(); }, []);

  const resetEditor = () => {
    setMode(null);
    setActiveId(null);
    setName('');
    setDescription('');
    setSelectedPerms([]);
  };

  const startCreate = () => {
    setMode('create');
    setActiveId(null);
    setName('');
    setDescription('');
    setSelectedPerms([]);
  };

  const openRole = (role) => {
    setActiveId(role.id);
    setName(role.name || '');
    setDescription(role.description || '');
    setSelectedPerms(permKeys(role));
    setMode(role.isSystem ? 'view' : 'edit');
  };

  const togglePerm = (key) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const save = async () => {
    if (!name.trim()) return toast.error('Role name is required');
    if (selectedPerms.length === 0) return toast.error('Select at least one permission');
    setSaving(true);
    try {
      const body = { name: name.trim(), description: description.trim(), permissions: selectedPerms };
      if (mode === 'create') {
        await api.post('/roles', body);
        toast.success('Role created');
      } else {
        await api.patch(`/roles/${activeId}`, body);
        toast.success('Role updated');
      }
      resetEditor();
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role) => {
    if (!confirm(`Delete the role "${role.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Role deleted');
      if (activeId === role.id) resetEditor();
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <Shell>
      <style>{`
        .role-mgmt-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .role-mgmt-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Role Management
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          Create roles and control which areas each role can access
        </p>
      </div>

      <div className="role-mgmt-grid">
        {/* LEFT — Role list */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: 0 }}>Roles</h3>
            <Button onClick={startCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={15} /> Create New Role
            </Button>
          </div>

          {roles === null ? (
            <Spinner />
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: C.red }}>Failed to load roles.</p>
              <Button variant="outline" onClick={loadRoles}>Retry</Button>
            </div>
          ) : roles.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No roles yet" subtitle="Create your first role to get started." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roles.map((role) => {
                const count = permKeys(role).length;
                const isActive = activeId === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => openRole(role)}
                    style={{
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1px solid ${isActive ? C.accent : C.border}`,
                      background: isActive ? 'rgba(200,32,61,0.03)' : '#FAFAF7',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{role.name}</span>
                          {role.isSystem && (
                            <span style={systemPill}><Lock size={11} /> System</span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                          {count} permission{count !== 1 ? 's' : ''}
                          {role.description ? ` · ${role.description}` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          title={role.isSystem ? 'System roles cannot be edited' : 'Edit role'}
                          disabled={role.isSystem}
                          onClick={(e) => { e.stopPropagation(); openRole(role); }}
                          style={iconBtn(role.isSystem)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title={role.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                          disabled={role.isSystem}
                          onClick={(e) => { e.stopPropagation(); remove(role); }}
                          style={iconBtn(role.isSystem, true)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Editor / read-only view */}
        <div style={card}>
          {mode === null ? (
            <EmptyState
              icon={ShieldCheck}
              title="No role selected"
              subtitle="Select a role to view it, or create a new one."
            />
          ) : mode === 'view' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={16} style={{ color: C.muted }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: 0 }}>{name}</h3>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 18px' }}>
                {description || 'System role'} · read-only
              </p>
              <p style={fieldLabel}>Permissions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AVAILABLE_PERMISSIONS.map((p) => {
                  const on = selectedPerms.includes(p.key);
                  return (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: on ? C.dark : C.faint }}>
                      <input type="checkbox" checked={on} disabled readOnly />
                      <span>{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: C.dark, margin: '0 0 18px' }}>
                {mode === 'create' ? 'Create New Role' : 'Edit Role'}
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>Role Name</label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Team Lead"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>Description (optional)</label>
                <input
                  style={inputStyle}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this role"
                />
              </div>

              <p style={fieldLabel}>Permissions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {AVAILABLE_PERMISSIONS.map((p) => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.dark, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(p.key)}
                      onChange={() => togglePerm(p.key)}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={save} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : (mode === 'create' ? 'Create Role' : 'Save Changes')}
                </Button>
                <Button variant="ghost" onClick={resetEditor} disabled={saving}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function iconBtn(disabled, danger = false) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8, background: '#fff',
    border: `1px solid ${C.border}`,
    color: disabled ? 'rgba(21,22,26,0.25)' : (danger ? C.red : C.muted),
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  };
}
