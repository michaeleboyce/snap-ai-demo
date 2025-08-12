'use client';

import { ReactNode } from 'react';

type StatusType = 'in_progress' | 'completed' | 'abandoned' | 'error' | 'approved' | 'denied' | 'needs_info';

interface StatusBadgeProps {
  status: StatusType;
  children?: ReactNode;
}

const statusConfig = {
  in_progress: {
    className: 'bg-gray-100 text-gray-800',
    label: 'In Progress'
  },
  completed: {
    className: 'bg-green-100 text-green-800',
    label: 'Completed'
  },
  abandoned: {
    className: 'bg-red-100 text-red-800',
    label: 'Abandoned'
  },
  error: {
    className: 'bg-blue-100 text-blue-800',
    label: 'Error'
  },
  approved: {
    className: 'bg-green-100 text-green-800',
    label: 'Approved'
  },
  denied: {
    className: 'bg-red-100 text-red-800',
    label: 'Denied'
  },
  needs_info: {
    className: 'bg-amber-100 text-amber-800',
    label: 'Needs Info'
  }
} as const;

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.in_progress;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {children || config.label}
    </span>
  );
}