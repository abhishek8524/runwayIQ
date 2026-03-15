import { ReactNode } from 'react';

interface PillProps {
  children: ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

export function Pill({ children, variant = 'default', size = 'sm' }: PillProps) {
  const variants = {
    default: { bg: '#F3F4F6', text: '#374151' },
    danger: { bg: '#FEE2E2', text: '#991B1B' },
    warning: { bg: '#FEF3C7', text: '#D97706' },
    success: { bg: '#D1FAE5', text: '#059669' },
    info: { bg: '#EBF0FF', text: '#1A56DB' },
    purple: { bg: '#EEEDFE', text: '#7F77DD' },
  };
  
  const { bg, text } = variants[variant];
  const fontSize = size === 'sm' ? '7px' : '10px';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  
  return (
    <span
      className={`inline-block ${padding} rounded-full uppercase tracking-wider`}
      style={{ backgroundColor: bg, color: text, fontSize, fontWeight: 600 }}
    >
      {children}
    </span>
  );
}
