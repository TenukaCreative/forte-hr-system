import { useState } from 'react';
import Shell from '../../components/layout/Shell';
import LeaveDashboard from './LeaveDashboard';
import LeaveCalendar from './LeaveCalendar';
import LeaveRequestForm from './LeaveRequestForm';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'request',  label: 'Request Leave' },
];

export default function LeavePage() {
  const [tab, setTab] = useState('overview');

  return (
    <Shell>
      <style>{`
        .leave-tab { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.18s; background: transparent; color: rgba(21,22,26,0.5); font-family: inherit; }
        .leave-tab:hover { background: rgba(21,22,26,0.05); }
        .leave-tab.active { background: #C8203D; color: #fff; }
        .leave-tab.active:hover { background: #C8203D; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          My Leave
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
          Manage your leave requests and history
        </p>
      </div>

      <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid #E4E3DC', borderRadius: 10, padding: 4, marginBottom: 24, gap: 2 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`leave-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <LeaveDashboard />}
      {tab === 'calendar' && <LeaveCalendar />}
      {tab === 'request'  && <LeaveRequestForm onSubmitted={() => setTab('overview')} />}
    </Shell>
  );
}
