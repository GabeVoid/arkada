import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 text-white border border-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600',
  secondary:
    'bg-sky-600 text-white border border-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600',
  outline:
    'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:bg-slate-200 disabled:text-slate-300',
  danger:
    'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`min-h-[48px] px-5 py-3 rounded-xl font-semibold text-base transition-colors duration-150 shadow-none flex items-center justify-center gap-2 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
