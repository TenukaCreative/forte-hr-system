import { useState } from 'react';
import Shell from '../../components/layout/Shell';
import { Tabs } from '../../components/ui';
import {
  ApprovalsView,
  RequestsTable,
  TeamLeaveView,
  PlansTable,
} from '../../components/leave/LeaveOverviewShared';

// Senior / Manager leave dashboard — reached via the team_performance-gated
// route. Everything here is scoped to the manager's direct reports.
const TABS = [
  { key: 'team-approvals', label: 'Team Approvals' },
  { key: 'team-requests', label: 'Team Requests' },
  { key: 'team-leave', label: 'Team Leave' },
  { key: 'team-plan', label: 'Team Plan' },
];

export default function LeaveApprovals() {
  const [tab, setTab] = useState(TABS[0].key);

  return (
    <Shell>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15161A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Leave Approvals
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(21,22,26,0.5)', margin: 0 }}>
          Review and manage your team's leave
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'team-approvals' && <ApprovalsView kind="team" />}
      {tab === 'team-requests' && <RequestsTable endpoint="/leaves/team" badgeLabel="Team" />}
      {tab === 'team-leave' && <TeamLeaveView scope="team" />}
      {tab === 'team-plan' && <PlansTable endpoint="/leave-plans/team" />}
    </Shell>
  );
}
