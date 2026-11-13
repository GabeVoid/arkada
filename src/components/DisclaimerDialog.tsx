import React, { useEffect, useId, useRef } from 'react';
import { Check, Code2, ShieldAlert, Stethoscope } from 'lucide-react';

interface DisclaimerDialogProps {
  open: boolean;
  onAccept: () => void;
}

export const DisclaimerDialog: React.FC<DisclaimerDialogProps> = ({
  open,
  onAccept
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

    // Prevent Esc dismissal until the user explicitly acknowledges the notice
    const handleCancel = (e: Event) => {
      e.preventDefault();
    };

    const handleClose = () => {
      dialog.returnValue = '';
      onAccept();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onAccept]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'none' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-none backdrop:bg-slate-900/60"
    >
      <div className="space-y-4">
        {/* Header Badge + Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mb-3">
            <ShieldAlert className="w-7 h-7" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md mb-1.5">
            Aviso Importante de Primeiro Uso
          </span>
          <h2 id={titleId} className="text-xl font-extrabold text-slate-900 tracking-tight">
            Isenção de Responsabilidade Profissional
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Leia atentamente antes de iniciar sua rotina no Arkada
          </p>
        </div>

        {/* Caveat Cards */}
        <div className="space-y-3 text-left bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
              <Code2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">
                Desenvolvido apenas por programadores
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                O <strong>Arkada</strong> é um projeto independente criado exclusivamente por desenvolvedores de software, <strong>sem a consultoria, supervisão ou validação clínica de dentistas ou outros profissionais da saúde</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">
                Apenas um ajudante de rotina (Sem valor médico)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                Este aplicativo funciona unicamente como um organizador de horários, cronômetro e lembrete de hábitos. Os tempos sugeridos e dicas exibidas possuem caráter meramente informativo e <strong>não substituem, em nenhuma hipótese, a consulta, o diagnóstico ou a orientação de um cirurgião-dentista</strong>.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          Caso sinta dor, sangramento gengival frequente ou sensibilidade dentária, suspenda qualquer prática que cause desconforto e procure atendimento odontológico profissional.
        </p>

        <form method="dialog" className="pt-1">
          <button
            type="submit"
            value="accept"
            autoFocus
            className="min-h-[48px] w-full rounded-xl bg-teal-600 text-white font-bold text-sm border border-teal-600 hover:bg-teal-700 active:bg-teal-800 flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <Check className="w-5 h-5" aria-hidden="true" />
            <span>Li, compreendo e quero continuar</span>
          </button>
        </form>
      </div>
    </dialog>
  );
};

