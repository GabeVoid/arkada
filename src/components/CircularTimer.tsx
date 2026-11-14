import React from 'react';
import { QuadrantInfo } from '../types';

export const QUADRANTS: QuadrantInfo[] = [
  {
    id: 'upper-right',
    label: 'Superior Direito',
    shortLabel: 'Sup. Direito',
    description: 'Escove as faces externas, internas e de mastigação do lado superior direito.'
  },
  {
    id: 'upper-left',
    label: 'Superior Esquerdo',
    shortLabel: 'Sup. Esquerdo',
    description: 'Escove as faces externas, internas e de mastigação do lado superior esquerdo.'
  },
  {
    id: 'lower-left',
    label: 'Inferior Esquerdo',
    shortLabel: 'Inf. Esquerdo',
    description: 'Escove as faces externas, internas e de mastigação do lado inferior esquerdo.'
  },
  {
    id: 'lower-right',
    label: 'Inferior Direito',
    shortLabel: 'Inf. Direito',
    description: 'Escove as faces externas, internas e de mastigação do lado inferior direito.'
  },
  {
    id: 'tongue',
    label: 'Higienização da Língua',
    shortLabel: 'Língua (Base à Ponta)',
    description: 'Escove suavemente a língua da base até a ponta para remover a saburra e bactérias.'
  }
];

interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  activeQuadrantIndex: number;
  isRunning: boolean;
  isFinished: boolean;
}

export function formatMinutesSeconds(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingSeconds,
  totalSeconds,
  activeQuadrantIndex,
  isRunning,
  isFinished
}) => {
  const size = 236;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const elapsed = Math.max(0, totalSeconds - remainingSeconds);
  const progressRatio = totalSeconds > 0 ? Math.min(1, elapsed / totalSeconds) : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const currentQuadrant = QUADRANTS[activeQuadrantIndex] ?? QUADRANTS[0];
  const dentalQuadrants = QUADRANTS.slice(0, 4);
  const tongueZone = QUADRANTS[4];

  const getZoneClasses = (idx: number) => {
    const isCurrent = !isFinished && idx === activeQuadrantIndex;
    const isDone = isFinished || idx < activeQuadrantIndex;

    let cardClasses =
      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400';
    let badgeClasses =
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    const statusText = isDone ? 'OK' : isCurrent ? 'Agora' : 'Aguardar';

    if (isCurrent) {
      cardClasses =
        'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-slate-900 dark:text-slate-100';
      badgeClasses = 'bg-teal-600 text-white border-teal-600';
    } else if (isDone) {
      cardClasses =
        'bg-slate-100 dark:bg-slate-800/70 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300';
      badgeClasses =
        'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700';
    }

    return { cardClasses, badgeClasses, statusText };
  };

  const tongueStyle = getZoneClasses(4);

  return (
    <div className="flex flex-col items-center">
      {/* Flat SVG Circular Ring + Digital Display */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={
              isFinished
                ? 'rgb(var(--brand-600))'
                : isRunning
                ? 'rgb(var(--brand-600))'
                : '#0284C7'
            }
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            {isFinished
              ? 'Concluído'
              : activeQuadrantIndex === 4
              ? 'Etapa 5 de 5 • Língua'
              : `Quadrante ${activeQuadrantIndex + 1} de 4`}
          </span>
          <span
            className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums my-1"
            aria-live="polite"
          >
            {formatMinutesSeconds(remainingSeconds)}
          </span>
          <span
            className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
              isFinished
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {isFinished ? 'Escovação Completa!' : currentQuadrant.label}
          </span>
        </div>
      </div>

      {/* 4-Quadrant Dental Arch + Tongue Hygiene Visual Map (Flat) */}
      <div className="w-full mt-5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {dentalQuadrants.map((quad, idx) => {
            const { cardClasses, badgeClasses, statusText } = getZoneClasses(idx);

            return (
              <div
                key={quad.id}
                className={`rounded-xl border p-3 flex items-center justify-between transition-colors ${cardClasses}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${badgeClasses}`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold leading-tight">{quad.shortLabel}</span>
                </div>
                <span className="text-[11px] font-semibold">{statusText}</span>
              </div>
            );
          })}
        </div>

        {/* 5th Stage: Tongue Cleaning (Higienização da Língua) */}
        <div
          className={`rounded-xl border p-3 flex items-center justify-between transition-colors ${tongueStyle.cardClasses}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${tongueStyle.badgeClasses}`}
            >
              5
            </span>
            <div>
              <span className="text-xs font-bold leading-tight block">
                {tongueZone.label}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
                Varredura suave da base até a ponta da língua
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold shrink-0">{tongueStyle.statusText}</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 text-center pt-1 min-h-[32px]">
          {isFinished
            ? 'Todos os 4 quadrantes e a língua foram higienizados com sucesso.'
            : currentQuadrant.description}
        </p>
      </div>
    </div>
  );
};
