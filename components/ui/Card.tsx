'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

const paddingConfig = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
} as const;

const shadowConfig = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
} as const;

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'sm',
  border = true 
}: CardProps) {
  const borderClass = border ? 'border border-gray-200' : '';
  
  return (
    <div className={`bg-white rounded-lg ${borderClass} ${shadowConfig[shadow]} ${paddingConfig[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', border = true }: CardHeaderProps) {
  const borderClass = border ? 'border-b border-gray-200 pb-4 mb-4' : '';
  
  return (
    <div className={`${borderClass} ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', border = true }: CardFooterProps) {
  const borderClass = border ? 'border-t border-gray-200 pt-4 mt-4' : '';
  
  return (
    <div className={`${borderClass} ${className}`}>
      {children}
    </div>
  );
}