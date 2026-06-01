import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, ChevronDown, ChevronRight, Target, ListPlus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { C, card, inputStyle, fieldLabel, formatDate } from '../../components/theme';
import { Spinner, EmptyState, Button, Badge } from '../../components/ui';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const currentYear = new Date().getFullYear();

export default function KpiAssign() {
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);   // selected user object
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [kpiForm, setKpiForm] = useState(null);
  const [expanded, setExpanded] = useState({});      // kpiId -> bool
  const [taskForm, setTaskForm] = useState(null);    // { kpiId, title, description, deadline }

  const loadKpis = () => api.get('/kpis/my-team').then((r) => setKpis(r.data || []));

  useEffect(() => {
    Promise.all([api.get('/employees').then((r) => setUsers(r.data || [])), loadKpis()])
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const candidates = users.filter((u) => u.role !== 'HEAD_OF_PMO');
  const memberKpis = selected ? kpis.filter((k) => k.Employee?.User?.id === selected.id) : [];

  const startAssign = () => {
    setKpiForm({ title: '', description: '', quarter: 'Q1', year: currentYear, targetScore: 100 });
    setShowKpiForm(true);
  };

  const submitKpi = async (e) => {
    e.preventDefault();
    if (!selected?.employee?.id) return toast.error('This user has no employee record. Ask HR to create one first.');
    if (!kpiForm.title.trim()) return toast.error('Title is required');
    try {
      await api.post('/kpis', { employeeId: selected.employee.id, ...kpiForm });
      toast.success('KPI assigned');
      setShowKpiForm(false);
      loadKpis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign KPI');
    }
  };

  const deleteKpi = async (id) => {
    if (!window.confirm('Delete this KPI and all its tasks?')) return;
    try {
      await api.delete(`/kpis/${id}`);
      toast.success('KPI deleted');
      loadKpis();
    } catch {
      toast.error('Failed to delete KPI');
    }
  };

  const submitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    try {
      await api.post('/tasks', { kpiId: taskForm.kpiId, title: taskForm.title, description: taskForm.description, deadline: taskForm.deadline || null });
      toast.success('Task added');
      setTaskForm(null);
      loadKpis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }} className="ka-grid">
      {/* Left — member selector */}
      <div style={{ ...card, padding: 12 }}>
        <p style={{ ...fieldLabel, padding: '4px 8px 8px' }}>Team Members</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {candidates.map((u) => (
            <button key={u.id} onClick={() => { setSelected(u); setShowKpiForm(false); }}
              style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: selected?.id === u.id ? '#FAEAED' : 'transparent' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: selected?.id === u.id ? C.accent : C.dark }}>{u.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{u.role?.replace(/_/g, ' ')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right — member KPIs */}
      <div>
        {!selected ? (
          <div style={card}><EmptyState icon={Target} title="Select a member" subtitle="Pick someone on the left to view and assign KPIs" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: 0 }}>{selected.name}</h3>
                <p style={{ fontSize: 13, color: C.muted, margin: '2px 0 0' }}>{selected.role?.replace(/_/g, ' ')}</p>
              </div>
              <Button onClick={startAssign} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Assign New KPI</Button>
            </div>

            {showKpiForm && (
              <form onSubmit={submitKpi} style={{ ...card, marginBottom: 16 }}>
                <label style={fieldLabel}>Title</label>
                <input style={{ ...inputStyle, marginBottom: 12 }} value={kpiForm.title} autoFocus
                  onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Deliver Q1 client portal" />
                <label style={fieldLabel}>Description</label>
                <textarea style={{ ...inputStyle, marginBottom: 12, minHeight: 56, resize: 'vertical' }} value={kpiForm.description}
                  onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })} placeholder="Optional" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={fieldLabel}>Quarter</label>
                    <select style={inputStyle} value={kpiForm.quarter} onChange={(e) => setKpiForm({ ...kpiForm, quarter: e.target.value })}>
                      {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabel}>Year</label>
                    <input type="number" style={inputStyle} value={kpiForm.year} onChange={(e) => setKpiForm({ ...kpiForm, year: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Target Score</label>
                    <input type="number" style={inputStyle} value={kpiForm.targetScore} onChange={(e) => setKpiForm({ ...kpiForm, targetScore: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="submit">Assign KPI</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowKpiForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {memberKpis.length === 0 && !showKpiForm ? (
              <div style={card}><EmptyState icon={Target} title="No KPIs yet" subtitle="Assign a KPI to start tracking this member" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {memberKpis.map((kpi) => {
                  const tasks = kpi.tasks || [];
                  const done = tasks.filter((t) => t.status === 'COMPLETED').length;
                  const open = expanded[kpi.id];
                  return (
                    <div key={kpi.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{kpi.title}</span>
                            <Badge status={kpi.status} />
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>
                            {kpi.quarter} {kpi.year} · Target {kpi.targetScore} · {tasks.length} task{tasks.length !== 1 ? 's' : ''} ({done} done)
                          </p>
                        </div>
                        <button onClick={() => deleteKpi(kpi.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.red, padding: 4 }} title="Delete KPI"><Trash2 size={16} /></button>
                      </div>

                      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                        <button onClick={() => setExpanded({ ...expanded, [kpi.id]: !open })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>
                          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} {open ? 'Hide' : 'Show'} tasks
                        </button>
                        <button onClick={() => setTaskForm({ kpiId: kpi.id, title: '', description: '', deadline: '' })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}>
                          <ListPlus size={15} /> Add Task
                        </button>
                      </div>

                      {taskForm?.kpiId === kpi.id && (
                        <form onSubmit={submitTask} style={{ marginTop: 12, padding: 14, background: '#FAFAF7', borderRadius: 8 }}>
                          <input style={{ ...inputStyle, marginBottom: 10 }} value={taskForm.title} autoFocus
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
                          <textarea style={{ ...inputStyle, marginBottom: 10, minHeight: 48, resize: 'vertical' }} value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Description (optional)" />
                          <label style={fieldLabel}>Deadline</label>
                          <input type="date" style={{ ...inputStyle, marginBottom: 12 }} value={taskForm.deadline}
                            onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button type="submit">Add Task</Button>
                            <Button type="button" variant="ghost" onClick={() => setTaskForm(null)}>Cancel</Button>
                          </div>
                        </form>
                      )}

                      {open && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {tasks.length === 0 ? (
                            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>No tasks under this KPI yet.</p>
                          ) : tasks.map((t) => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{t.title}</span>
                                {t.deadline && <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>· due {formatDate(t.deadline)}</span>}
                              </div>
                              <Badge status={t.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@media(max-width:860px){.ka-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
