import React from 'react';
import {
  CheckCircle2,
  Clock,
  Lightbulb,
  Play,
  PlusCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Header } from '../components/Header';
import { StreakBanner } from '../components/StreakBanner';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useArkadaStore } from '../hooks/useArkadaStore';

export const Home: React.FC = () => {
  const {
    settings,
    streak,
    todayProgress,
    weekDays,
    currentTip,
    refreshTip,
    navigateTo,
    startBrushingSession,
    toggleBrushingSlotToday
  } = useArkadaStore();

  // Determine the index of the next pending slot
  const nextPendingSlotIndex = settings.scheduledSlots.findIndex(
    (_, index) => !todayProgress.completedSlots.includes(index)
  );

  const allSlotsCompleted = nextPendingSlotIndex === -1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* 1. Header do Arkada (Fixo no Topo) */}
      <Header onOpenSettings={() => navigateTo('settings')} />

      <main className="flex-1 px-4 py-5 space-y-5">
        {/* 2. Card de Sequência (Streak - Estilo Duolingo) */}
        <StreakBanner
          currentStreak={streak.currentStreak}
          bestStreak={streak.bestStreak}
          weekDays={weekDays}
          completedToday={todayProgress.completedCount}
          dailyGoal={settings.dailyGoal}
        />

        {/* 3. Lista de Escovações do Dia + Botão de Destaque */}
        <section aria-labelledby="daily-schedule-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="daily-schedule-heading"
                className="text-base font-extrabold text-slate-900 tracking-tight"
              >
                Escovações de Hoje
              </h2>
              <p className="text-xs text-slate-600">
                Toque na caixa para marcar caso tenha escovado sem o celular
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
              {todayProgress.completedCount}/{settings.dailyGoal} concluídas
            </span>
          </div>

          <Card padding="none" className="overflow-hidden divide-y divide-slate-200">
            {settings.scheduledSlots.map((slot, index) => {
              const isCompleted = todayProgress.completedSlots.includes(index);
              const isNext = !isCompleted && index === nextPendingSlotIndex;
              const checkboxId = `daily-slot-check-${index}`;

              let statusBadge = (
                <button
                  type="button"
                  onClick={() => void toggleBrushingSlotToday(index)}
                  className="min-h-[36px] text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                >
                  Marcar feita
                </button>
              );

              if (isCompleted) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Concluída
                  </span>
                );
              } else if (isNext) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Próxima
                  </span>
                );
              }

              return (
                <div
                  key={`slot-${index}-${slot.time}`}
                  className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                    isCompleted ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <label
                    htmlFor={checkboxId}
                    className="inline-flex items-center gap-3.5 min-h-[44px] cursor-pointer flex-1 select-none"
                  >
                    <input
                      id={checkboxId}
                      name={`slot_completed_${index + 1}`}
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => void toggleBrushingSlotToday(index)}
                      aria-label={`Marcar Escovação ${index + 1} (${slot.time}) como concluída`}
                      className="checkbox-custom shrink-0"
                    />

                    <div>
                      <span
                        className={`block text-sm font-bold ${
                          isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'
                        }`}
                      >
                        Escovação {index + 1} • {slot.time}
                      </span>

                      <span className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {isCompleted
                            ? 'Concluída hoje (toque para desmarcar)'
                            : isNext
                            ? 'Próxima escovação do dia'
                            : 'Toque para marcar como concluída'}
                        </span>
                      </span>

                      {(slot.floss || slot.mouthwash) && (
                        <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {slot.floss && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">
                              + Fio Dental
                            </span>
                          )}
                          {slot.mouthwash && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800">
                              + Enxaguante
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </label>

                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Primary Call-To-Action Button */}
          <div className="pt-1">
            {!allSlotsCompleted ? (
              <Button
                variant="primary"
                fullWidth
                onClick={() => startBrushingSession(nextPendingSlotIndex)}
              >
                <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                <span>
                  Iniciar Escovação {nextPendingSlotIndex + 1} ({settings.scheduledSlots[nextPendingSlotIndex]?.time})
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => startBrushingSession(undefined)}
              >
                <PlusCircle className="w-5 h-5" aria-hidden="true" />
                <span>Iniciar Escovação Extra</span>
              </Button>
            )}
          </div>
        </section>

        {/* 4. Card Informativo Dinâmico (Dicas de Saúde Bucal) */}
        <section aria-labelledby="oral-tip-heading">
          <Card padding="md" className="bg-white border-slate-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-700">
                    Dica de Saúde Bucal • {currentTip.category}
                  </span>
                  <h2 id="oral-tip-heading" className="text-sm font-extrabold text-slate-900">
                    {currentTip.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshTip}
                aria-label="Sortear nova dica de saúde bucal"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 mt-1">
              {currentTip.content}
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};
