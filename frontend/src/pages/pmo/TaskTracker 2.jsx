import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { C, card, formatDate, isOverdue } from '../../components/theme';
import { Spinner, EmptyState, Badge } from '../../components/ui';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function TaskTracker() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/kpis/my-team')
      .then((r) => {
        const flat = [];
        (r.data || []).forEach((kpi) => {
          (kpi.tasks || []).forEach((t) => {
            flat.push({
              id: t.id,
              title: t.title,
              employee: kpi.Employee?.User?.name || '—',
              kpiTitle: kpi.title,
              deadline: t.deadline,
              status: t.status,
              completedAt: t.completedAt,
              earnedScore: t.earnedScore,
              overdue: isOverdue(t.deadline, t.status),
            });
          });
        });
        setRows(flat);
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const filtered = rows.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'pending') return r.status === 'PENDING' && !r.overdue;
    if (filter === 'completed') return r.status === 'COMPLETED';
    if (filter === 'overdue') return r.overdue;
    return true;
  });

  return (
    <div>
      {/* Filter + search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, gap: 2 }}>
          <style>{`.tt-f{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:rgba(21,22,26,0.5);font-family:inherit}.tt-f.active{background:#C8203D;color:#fff}`}</style>
          {FILTERS.map((f) => (
            <button key={f.key} className={`tt-f${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.faint }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
            style={{ padding: '9px 12px 9px 34px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: 220, background: '#fff' }} />
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks found" subtitle="Try a different filter or search term" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  {['Task', 'Employee', 'KPI', 'Deadline', 'Status', 'Completed', 'Score'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.faint, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const rowBg = r.overdue ? 'rgba(220,38,38,0.04)' : 'transparent';
                  const deadlineColor = r.overdue ? C.red : r.status === 'COMPLETED' ? C.green : C.dark;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E4E3DC', background: rowBg }}>
                      <td style={{ padding: '13px 16px', color: C.dark, fontWeight: 500 }}>{r.title}</td>
                      <td style={{ padding: '13px 16px', color: C.muted }}>{r.employee}</td>
                      <td style={{ padding: '13px 16px', color: C.muted }}>{r.kpiTitle}</td>
                      <td style={{ padding: '13px 16px', color: deadlineColor, fontWeight: r.overdue ? 600 : 400 }}>{r.deadline ? formatDate(r.deadline) : '—'}</td>
                      <td style={{ padding: '13px 16px' }}><Badge status={r.overdue ? 'OVERDUE' : r.status} /></td>
                      <td style={{ padding: '13px 16px', color: C.muted }}>{r.completedAt ? formatDate(r.completedAt) : '—'}</td>
                      <td style={{ padding: '13px 16px', color: C.dark }}>{r.earnedScore != null ? r.earnedScore : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
