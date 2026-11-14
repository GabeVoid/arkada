import React, { useId } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  name?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  id: providedId,
  name
}) => {
  const generatedId = useId();
  const inputId = providedId ?? `switch-${generatedId}`;
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1">
        <label
          htmlFor={inputId}
          className="text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer block"
        >
          {label}
        </label>
        {description && (
          <p id={descId} className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>

      <input
        id={inputId}
        name={name ?? inputId}
        type="checkbox"
        {...({ switch: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        checked={checked}
        aria-describedby={descId}
        onChange={(e) => onChange(e.target.checked)}
        className="arkada-switch shrink-0"
      />
    </div>
  );
};
