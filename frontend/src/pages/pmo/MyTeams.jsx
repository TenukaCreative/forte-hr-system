import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, UserPlus, X, Users2 } from 'lucide-react';
import api from '../../api/axios';
import { C, card, inputStyle, fieldLabel } from '../../components/theme';
import { Spinner, EmptyState, Button } from '../../components/ui';

const seniorDesignations = (d) => {
  if (!d) return false;
  const lower = d.toLowerCase();
  return lower.startsWith('head of') || lower.endsWith('lead') || d === 'Super Admin';
};

export default function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState(null);   // team detail object
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);           // { id?, name, description } when editing/creating
  const [addUserId, setAddUserId] = useState('');

  const loadTeams = () =>
    api.get('/teams').then((r) => setTeams(r.data || [])).catch(() => toast.error('Failed to load teams'));

  useEffect(() => {
    Promise.all([loadTeams(), api.get('/employees/users').then((r) => setAllUsers(r.data || []))])
      .finally(() => setLoading(false));
  }, []);

  const openTeam = async (id) => {
    try {
      const r = await api.get(`/teams/${id}`);
      setSelected(r.data);
      setAddUserId('');
    } catch {
      toast.error('Failed to open team');
    }
  };

  const saveTeam = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Team name is required');
    try {
      if (form.id) {
        await api.put(`/teams/${form.id}`, { name: form.name, description: form.description });
        toast.success('Team updated');
        if (selected?.id === form.id) openTeam(form.id);
      } else {
        await api.post('/teams', { name: form.name, description: form.description });
        toast.success('Team created');
      }
      setForm(null);
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save team');
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm('Delete this team and all its members?')) return;
    try {
      await api.delete(`/teams/${id}`);
      toast.success('Team deleted');
      if (selected?.id === id) setSelected(null);
      loadTeams();
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const addMember = async () => {
    if (!addUserId) return;
    try {
      const r = await api.post(`/teams/${selected.id}/members`, { userId: addUserId });
      setSelected({ ...selected, members: r.data });
      setAddUserId('');
      toast.success('Member added');
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/teams/${selected.id}/members/${userId}`);
      setSelected({ ...selected, members: selected.members.filter((m) => m.id !== userId) });
      toast.success('Member removed');
      loadTeams();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  if (loading) return <Spinner />;

  const memberIds = new Set((selected?.members || []).map((m) => m.id));
  const candidates = allUsers.filter((u) => !seniorDesignations(u.designation) && !memberIds.has(u.id));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }} className="mt-grid">
      {/* Left — team list */}
      <div>
        <Button style={{ width: '100%', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => setForm({ name: '', description: '' })}>
          <Plus size={16} /> Create Team
        </Button>

        {form && (
          <form onSubmit={saveTeam} style={{ ...card, marginBottom: 16, padding: 18 }}>
            <label style={fieldLabel}>Team Name</label>
            <input style={{ ...inputStyle, marginBottom: 12 }} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Digital Projects" autoFocus />
            <label style={fieldLabel}>Description</label>
            <textarea style={{ ...inputStyle, marginBottom: 14, minHeight: 64, resize: 'vertical' }} value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" style={{ flex: 1 }}>{form.id ? 'Save' : 'Create'}</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        )}

        {teams.length === 0 && !form ? (
          <div style={card}><EmptyState icon={Users2} title="No teams yet" subtitle="Create your first team" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {teams.map((t) => (
              <div key={t.id} onClick={() => openTeam(t.id)}
                style={{ ...card, padding: 16, cursor: 'pointer', border: selected?.id === t.id ? `1.5px solid ${C.accent}` : '1.5px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.dark }}>{t.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{t.memberCount} member{t.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button title="Edit" onClick={(e) => { e.stopPropagation(); setForm({ id: t.id, name: t.name, description: t.description || '' }); }}
                      style={iconBtn}><Pencil size={15} /></button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); deleteTeam(t.id); }}
                      style={{ ...iconBtn, color: C.red }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — team detail */}
      <div style={card}>
        {!selected ? (
          <EmptyState icon={Users2} title="Select a team" subtitle="Choose a team on the left to view and manage its members" />
        ) : (
          <>
            <h3 style={{ fontSize: 19, fontWeight: 600, color: C.dark, margin: '0 0 4px', letterSpacing: '-0.01em' }}>{selected.name}</h3>
            {selected.description && <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px' }}>{selected.description}</p>}

            <p style={fieldLabel}>Members ({selected.members.length})</p>
            {selected.members.length === 0 ? (
              <p style={{ fontSize: 14, color: C.faint, margin: '0 0 18px' }}>No members yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {selected.members.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FAFAF7', borderRadius: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      {m.name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark }}>{m.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{m.designation ?? ''}</p>
                    </div>
                    <button title="Remove" onClick={() => removeMember(m.id)} style={{ ...iconBtn, color: C.red }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}

            <p style={fieldLabel}>Add Member</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <select style={{ ...inputStyle, flex: 1 }} value={addUserId} onChange={(e) => setAddUserId(e.target.value)}>
                <option value="">Select a user…</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.designation ?? ''}</option>
                ))}
              </select>
              <Button onClick={addMember} disabled={!addUserId} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: addUserId ? 1 : 0.5 }}>
                <UserPlus size={16} /> Add
              </Button>
            </div>
          </>
        )}
      </div>

      <style>{`@media(max-width:860px){.mt-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

const iconBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6,
  color: 'rgba(21,22,26,0.5)', display: 'flex', alignItems: 'center',
};
