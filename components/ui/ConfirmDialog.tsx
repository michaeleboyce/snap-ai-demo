'use client';

import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  children?: ReactNode;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
} as const;

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  children
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className={`p-6 ${config.bgColor} ${config.borderColor} border rounded-t-xl`}>
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>
          {children}
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors ${config.confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}