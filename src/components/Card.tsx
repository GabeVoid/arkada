import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: 'p-0',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6'
};

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-none ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

