import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Home as HomeIcon,
  Info,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CircularTimer, formatMinutesSeconds, QUADRANTS } from '../components/CircularTimer';
import { ConfirmExitDialog } from '../components/ConfirmExitDialog';
import { FlossIllustration } from '../components/StepIllustrations';
import { useArkadaStore } from '../hooks/useArkadaStore';
import { triggerCompletionHaptic, triggerQuadrantHaptic } from '../services/haptics';
import { SessionStep } from '../types';

export const Session: React.FC = () => {
  const {
    settings,
    streak,
    todayProgress,
    activeSessionSlotIndex,
    lastSessionGoalJustMet,
    finishBrushingSession,
    navigateTo
  } = useArkadaStore();

  const totalBrushingSeconds = settings.brushingDuration;
  const totalMouthwashSeconds = settings.mouthwashDuration;

  const activeSlotConfig =
    activeSessionSlotIndex !== undefined
      ? settings.scheduledSlots[activeSessionSlotIndex]
      : undefined;

  const useFloss = activeSlotConfig ? activeSlotConfig.floss : true;
  const useMouthwash = activeSlotConfig
    ? activeSlotConfig.mouthwash
    : settings.mouthwashEnabled;

  const [step, setStep] = useState<SessionStep>(() =>
    useFloss ? 'floss' : 'brush'
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(totalBrushingSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [remainingMouthwashSeconds, setRemainingMouthwashSeconds] =
    useState<number>(totalMouthwashSeconds);
  const [isMouthwashRunning, setIsMouthwashRunning] = useState<boolean>(false);

  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false);

  const previousQuadrantRef = useRef<number>(0);
  const completionSavedRef = useRef<boolean>(false);

  const isTimerFinished = remainingSeconds <= 0;
  const isMouthwashFinished = remainingMouthwashSeconds <= 0;

  const totalZones = QUADRANTS.length;
  const activeQuadrantIndex = useMemo(() => {
    if (remainingSeconds <= 0) return totalZones - 1;
    const elapsed = Math.max(0, totalBrushingSeconds - remainingSeconds);
    const segmentDuration = totalBrushingSeconds / totalZones;
    const index = Math.floor(elapsed / segmentDuration);
    return Math.min(totalZones - 1, Math.max(0, index));
  }, [remainingSeconds, totalBrushingSeconds, totalZones]);

  useEffect(() => {
    if (step === 'brush' && isRunning && activeQuadrantIndex !== previousQuadrantRef.current) {
      previousQuadrantRef.current = activeQuadrantIndex;
      void triggerQuadrantHaptic();
    }
  }, [activeQuadrantIndex, isRunning, step]);

  useEffect(() => {
    if (step !== 'brush' || !isRunning) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          void triggerCompletionHaptic();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [step, isRunning]);

  useEffect(() => {
    if (step !== 'mouthwash' || !isMouthwashRunning) return;

    const intervalId = window.setInterval(() => {
      setRemainingMouthwashSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setIsMouthwashRunning(false);
          void triggerCompletionHaptic();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [step, isMouthwashRunning]);

  const completeAndSaveSession = useCallback(
    async (elapsedDuration: number, usedMouthwashInSession: boolean) => {
      if (!completionSavedRef.current) {
        completionSavedRef.current = true;
        await finishBrushingSession(elapsedDuration, useFloss, usedMouthwashInSession);
        void triggerCompletionHaptic();
      }
      setStep('completed');
    },
    [finishBrushingSession, useFloss]
  );

  const handleAdvanceFromBrush = async () => {
    setIsRunning(false);
    const elapsed = Math.max(1, totalBrushingSeconds - remainingSeconds);
    if (useMouthwash) {
      void triggerQuadrantHaptic();
      setRemainingMouthwashSeconds(totalMouthwashSeconds);
      setIsMouthwashRunning(false);
      setStep('mouthwash');
    } else {
      await completeAndSaveSession(
        remainingSeconds === 0 ? totalBrushingSeconds : elapsed,
        false
      );
    }
  };

  const handleFinishFromMouthwash = async () => {
    setIsMouthwashRunning(false);
    const elapsed =
      remainingSeconds === 0
        ? totalBrushingSeconds
        : Math.max(1, totalBrushingSeconds - remainingSeconds);
    await completeAndSaveSession(elapsed, true);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    previousQuadrantRef.current = 0;
    setRemainingSeconds(totalBrushingSeconds);
  };

  const handleResetMouthwashTimer = () => {
    setIsMouthwashRunning(false);
    setRemainingMouthwashSeconds(totalMouthwashSeconds);
  };

  const interactiveSteps = useMemo(() => {
    const list: SessionStep[] = [];
    if (useFloss) list.push('floss');
    list.push('brush');
    if (useMouthwash) list.push('mouthwash');
    return list;
  }, [useFloss, useMouthwash]);

  const currentStepIndex = interactiveSteps.indexOf(step);
  const totalInteractiveSteps = interactiveSteps.length;
  const progressPercentage =
    step === 'completed'
      ? 100
      : Math.round(((currentStepIndex + 1) / totalInteractiveSteps) * 100);

  const stepLabelNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : totalInteractiveSteps;

  const stepTitleMap: Record<SessionStep, string> = {
    floss: `Etapa ${stepLabelNumber} • Fio Dental`,
    brush: `Etapa ${stepLabelNumber} • Escovação + Língua`,
    mouthwash: `Etapa ${stepLabelNumber} • Enxaguante Bucal`,
    completed: 'Escovação Concluída'
  };

  const mwSize = 200;
  const mwStroke = 12;
  const mwRadius = (mwSize - mwStroke) / 2;
  const mwCircumference = 2 * Math.PI * mwRadius;
  const mwElapsed = Math.max(0, totalMouthwashSeconds - remainingMouthwashSeconds);
  const mwRatio =
    totalMouthwashSeconds > 0 ? Math.min(1, mwElapsed / totalMouthwashSeconds) : 0;
  const mwDashoffset = mwCircumference * (1 - mwRatio);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4">
      {/* Top Focus Header & Flat Progress Bar */}
      <div className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <header className="flex items-center justify-between gap-3 pb-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {stepTitleMap[step]}
            </span>
            {step !== 'completed' && (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Passo {stepLabelNumber} de {totalInteractiveSteps}
                {activeSessionSlotIndex !== undefined
                  ? ` • Escovação ${activeSessionSlotIndex + 1}`
                  : ''}
              </p>
            )}
          </div>

          {step !== 'completed' && (
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setIsMouthwashRunning(false);
                setExitDialogOpen(true);
              }}
              aria-label="Fechar sessão guiada"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </header>

        {/* Flat Progress Bar */}
        <div
          className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da sessão de higiene bucal"
        >
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Step Content */}
      <main className="flex-1 flex flex-col justify-center py-2">
        {step === 'floss' && (
          <div className="space-y-5">
            <FlossIllustration />

            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Comece pelo Fio Dental
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Limpar entre os dentes antes da escova permite que o flúor proteja todas as faces dentárias.
              </p>
            </div>

            {/* 3 Objective Topics */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <strong className="font-bold text-slate-900 dark:text-slate-100">Formato em &ldquo;C&rdquo;:</strong> Abrace a lateral de cada dente com o fio, contornando sua curvatura.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <strong className="font-bold text-slate-900 dark:text-slate-100">Movimento suave:</strong> Deslize delicadamente até a linha da gengiva sem forçar ou bater no tecido.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <strong className="font-bold text-slate-900 dark:text-slate-100">Trecho limpo:</strong> Desenrole um pedaço novo e limpo do fio ao passar para o próximo dente.
                </p>
              </div>
            </Card>

            {/* Discreet Reminder */}
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
              <span>
                Você pode personalizar em quais escovações usa o fio dental nas Configurações.
              </span>
            </div>
          </div>
        )}

        {step === 'brush' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {isTimerFinished
                  ? 'Tempo concluído!'
                  : `Agora: ${QUADRANTS[activeQuadrantIndex].label}`}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isTimerFinished
                  ? 'Excelente trabalho! Você completou os 4 quadrantes e a língua.'
                  : activeQuadrantIndex === 4
                  ? 'Faça movimentos suaves de varredura da base até a ponta da língua.'
                  : 'Mantenha a escova a 45° com movimentos curtos e suaves.'}
              </p>
            </div>

            <CircularTimer
              remainingSeconds={remainingSeconds}
              totalSeconds={totalBrushingSeconds}
              activeQuadrantIndex={activeQuadrantIndex}
              isRunning={isRunning}
              isFinished={isTimerFinished}
            />

            {/* Interactive Timer Controls (Start / Pause / Resume / Reset) */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {!isTimerFinished && (
                <>
                  <Button
                    type="button"
                    variant={isRunning ? 'outline' : 'secondary'}
                    fullWidth
                    onClick={() => {
                      void triggerQuadrantHaptic();
                      setIsRunning((prev) => !prev);
                    }}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5" aria-hidden="true" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                        <span>
                          {remainingSeconds === totalBrushingSeconds
                            ? 'Iniciar'
                            : 'Retomar'}
                        </span>
                      </>
                    )}
                  </Button>

                  {remainingSeconds < totalBrushingSeconds && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetTimer}
                      aria-label="Reiniciar cronômetro"
                    >
                      <RotateCcw className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {step === 'mouthwash' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Enxaguante Bucal
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {isMouthwashFinished
                  ? 'Bochecho concluído! Cuspa o líquido sem enxaguar com água.'
                  : `Bocheche ativamente por ${totalMouthwashSeconds} segundos sem engolir.`}
              </p>
            </div>

            {/* Interactive Flat Circular Mouthwash Timer */}
            <div className="flex flex-col items-center">
              <div
                className="relative flex items-center justify-center"
                style={{ width: mwSize, height: mwSize }}
              >
                <svg
                  width={mwSize}
                  height={mwSize}
                  viewBox={`0 0 ${mwSize} ${mwSize}`}
                  className="-rotate-90 transform"
                  aria-hidden="true"
                >
                  <circle
                    cx={mwSize / 2}
                    cy={mwSize / 2}
                    r={mwRadius}
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth={mwStroke}
                  />
                  <circle
                    cx={mwSize / 2}
                    cy={mwSize / 2}
                    r={mwRadius}
                    fill="none"
                    stroke={isMouthwashFinished ? 'rgb(var(--brand-600))' : '#0284C7'}
                    strokeWidth={mwStroke}
                    strokeLinecap="butt"
                    strokeDasharray={mwCircumference}
                    strokeDashoffset={mwDashoffset}
                    className="transition-all duration-300 ease-linear"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    {isMouthwashFinished ? 'Concluído' : 'Bochecho'}
                  </span>
                  <span
                    className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1"
                    aria-live="polite"
                  >
                    {formatMinutesSeconds(remainingMouthwashSeconds)}
                  </span>
                </div>
              </div>

              {/* Mouthwash Timer Start / Pause / Reset Controls */}
              {!isMouthwashFinished && (
                <div className="w-full flex items-center justify-center gap-3 mt-4">
                  <Button
                    type="button"
                    variant={isMouthwashRunning ? 'outline' : 'secondary'}
                    fullWidth
                    onClick={() => {
                      void triggerQuadrantHaptic();
                      setIsMouthwashRunning((prev) => !prev);
                    }}
                  >
                    {isMouthwashRunning ? (
                      <>
                        <Pause className="w-5 h-5" aria-hidden="true" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                        <span>
                          {remainingMouthwashSeconds === totalMouthwashSeconds
                            ? 'Iniciar Timer'
                            : 'Retomar'}
                        </span>
                      </>
                    )}
                  </Button>

                  {remainingMouthwashSeconds < totalMouthwashSeconds && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetMouthwashTimer}
                      aria-label="Reiniciar cronômetro do enxaguante"
                    >
                      <RotateCcw className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Card padding="sm" className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <strong className="font-bold text-slate-900 dark:text-slate-100">Não engula:</strong> Ao terminar o tempo, cuspa todo o líquido na pia.
                </p>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <strong className="font-bold text-slate-900 dark:text-slate-100">Preserve o flúor:</strong> Não enxágue com água nem coma ou beba pelos próximos <strong>30 minutos</strong>.
                </p>
              </div>
            </Card>
          </div>
        )}

        {step === 'completed' && (
          <div className="space-y-5 text-center">
            <div className="w-24 h-24 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-600 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Escovação Concluída!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {lastSessionGoalJustMet
                  ? 'Parabéns! Você atingiu 100% da sua meta diária de hoje!'
                  : 'Sessão salva no seu histórico de higiene bucal de hoje.'}
              </p>
            </div>

            {/* Celebratory Flat Streak Summary */}
            <Card padding="lg" className="border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-500 flex items-center justify-center mb-3">
                  <Flame className="w-8 h-8" fill="#F59E0B" aria-hidden="true" />
                </div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                  {streak.currentStreak}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1">
                  {streak.currentStreak === 1 ? 'Dia de Sequência' : 'Dias de Sequência'}
                </span>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/60 w-full">
                  Progresso de hoje: {todayProgress.completedCount} de {settings.dailyGoal} escovações concluídas
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Action Controls */}
      <footer className="pt-4 space-y-2">
        {step === 'floss' && (
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => {
              void triggerQuadrantHaptic();
              setStep('brush');
            }}
          >
            <span>Avançar para Escovação</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        )}

        {step === 'brush' && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={!isTimerFinished}
              onClick={handleAdvanceFromBrush}
            >
              <span>Avançar</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>

            {!isTimerFinished && (
              <button
                type="button"
                onClick={handleAdvanceFromBrush}
                className="w-full min-h-[44px] py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-lg"
              >
                Concluir antes
              </button>
            )}
          </div>
        )}

        {step === 'mouthwash' && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={!isMouthwashFinished}
              onClick={handleFinishFromMouthwash}
            >
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>Finalizar Escovação</span>
            </Button>

            {!isMouthwashFinished && (
              <button
                type="button"
                onClick={handleFinishFromMouthwash}
                className="w-full min-h-[44px] py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-lg"
              >
                Concluir antes
              </button>
            )}
          </div>
        )}

        {step === 'completed' && (
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => navigateTo('home')}
          >
            <HomeIcon className="w-5 h-5" aria-hidden="true" />
            <span>Voltar para o Início</span>
          </Button>
        )}
      </footer>

      {/* Confirmation Modal Dialog */}
      <ConfirmExitDialog
        open={exitDialogOpen}
        onCancel={() => setExitDialogOpen(false)}
        onConfirmExit={() => {
          setExitDialogOpen(false);
          navigateTo('home');
        }}
      />
    </div>
  );
};
