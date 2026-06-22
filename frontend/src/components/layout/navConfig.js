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

export const NAV = {
  HR_MANAGER: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard', permission: 'dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance', permission: 'performance_evaluation' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave', permission: 'leave_management' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar', permission: 'company_calendar' },
      ],
    },
    {
      section: 'HR ADMIN',
      items: [
        { icon: Users2,       label: 'Employee Management', path: '/employees', permission: 'employee_management' },
        { icon: ClipboardList, label: 'Leave Overview',     path: '/leave-overview', permission: 'leave_overview' },
        { icon: ShieldCheck,  label: 'Role Management',     path: '/role-management', permission: 'role_management' },
      ],
    },
  ],
  SENIOR: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard', permission: 'dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance', permission: 'performance_evaluation' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave', permission: 'leave_management' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar', permission: 'company_calendar' },
      ],
    },
    {
      section: 'PMO',
      items: [
        { icon: Users2,       label: 'Team Performance', path: '/team', permission: 'team_performance' },
        { icon: CheckSquare,  label: 'Leave Approvals',  path: '/leave-approvals', permission: 'leave_overview' },
      ],
    },
  ],
  PMO_MEMBER: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard', permission: 'dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance', permission: 'performance_evaluation' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave', permission: 'leave_management' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar', permission: 'company_calendar' },
      ],
    },
  ],
  STAFF: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard', permission: 'dashboard' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave', permission: 'leave_management' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar', permission: 'company_calendar' },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'My Dashboard',     path: '/dashboard', permission: 'dashboard' },
        { icon: BarChart3,       label: 'PMO Dashboard',     path: '/pmo-dashboard', permission: 'team_performance' },
        { icon: BarChart2,       label: 'My Performance',    path: '/performance', permission: 'performance_evaluation' },
        { icon: CalendarDays,    label: 'My Leave',          path: '/leave', permission: 'leave_management' },
        { icon: Calendar,        label: 'Company Calendar',  path: '/calendar', permission: 'company_calendar' },
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
      section: 'PMO',
      items: [
        { icon: Users2,        label: 'Team Performance', path: '/team', permission: 'team_performance' },
        { icon: CheckSquare,   label: 'Leave Approvals',  path: '/leave-approvals', permission: 'leave_overview' },
      ],
    },
  ],
};
