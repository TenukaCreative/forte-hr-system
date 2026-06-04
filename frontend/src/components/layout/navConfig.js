import {
  LayoutDashboard,
  BarChart2,
  CalendarDays,
  Calendar,
  Users2,
  ClipboardList,
  CheckSquare,
  Settings,
} from 'lucide-react';

export const NAV = {
  HR_MANAGER: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
    {
      section: 'HR ADMIN',
      items: [
        { icon: Users2,       label: 'Employee Management', path: '/employees' },
        { icon: ClipboardList, label: 'Leave Overview',     path: '/leave-overview' },
      ],
    },
  ],
  HEAD_OF_PMO: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
    {
      section: 'PMO',
      items: [
        { icon: Users2,       label: 'Team Performance', path: '/team' },
        { icon: CheckSquare,  label: 'Leave Approvals',  path: '/leave-approvals' },
        { icon: ClipboardList, label: 'KPI Management',  path: '/kpis' },
      ],
    },
  ],
  PM: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
  ],
  BA: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: BarChart2,       label: 'My Performance',   path: '/performance' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
  ],
  IT: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
    {
      section: 'IT ADMIN',
      items: [
        { icon: Settings, label: 'System Users', path: '/system-users' },
      ],
    },
  ],
};
