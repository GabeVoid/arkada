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
import { CircularTimer, QUADRANTS } from '../components/CircularTimer';
import { ConfirmExitDialog } from '../components/ConfirmExitDialog';
import { FlossIllustration, MouthwashIllustration } from '../components/StepIllustrations';
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

  // Determine per-slot floss and mouthwash settings for this session
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
  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false);

  const previousQuadrantRef = useRef<number>(0);
  const completionSavedRef = useRef<boolean>(false);

  const isTimerFinished = remainingSeconds <= 0;

  // Compute active zone (0 to 4: 4 dental quadrants + 5th stage for tongue cleaning)
  const totalZones = QUADRANTS.length;
  const activeQuadrantIndex = useMemo(() => {
    if (remainingSeconds <= 0) return totalZones - 1;
    const elapsed = Math.max(0, totalBrushingSeconds - remainingSeconds);
    const segmentDuration = totalBrushingSeconds / totalZones;
    const index = Math.floor(elapsed / segmentDuration);
    return Math.min(totalZones - 1, Math.max(0, index));
  }, [remainingSeconds, totalBrushingSeconds, totalZones]);

  // Fire light haptic impact whenever the quadrant/tongue stage changes while timer is running
  useEffect(() => {
    if (step === 'brush' && isRunning && activeQuadrantIndex !== previousQuadrantRef.current) {
      previousQuadrantRef.current = activeQuadrantIndex;
      void triggerQuadrantHaptic();
    }
  }, [activeQuadrantIndex, isRunning, step]);

  // Timer countdown interval
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
      setStep('mouthwash');
    } else {
      await completeAndSaveSession(
        remainingSeconds === 0 ? totalBrushingSeconds : elapsed,
        false
      );
    }
  };

  const handleFinishFromMouthwash = async () => {
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

  // Dynamic step sequence based on this brushing's floss & mouthwash config
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4">
      {/* Top Focus Header & Flat Progress Bar */}
      <div className="sticky top-0 z-30 bg-slate-50 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <header className="flex items-center justify-between gap-3 pb-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
              {stepTitleMap[step]}
            </span>
            {step !== 'completed' && (
              <p className="text-xs font-medium text-slate-600">
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
                setExitDialogOpen(true);
              }}
              aria-label="Fechar sessão guiada"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </header>

        {/* Flat Progress Bar */}
        <div
          className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3"
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Comece pelo Fio Dental
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Limpar entre os dentes antes da escova permite que o flúor proteja todas as faces dentárias.
              </p>
            </div>

            {/* 3 Objective Topics */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Formato em &ldquo;C&rdquo;:</strong> Abrace a lateral de cada dente com o fio, contornando sua curvatura.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Movimento suave:</strong> Deslize delicadamente até a linha da gengiva sem forçar ou bater no tecido.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Trecho limpo:</strong> Desenrole um pedaço novo e limpo do fio ao passar para o próximo dente.
                </p>
              </div>
            </Card>

            {/* Discreet Reminder */}
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <span>
                Você pode personalizar em quais escovações usa o fio dental nas Configurações.
              </span>
            </div>
          </div>
        )}

        {step === 'brush' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isTimerFinished
                  ? 'Tempo concluído!'
                  : `Agora: ${QUADRANTS[activeQuadrantIndex].label}`}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
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
          <div className="space-y-5">
            <MouthwashIllustration />

            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Enxaguante Bucal
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Complemente sua higienização com um enxaguante com flúor e sem álcool.
              </p>
            </div>

            <Card padding="md" className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Bocheche por 30 a 60 segundos:</strong> Faça o líquido circular entre todos os dentes e na língua.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Não engula:</strong> Cuspa todo o líquido na pia ao finalizar o tempo.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-800 font-medium">
                  <strong className="font-bold text-slate-900">Preserve o flúor:</strong> Não enxágue com água nem coma ou beba pelos próximos <strong>30 minutos</strong>.
                </p>
              </div>
            </Card>
          </div>
        )}

        {step === 'completed' && (
          <div className="space-y-5 text-center">
            <div className="w-24 h-24 rounded-3xl bg-teal-50 border-2 border-teal-600 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Escovação Concluída!
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {lastSessionGoalJustMet
                  ? 'Parabéns! Você atingiu 100% da sua meta diária de hoje!'
                  : 'Sessão salva no seu histórico de higiene bucal de hoje.'}
              </p>
            </div>

            {/* Celebratory Flat Streak Summary */}
            <Card padding="lg" className="border-amber-300 bg-amber-50/60">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-amber-300 text-amber-500 flex items-center justify-center mb-3">
                  <Flame className="w-8 h-8" fill="#F59E0B" aria-hidden="true" />
                </div>
                <span className="text-4xl font-extrabold text-slate-900">
                  {streak.currentStreak}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 mt-1">
                  {streak.currentStreak === 1 ? 'Dia de Sequência' : 'Dias de Sequência'}
                </span>
                <p className="text-xs font-semibold text-slate-600 mt-3 pt-3 border-t border-amber-200 w-full">
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
                className="w-full min-h-[44px] py-2 text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-lg"
              >
                Concluir antes
              </button>
            )}
          </div>
        )}

        {step === 'mouthwash' && (
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleFinishFromMouthwash}
          >
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>Finalizar Escovação</span>
          </Button>
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
