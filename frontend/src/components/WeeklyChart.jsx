import { C, startOfWeek, sameDay, isOverdue } from './theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// SVG bar chart of this week's activity.
// Per day: green bar = tasks completed that day, red bar = tasks that became
// overdue that day (deadline that day, still pending and past).
export default function WeeklyChart({ tasks = [], height = 160 }) {
  const weekStart = startOfWeek();
  const days = DAYS.map((label, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const completed = tasks.filter((t) => t.completedAt && sameDay(t.completedAt, day)).length;
    const overdue = tasks.filter((t) => isOverdue(t.deadline, t.status) && sameDay(t.deadline, day)).length;
    return { label, completed, overdue };
  });

  const max = Math.max(1, ...days.map((d) => Math.max(d.completed, d.overdue)));
  const chartH = height - 34;       // leave room for labels + counts
  const barW = 13;
  const groupGap = 36;
  const groupW = barW * 2 + 6;
  const width = days.length * (groupW + groupGap) - groupGap + 20;

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMid meet" style={{ minWidth: 380 }}>
          {days.map((d, i) => {
            const x = 10 + i * (groupW + groupGap);
            const cH = (d.completed / max) * chartH;
            const oH = (d.overdue / max) * chartH;
            const baseY = chartH + 6;
            return (
              <g key={d.label}>
                {d.completed > 0 && <text x={x + barW / 2} y={baseY - cH - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={C.green}>{d.completed}</text>}
                <rect x={x} y={baseY - cH} width={barW} height={cH} rx={3} fill={C.green} />
                {d.overdue > 0 && <text x={x + barW + 6 + barW / 2} y={baseY - oH - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={C.red}>{d.overdue}</text>}
                <rect x={x + barW + 6} y={baseY - oH} width={barW} height={oH} rx={3} fill={C.red} />
                <text x={x + groupW / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="rgba(21,22,26,0.5)">{d.label}</text>
              </g>
            );
          })}
          <line x1={6} y1={chartH + 6} x2={width - 6} y2={chartH + 6} stroke="#E4E3DC" strokeWidth="1" />
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 6 }}>
        <Legend color={C.green} label="Completed" />
        <Legend color={C.red} label="Became overdue" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(21,22,26,0.55)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} /> {label}
    </span>
  );
}
