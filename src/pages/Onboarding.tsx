import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Sparkles } from 'lucide-react';
import arkadaLogo from '../assets/icon.svg';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useArkadaStore } from '../hooks/useArkadaStore';
import { adjustScheduledSlots, DEFAULT_SLOTS_THREE } from '../services/storage';
import { triggerQuadrantHaptic } from '../services/haptics';
import { BrushingSlotConfig } from '../types';

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useArkadaStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [dailyGoal, setDailyGoal] = useState<number>(3);
  const [scheduledSlots, setScheduledSlots] = useState<BrushingSlotConfig[]>(
    DEFAULT_SLOTS_THREE
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSelectCount = (count: number) => {
    void triggerQuadrantHaptic();
    setDailyGoal(count);
    setScheduledSlots((prev) => adjustScheduledSlots(prev, count));
  };

  const handleTimeChange = (index: number, newTime: string) => {
    setScheduledSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], time: newTime };
      return next;
    });
  };

  const handleToggleOption = (index: number, field: 'floss' | 'mouthwash') => {
    void triggerQuadrantHaptic();
    setScheduledSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding(dailyGoal, scheduledSlots);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
      {/* Top Progress Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
            Passo {step} de 2
          </span>
          <span className="text-xs font-semibold text-slate-600">
            Configuração Inicial
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-teal-600 transition-all duration-200"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Brand Hero */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 mb-4">
                <img
                  src={arkadaLogo}
                  alt="Logo do Arkada"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Bem-vindo ao Arkada
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 max-w-xs">
                Crie o hábito de cuidar do seu sorriso todos os dias com sessões guiadas e acompanhamento de sequência.
              </p>
            </div>

            {/* Numeric Selector (1 to 5, default 3) */}
            <Card padding="md">
              <fieldset>
                <legend className="text-sm font-bold text-slate-900 mb-1">
                  Quantas escovações você fará por dia?
                </legend>
                <p className="text-xs text-slate-600 mb-4">
                  Recomendamos pelo menos 3 escovações diárias (manhã, tarde e noite).
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((count) => {
                    const isSelected = dailyGoal === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleSelectCount(count)}
                        aria-pressed={isSelected}
                        className={`min-h-[56px] rounded-xl border font-extrabold text-lg flex flex-col items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{count}x</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Meta diária selecionada:</span>
                  <span className="font-bold text-slate-900">
                    {dailyGoal} {dailyGoal === 1 ? 'escovação por dia' : 'escovações por dia'}
                  </span>
                </div>
              </fieldset>
            </Card>

            <Card padding="sm" className="bg-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    Construa sua sequência diária
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ao concluir 100% da sua meta diária, sua chama de ofensiva aumenta a cada dia consecutivo.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <form id="onboarding-schedule-form" onSubmit={handleStart} className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Horários e Etapas
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Defina o horário e marque se utilizará fio dental ou enxaguante em cada escovação.
              </p>
            </div>

            <Card padding="md" className="space-y-4">
              {scheduledSlots.map((slot, index) => {
                const inputId = `onboarding-time-${index}`;
                return (
                  <div
                    key={inputId}
                    className="space-y-3 pb-4 last:pb-0 border-b last:border-b-0 border-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={inputId}
                        className="flex items-center gap-2.5 text-sm font-bold text-slate-900 cursor-pointer"
                      >
                        <span className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-xs font-extrabold">
                          {index + 1}
                        </span>
                        <div>
                          <span className="block">Escovação {index + 1}</span>
                          <span className="block text-xs font-normal text-slate-600">
                            Lembrete diário
                          </span>
                        </div>
                      </label>

                      <div className="relative flex items-center">
                        <Clock
                          className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          id={inputId}
                          name={`schedule_${index + 1}`}
                          type="time"
                          required
                          value={slot.time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="min-h-[48px] pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-base focus:border-teal-600 focus:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                        />
                      </div>
                    </div>

                    {/* Per-slot Floss & Mouthwash Toggles */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        aria-pressed={slot.floss}
                        onClick={() => handleToggleOption(index, 'floss')}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          slot.floss
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${slot.floss ? 'opacity-100' : 'opacity-30'}`}
                          aria-hidden="true"
                        />
                        <span>Fio Dental</span>
                      </button>

                      <button
                        type="button"
                        aria-pressed={slot.mouthwash}
                        onClick={() => handleToggleOption(index, 'mouthwash')}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          slot.mouthwash
                            ? 'bg-sky-50 border-sky-600 text-sky-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${slot.mouthwash ? 'opacity-100' : 'opacity-30'}`}
                          aria-hidden="true"
                        />
                        <span>Enxaguante</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    Permissão de notificações
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ao tocar em Começar, solicitaremos permissão para agendar seus alertas diários no dispositivo.
                  </p>
                </div>
              </div>
            </Card>
          </form>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-6">
        {step === 1 ? (
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => setStep(2)}
          >
            <span>Continuar</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              aria-label="Voltar para o passo 1"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span>Voltar</span>
            </Button>
            <Button
              type="submit"
              form="onboarding-schedule-form"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>{isSubmitting ? 'Configurando...' : 'Começar'}</span>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};
