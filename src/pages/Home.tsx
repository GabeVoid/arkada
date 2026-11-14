import React from 'react';
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Lightbulb,
  Play,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { Header } from '../components/Header';
import { StreakBanner } from '../components/StreakBanner';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useArkadaStore } from '../hooks/useArkadaStore';
import {
  getDentistReminderStatus,
  getToothbrushReminderStatus
} from '../services/storage';

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
    toggleBrushingSlotToday,
    resetCyclicalReminder
  } = useArkadaStore();

  // Determine the index of the next pending slot
  const nextPendingSlotIndex = settings.scheduledSlots.findIndex(
    (_, index) => !todayProgress.completedSlots.includes(index)
  );

  const allSlotsCompleted = nextPendingSlotIndex === -1;

  const tbStatus = getToothbrushReminderStatus(settings.cyclicalReminders.toothbrush);
  const dentistStatus = getDentistReminderStatus(settings.cyclicalReminders.dentist);
  const hasActiveCyclical = tbStatus.enabled || dentistStatus.enabled;

  const formatCountdownLabel = (days: number): string => {
    if (days < 0) return `Atrasado ${Math.abs(days)}d`;
    if (days === 0) return 'Vence hoje!';
    return `Faltam ${days} dias`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
                className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight"
              >
                Escovações de Hoje
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Toque na caixa para marcar caso tenha escovado sem o celular
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              {todayProgress.completedCount}/{settings.dailyGoal} concluídas
            </span>
          </div>

          <Card padding="none" className="overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
            {settings.scheduledSlots.map((slot, index) => {
              const isCompleted = todayProgress.completedSlots.includes(index);
              const isNext = !isCompleted && index === nextPendingSlotIndex;
              const checkboxId = `daily-slot-check-${index}`;

              let statusBadge = (
                <button
                  type="button"
                  onClick={() => void toggleBrushingSlotToday(index)}
                  className="min-h-[36px] text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-800 dark:hover:text-teal-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                >
                  Marcar feita
                </button>
              );

              if (isCompleted) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Concluída
                  </span>
                );
              } else if (isNext) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Próxima
                  </span>
                );
              }

              return (
                <div
                  key={`slot-${index}-${slot.time}`}
                  className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                    isCompleted
                      ? 'bg-slate-50/70 dark:bg-slate-900/50'
                      : 'bg-white dark:bg-slate-900'
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
                          isCompleted
                            ? 'text-slate-600 dark:text-slate-500 line-through'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        Escovação {index + 1} • {slot.time}
                      </span>

                      <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
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
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                              + Fio Dental
                            </span>
                          )}
                          {slot.mouthwash && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300">
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

        {/* 4. Lembretes Cíclicos (Troca de Escova & Consulta/Limpeza) */}
        {hasActiveCyclical && (
          <section aria-labelledby="cyclical-reminders-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="cyclical-reminders-heading"
                  className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight"
                >
                  Lembretes Cíclicos
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Acompanhe a troca de escova e suas consultas no dentista
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('settings')}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-teal-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Editar
              </button>
            </div>

            <div className="space-y-3">
              {tbStatus.enabled && (
                <Card
                  padding="sm"
                  className={`flex items-center justify-between gap-3 ${
                    tbStatus.isDueOrOverdue
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Troca de Escova Dental
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            tbStatus.isDueOrOverdue
                              ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                              : tbStatus.isDueSoon
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                              : 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                          }`}
                        >
                          {formatCountdownLabel(tbStatus.daysRemaining)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        A cada {settings.cyclicalReminders.toothbrush.intervalDays} dias • Próxima: {tbStatus.nextDueFormatted}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void resetCyclicalReminder('toothbrush')}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {tbStatus.isDueOrOverdue ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    )}
                    <span>Troquei hoje</span>
                  </button>
                </Card>
              )}

              {dentistStatus.enabled && (
                <Card
                  padding="sm"
                  className={`flex items-center justify-between gap-3 ${
                    dentistStatus.isDueOrOverdue
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Consulta e Limpeza
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            dentistStatus.isDueOrOverdue
                              ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                              : dentistStatus.isDueSoon
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                              : 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {formatCountdownLabel(dentistStatus.daysRemaining)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        A cada {settings.cyclicalReminders.dentist.intervalMonths} meses • Próxima: {dentistStatus.nextDueFormatted}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void resetCyclicalReminder('dentist')}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                    <span>Realizei hoje</span>
                  </button>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* 5. Card Informativo Dinâmico (Dicas de Saúde Bucal) */}
        <section aria-labelledby="oral-tip-heading">
          <Card padding="md" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    Dica de Saúde Bucal • {currentTip.category}
                  </span>
                  <h2 id="oral-tip-heading" className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {currentTip.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshTip}
                aria-label="Sortear nova dica de saúde bucal"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mt-1">
              {currentTip.content}
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};
