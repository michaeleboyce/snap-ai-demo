'use client';

import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon?: LucideIcon;
  variant?: 'success' | 'info' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-green-50 border-green-200 text-green-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  neutral: 'bg-gray-50 border-gray-200 text-gray-900',
};

export default function InfoCard({ 
  title, 
  icon: Icon, 
  variant = 'neutral', 
  children, 
  className = '' 
}: InfoCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]} ${className}`}>
      <h3 className={`font-semibold mb-3 flex items-center gap-2`}>
        {Icon && <Icon className="w-5 h-5" />}
        {title}
      </h3>
      {children}
    </div>
  );
}