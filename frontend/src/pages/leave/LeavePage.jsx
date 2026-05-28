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
      <div className="page-header">
        <div>
          <h1>My Leave</h1>
        </div>
      </div>

      <div className="sub-nav" style={{ marginBottom: 24 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`sub-nav-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <LeaveDashboard />}
      {tab === 'calendar' && (
        <div className="card">
          <LeaveCalendar />
        </div>
      )}
      {tab === 'request'  && <LeaveRequestForm onSubmitted={() => setTab('overview')} />}
    </Shell>
  );
}
