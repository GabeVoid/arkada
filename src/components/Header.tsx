import React from 'react';
import { Settings } from 'lucide-react';
import arkadaLogo from '../assets/icon.svg';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
          <img
            src={arkadaLogo}
            alt="Logo do Arkada"
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
            Arkada
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            Rotina de Higiene Bucal
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Abrir Configurações"
        className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <Settings className="w-5 h-5" aria-hidden="true" />
      </button>
    </header>
  );
};
