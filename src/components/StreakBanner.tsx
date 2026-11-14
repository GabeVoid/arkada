import React from 'react';
import { Check, Flame } from 'lucide-react';
import { Card } from './Card';
import { DayOfWeekStatus } from '../types';

interface StreakBannerProps {
  currentStreak: number;
  bestStreak: number;
  weekDays: DayOfWeekStatus[];
  completedToday: number;
  dailyGoal: number;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({
  currentStreak,
  bestStreak,
  weekDays,
  completedToday,
  dailyGoal
}) => {
  const isGoalMetToday = completedToday >= dailyGoal;

  return (
    <Card padding="md" className="border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
              currentStreak > 0
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <Flame
              className="w-8 h-8"
              fill={currentStreak > 0 ? '#F59E0B' : 'none'}
              aria-hidden="true"
            />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              {isGoalMetToday
                ? 'Meta de hoje 100% concluída!'
                : `Meta diária: ${Math.min(completedToday, dailyGoal)} de ${dailyGoal} escovações`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Recorde
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            {bestStreak} {bestStreak === 1 ? 'dia' : 'dias'}
          </span>
        </div>
      </div>

      {/* 7-day weekly bar (Seg a Dom) */}
      <div className="pt-4">
        <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Progresso da semana">
          {weekDays.map((day) => {
            let circleStyle =
              'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400';

            if (day.completed) {
              circleStyle =
                'bg-amber-500 border-amber-500 text-white';
            } else if (day.isToday && day.partial) {
              circleStyle =
                'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-700 dark:text-teal-300';
            } else if (day.isToday) {
              circleStyle =
                'bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-300 text-slate-900 dark:text-slate-100';
            }

            return (
              <div
                key={day.dateKey}
                role="listitem"
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`text-xs font-semibold ${
                    day.isToday
                      ? 'text-slate-900 dark:text-slate-100 font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-colors ${circleStyle}`}
                  aria-label={`${day.dayLabel}: ${
                    day.completed
                      ? 'Meta concluída'
                      : day.partial
                      ? 'Em andamento'
                      : 'Pendente'
                  }`}
                >
                  {day.completed ? (
                    <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                  ) : day.partial ? (
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
