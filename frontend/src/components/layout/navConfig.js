import {
  LayoutDashboard,
  BarChart2,
  BarChart3,
  CalendarDays,
  Calendar,
  Users2,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';

// Single master nav list. The sidebar / bottom nav render every item the user
// has permission for (via hasPermission), regardless of their resolved role —
// so a permission granted by an assigned role always surfaces its nav item.
export const MASTER_NAV = [
  {
    section: 'PERSONAL',
    items: [
      { icon: LayoutDashboard, label: 'My Dashboard',     path: '/dashboard', permission: 'dashboard' },
      { icon: BarChart2,       label: 'My Performance',   path: '/performance', permission: 'performance_evaluation' },
      { icon: CalendarDays,    label: 'My Leave',         path: '/leave', permission: 'leave_management' },
      { icon: Calendar,        label: 'Company Calendar', path: '/calendar', permission: 'company_calendar' },
    ],
  },
  {
    section: 'HR ADMIN',
    items: [
      { icon: Users2,        label: 'Employee Management', path: '/employees', permission: 'employee_management' },
      { icon: ClipboardList, label: 'Leave Overview',      path: '/leave-overview', permission: 'leave_overview' },
      { icon: ShieldCheck,   label: 'Role Management',      path: '/role-management', permission: 'role_management' },
    ],
  },
  {
    section: 'TEAMS',
    items: [
      { icon: Users2,       label: 'Team Performance', path: '/team', permission: 'team_performance' },
      { icon: CheckSquare,  label: 'Leave Approvals',  path: '/leave-approvals', permission: 'team_performance' },
    ],
  },
];
