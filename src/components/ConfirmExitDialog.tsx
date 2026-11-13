import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmExitDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirmExit: () => void;
}

export const ConfirmExitDialog: React.FC<ConfirmExitDialogProps> = ({
  open,
  onCancel,
  onConfirmExit
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const choice = dialog.returnValue;
      dialog.returnValue = '';
      if (choice === 'exit') {
        onConfirmExit();
      } else {
        onCancel();
      }
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onCancel, onConfirmExit]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-none backdrop:bg-slate-900/50"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="text-lg font-extrabold text-slate-900">
          Encerrar escovação?
        </h2>
        <p className="text-sm text-slate-600 mt-1.5">
          Se você sair agora, o progresso desta sessão guiada não será registrado na sua meta de hoje.
        </p>

        <form method="dialog" className="w-full flex flex-col gap-2.5 mt-6">
          <button
            type="submit"
            value="cancel"
            autoFocus
            className="min-h-[48px] w-full rounded-xl bg-teal-600 text-white font-semibold text-sm border border-teal-600 hover:bg-teal-700 active:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            Continuar Escovação
          </button>
          <button
            type="submit"
            value="exit"
            className="min-h-[48px] w-full rounded-xl bg-white text-rose-600 font-semibold text-sm border border-slate-200 hover:bg-rose-50 active:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            Sair sem salvar
          </button>
        </form>
      </div>
    </dialog>
  );
};

