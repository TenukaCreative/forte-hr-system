import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Target, Trash2, Users2, Pencil } from 'lucide-react';
import api from '../../api/axios';
import { C, card, inputStyle, fieldLabel, formatDate, isOverdue } from '../../components/theme';
import { Spinner, EmptyState, Button, Badge, KpiDates } from '../../components/ui';
import { RangeDatePicker } from '../../components/DatePicker';

const todayISO = () => new Date().toISOString().split('T')[0];

const initials = (name) => name?.split(' ').map((p) => p[0]).slice(0, 2).join('') || '?';

export default function KpiAssign() {
  const [teams, setTeams] = useState([]);
  const [usersById, setUsersById] = useState({});   // userId -> { employee: { id } }
  const [loading, setLoading] = useState(true);

  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState(null);            // { id, name, members: [...] }
  const [kpis, setKpis] = useState([]);              // KPIs for selected team
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [member, setMember] = useState(null);        // selected member { id (userId), name, role }
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [kpiForm, setKpiForm] = useState(null);
  const [editingKpi, setEditingKpi] = useState(null); // null = create mode, KPI object = edit mode

  // Initial load: teams + user→employee map
  useEffect(() => {
    Promise.all([
      api.get('/teams').then((r) => setTeams(r.data || [])),
      api.get('/employees/users').then((r) => {
        const map = {};
        (r.data || []).forEach((u) => { map[u.id] = u; });
        setUsersById(map);
      }),
    ])
      .catch(() => toast.error('Failed to load teams'))
      .finally(() => setLoading(false));
  }, []);

  const loadTeamKpis = (id) => api.get(`/kpis/team/${id}`).then((r) => setKpis(r.data || []));

  const selectTeam = async (id) => {
    if (id === teamId) return;
    setTeamId(id);
    setMember(null);
    setShowKpiForm(false);
    setLoadingTeam(true);
    try {
      const [t] = await Promise.all([api.get(`/teams/${id}`), loadTeamKpis(id)]);
      setTeam(t.data);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoadingTeam(false);
    }
  };

  if (loading) return <Spinner />;

  const memberKpis = member ? kpis.filter((k) => k.Employee?.User?.id === member.id) : [];

  const startAssign = () => {
    setEditingKpi(null);
    setKpiForm({ title: '', description: '', startDate: '', endDate: '', targetScore: 3 });
    setShowKpiForm(true);
  };

  const startEdit = (kpi) => {
    setEditingKpi(kpi);
    setKpiForm({
      title: kpi.title || '',
      description: kpi.description || '',
      startDate: kpi.startDate || '',
      endDate: kpi.endDate || '',
      targetScore: kpi.targetScore ?? 100,
      status: kpi.status || 'ACTIVE',
    });
    setShowKpiForm(true);
  };

  const cancelForm = () => {
    setShowKpiForm(false);
    setEditingKpi(null);
    setKpiForm(null);
  };

  const submitKpi = async (e) => {
    e.preventDefault();
    if (!kpiForm.title.trim()) return toast.error('Title is required');
    if (!kpiForm.startDate || !kpiForm.endDate) return toast.error('Start date and ETA are required');
    if (kpiForm.endDate < kpiForm.startDate) return toast.error('End date must be after start date');
    try {
      if (editingKpi) {
        await api.put(`/kpis/${editingKpi.id}`, {
          title: kpiForm.title,
          description: kpiForm.description,
          startDate: kpiForm.startDate,
          endDate: kpiForm.endDate,
          targetScore: kpiForm.targetScore,
          status: kpiForm.status,
        });
        toast.success('KPI updated');
      } else {
        const employeeId = usersById[member?.id]?.employee?.id;
        if (!employeeId) return toast.error('This member has no employee record. Ask HR to create one first.');
        await api.post('/kpis', { employeeId, teamId, ...kpiForm });
        toast.success('KPI assigned');
      }
      setShowKpiForm(false);
      setEditingKpi(null);
      loadTeamKpis(teamId);
    } catch (err) {
      toast.error(err.response?.data?.message || (editingKpi ? 'Failed to update KPI' : 'Failed to assign KPI'));
    }
  };

  const deleteKpi = async (id) => {
    if (!window.confirm('Delete this KPI?')) return;
    try {
      await api.delete(`/kpis/${id}`);
      toast.success('KPI deleted');
      loadTeamKpis(teamId);
    } catch {
      toast.error('Failed to delete KPI');
    }
  };

  return (
    <div>
      {/* STEP 1 — Team selector */}
      <div style={{ ...card, marginBottom: 20 }}>
        <p style={{ ...fieldLabel, marginBottom: 12 }}>Select Project / Team</p>
        {teams.length === 0 ? (
          <p style={{ fontSize: 14, color: C.faint, margin: 0 }}>No teams yet — create one in the My Teams tab first.</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {teams.map((t) => {
              const active = t.id === teamId;
              return (
                <button key={t.id} onClick={() => selectTeam(t.id)}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                    padding: '10px 16px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? C.accent : '#fff',
                    border: active ? '1.5px solid transparent' : `1.5px solid ${C.border}`,
                    color: active ? '#fff' : 'rgba(21,22,26,0.6)',
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: 11, opacity: active ? 0.85 : 0.6 }}>{t.memberCount} member{t.memberCount !== 1 ? 's' : ''}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2 + 3 */}
      {!teamId ? (
        <div style={card}><EmptyState icon={Users2} title="Select a team above to view and assign KPIs" /></div>
      ) : loadingTeam ? (
        <Spinner />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }} className="ka-grid">
          {/* Member list */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <p style={{ ...fieldLabel, padding: '16px 16px 10px', margin: 0 }}>Team Members</p>
            {(team?.members || []).length === 0 ? (
              <p style={{ fontSize: 13, color: C.faint, padding: '0 16px 16px', margin: 0 }}>No members in this team yet.</p>
            ) : (
              <div>
                <style>{`.km-row:hover{background:#FAFAF7}`}</style>
                {team.members.map((m) => {
                  const active = member?.id === m.id;
                  return (
                    <button key={m.id} className="km-row" onClick={() => { setMember(m); setShowKpiForm(false); }}
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
                        borderBottom: `1px solid ${C.border}`, borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
                        background: active ? 'rgba(200,32,61,0.06)' : 'transparent', borderTop: 'none', borderRight: 'none',
                      }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                        {initials(m.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.dark }}>{m.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{m.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* KPI panel */}
          <div>
            {!member ? (
              <div style={card}><EmptyState icon={Target} title="Select a member to view their KPIs" /></div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: 0 }}>{member.name}</h3>
                      <span style={{ background: '#F5F4EF', color: 'rgba(21,22,26,0.6)', borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{team.name}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{member.role?.replace(/_/g, ' ')}</p>
                  </div>
                  <Button onClick={startAssign} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Assign New KPI</Button>
                </div>

                {showKpiForm && (
                  <form onSubmit={submitKpi} style={{ ...card, marginBottom: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: C.dark }}>
                      {editingKpi ? 'Edit KPI' : 'Assign New KPI'}
                    </h4>
                    <div style={{ background: '#FAFAF7', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: C.muted }}>
                      {editingKpi ? 'Editing for' : 'Assigning to'}: <strong style={{ color: C.dark }}>{member.name}</strong> · <strong style={{ color: C.dark }}>{team.name}</strong>
                    </div>
                    <label style={fieldLabel}>Title</label>
                    <input style={{ ...inputStyle, marginBottom: 12 }} value={kpiForm.title} autoFocus
                      onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Deliver client portal" />
                    <label style={fieldLabel}>Description</label>
                    <textarea style={{ ...inputStyle, marginBottom: 12, minHeight: 56, resize: 'vertical' }} value={kpiForm.description}
                      onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })} placeholder="Optional" />
                    <div style={{ marginBottom: 14 }}>
                      <label style={fieldLabel}>Start Date &amp; ETA (End Date)</label>
                      <RangeDatePicker
                        startDate={kpiForm.startDate}
                        endDate={kpiForm.endDate}
                        onStartChange={(val) => setKpiForm({ ...kpiForm, startDate: val, endDate: kpiForm.endDate && kpiForm.endDate < val ? '' : kpiForm.endDate })}
                        onEndChange={(val) => setKpiForm({ ...kpiForm, endDate: val })}
                        minDate={editingKpi ? undefined : todayISO()}
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={fieldLabel}>Target Score</label>
                      <select style={inputStyle} value={kpiForm.targetScore} onChange={(e) => setKpiForm({ ...kpiForm, targetScore: Number(e.target.value) })}>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                    </div>
                    {editingKpi && (
                      <div style={{ marginBottom: 14 }}>
                        <label style={fieldLabel}>Status</label>
                        <select style={inputStyle} value={kpiForm.status} onChange={(e) => setKpiForm({ ...kpiForm, status: e.target.value })}>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="submit">{editingKpi ? 'Save Changes' : 'Assign KPI'}</Button>
                      <Button type="button" variant="ghost" onClick={cancelForm}>Cancel</Button>
                    </div>
                  </form>
                )}

                {memberKpis.length === 0 && !showKpiForm ? (
                  <div style={card}><EmptyState icon={Target} title="No KPIs assigned yet" subtitle="Click Assign New KPI to start" /></div>
                ) : (
                  <div>
                    <style>{`.kpi-card{transition:border-color 0.15s}.kpi-card:hover{border-color:#C8203D}`}</style>
                    {memberKpis.map((kpi) => {
                      return (
                        <div key={kpi.id} className="kpi-card" style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{kpi.title}</span>
                                <Badge status={kpi.status} />
                              </div>
                              <div style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <KpiDates startDate={kpi.startDate} endDate={kpi.endDate} />
                                <span style={{ fontSize: 12, color: C.muted }}>
                                  · Target {kpi.targetScore}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                              <button onClick={() => startEdit(kpi)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.amber, padding: 4 }} title="Edit KPI"><Pencil size={16} /></button>
                              <button onClick={() => deleteKpi(kpi.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.red, padding: 4 }} title="Delete KPI"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@media(max-width:860px){.ka-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
