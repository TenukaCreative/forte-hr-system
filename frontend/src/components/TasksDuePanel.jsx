import { useState } from 'react';
import { C, formatDate, isOverdue, isToday, isThisWeek } from './theme';

// Reusable list of upcoming/overdue tasks with filter tabs.
// `tabs` is a subset of ['overdue','today','week','all'].
// `onComplete(taskId)` enables the Mark Complete button on PENDING rows.
const TAB_LABELS = { overdue: 'Overdue', today: 'Due Today', week: 'This Week', all: 'All' };
const EMPTY = {
  overdue: 'No overdue tasks 🎉',
  today: 'Nothing due today',
  week: 'No tasks this week',
  all: 'No tasks yet',
};

const matches = (t, tab) => {
  if (tab === 'overdue') return isOverdue(t.deadline, t.status);
  if (tab === 'today') return t.status === 'PENDING' && isToday(t.deadline);
  if (tab === 'week') return t.status === 'PENDING' && isThisWeek(t.deadline);
  return true; // all
};

const dotColor = (t) => {
  if (isOverdue(t.deadline, t.status)) return C.red;
  if (isToday(t.deadline) && t.status === 'PENDING') return C.amber;
  return '#C7C5BD';
};

export default function TasksDuePanel({ tasks = [], tabs = ['overdue', 'today', 'week'], onComplete }) {
  const [tab, setTab] = useState(tabs[0]);

  const sorted = [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  const visible = sorted.filter((t) => matches(t, tab));

  return (
    <div>
      <div style={{ display: 'inline-flex', background: '#FAFAF7', borderRadius: 9, padding: 3, gap: 2, marginBottom: 14 }}>
        <style>{`.td-tab{padding:6px 14px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:rgba(21,22,26,0.5);font-family:inherit}.td-tab.active{background:#fff;color:#C8203D;box-shadow:0 1px 3px rgba(0,0,0,0.08)}`}</style>
        {tabs.map((k) => (
          <button key={k} className={`td-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{TAB_LABELS[k]}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '24px 0', color: C.faint, fontSize: 14, margin: 0 }}>{EMPTY[tab]}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map((t, i) => {
            const overdue = isOverdue(t.deadline, t.status);
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: i < visible.length - 1 ? '1px solid #E4E3DC' : 'none' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor(t), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.5)' }}>{t.KPI?.title || ''}</p>
                </div>
                <span style={{ fontSize: 13, color: overdue ? C.red : C.muted, fontWeight: overdue ? 600 : 400, flexShrink: 0 }}>
                  {t.deadline ? formatDate(t.deadline) : 'No date'}
                </span>
                {onComplete && t.status === 'PENDING' && (
                  <button onClick={() => onComplete(t.id)}
                    style={{ flexShrink: 0, padding: '6px 12px', border: `1.5px solid ${C.accent}`, borderRadius: 7, background: '#fff', color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Mark Complete
                  </button>
                )}
                {t.status === 'COMPLETED' && (
                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: C.green }}>Done</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
