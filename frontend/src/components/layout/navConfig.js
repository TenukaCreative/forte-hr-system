import {
  LayoutDashboard,
  BarChart2,
  BarChart3,
  CalendarDays,
  Calendar,
  Users2,
  ClipboardList,
  CheckSquare,
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
  SENIOR: [
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
      ],
    },
  ],
  PMO_MEMBER: [
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
  STAFF: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
        { icon: CalendarDays,    label: 'My Leave',         path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar', path: '/calendar' },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      section: 'PERSONAL',
      items: [
        { icon: LayoutDashboard, label: 'My Dashboard',     path: '/dashboard' },
        { icon: BarChart3,       label: 'PMO Dashboard',     path: '/pmo-dashboard' },
        { icon: BarChart2,       label: 'My Performance',    path: '/performance' },
        { icon: CalendarDays,    label: 'My Leave',          path: '/leave' },
        { icon: Calendar,        label: 'Company Calendar',  path: '/calendar' },
      ],
    },
    {
      section: 'HR ADMIN',
      items: [
        { icon: Users2,        label: 'Employee Management', path: '/employees' },
        { icon: ClipboardList, label: 'Leave Overview',      path: '/leave-overview' },
      ],
    },
    {
      section: 'PMO',
      items: [
        { icon: Users2,        label: 'Team Performance', path: '/team' },
        { icon: CheckSquare,   label: 'Leave Approvals',  path: '/leave-approvals' },
      ],
    },
  ],
};
