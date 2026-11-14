import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { ArkadaProvider } from './context/ArkadaContext';
import { useArkadaStore } from './hooks/useArkadaStore';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Session } from './pages/Session';
import { Settings } from './pages/Settings';
import { DisclaimerDialog } from './components/DisclaimerDialog';

const ArkadaAppContent: React.FC = () => {
  const {
    isLoading,
    screen,
    settings,
    toastMessage,
    clearToast,
    acceptDisclaimer
  } = useArkadaStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      clearToast();
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage, clearToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Carregando Arkada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Status Snackbar Banner for Notifications / Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[calc(4.75rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-none"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Bell className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearToast}
            aria-label="Fechar aviso"
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {screen === 'onboarding' && <Onboarding />}
      {screen === 'home' && <Home />}
      {screen === 'session' && <Session />}
      {screen === 'settings' && <Settings />}

      {/* First-Use Professional Responsibility Disclaimer */}
      <DisclaimerDialog
        open={!settings.disclaimerAccepted}
        onAccept={() => void acceptDisclaimer()}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ArkadaProvider>
      <ArkadaAppContent />
    </ArkadaProvider>
  );
};

export default App;
