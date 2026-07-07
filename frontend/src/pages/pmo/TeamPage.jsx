import { useState } from 'react';
import Shell from '../../components/layout/Shell';
import { Tabs } from '../../components/ui';
import PmoOverview from './PmoOverview';
import MyTeams from './MyTeams';
import KpiAssign from './KpiAssign';
import KpiFeedback from './KpiFeedback';
import EthicsReviewTab from './EthicsReviewTab';
import PerformanceSettings from '../settings/PerformanceSettings';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'teams', label: 'My Teams' },
  { key: 'kpis', label: 'KPI Assign' },
  { key: 'feedback', label: 'KPI Feedback' },
  { key: 'ethics', label: 'Ethics Review' },
  { key: 'settings', label: 'Settings' },
];

export default function TeamPage() {
  const [tab, setTab] = useState('overview');

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Team Performance
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
          Manage teams, assign KPIs and track your team&apos;s progress
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <PmoOverview />}
      {tab === 'teams' && <MyTeams />}
      {tab === 'kpis' && <KpiAssign />}
      {tab === 'feedback' && <KpiFeedback />}
      {tab === 'ethics' && <EthicsReviewTab />}
      {tab === 'settings' && <PerformanceSettings />}
    </Shell>
  );
}
