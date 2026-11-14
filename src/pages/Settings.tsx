import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Check,
  Clock,
  Droplets,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Timer
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Switch } from '../components/Switch';
import { useArkadaStore } from '../hooks/useArkadaStore';
import {
  adjustScheduledSlots,
  applyThemeToDOM,
  toLocalDateKey
} from '../services/storage';
import { triggerQuadrantHaptic } from '../services/haptics';
import {
  BrushingDurationSeconds,
  BrushingSlotConfig,
  ColorTheme,
  CyclicalRemindersConfig,
  MouthwashDurationSeconds,
  ThemeMode
} from '../types';

const THEME_MODES: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Claro', icon: <Sun className="w-4 h-4" aria-hidden="true" /> },
  { id: 'dark', label: 'Escuro', icon: <Moon className="w-4 h-4" aria-hidden="true" /> },
  { id: 'system', label: 'Sistema', icon: <Monitor className="w-4 h-4" aria-hidden="true" /> }
];

const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: 'mint', label: 'Menta', swatch: '#0D9488' },
  { id: 'ocean', label: 'Oceano', swatch: '#0284C7' },
  { id: 'violet', label: 'Lavanda', swatch: '#4F46E5' },
  { id: 'emerald', label: 'Esmeralda', swatch: '#059669' }
];

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    navigateTo,
    showToast,
    triggerTestNotification
  } = useArkadaStore();

  const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(settings.colorTheme);
  const [dailyGoal, setDailyGoal] = useState<number>(settings.dailyGoal);
  const [scheduledSlots, setScheduledSlots] = useState<BrushingSlotConfig[]>(
    settings.scheduledSlots
  );
  const [brushingDuration, setBrushingDuration] = useState<BrushingDurationSeconds>(
    settings.brushingDuration
  );
  const [mouthwashDuration, setMouthwashDuration] = useState<MouthwashDurationSeconds>(
    settings.mouthwashDuration
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    settings.notificationsEnabled
  );
  const [cyclicalReminders, setCyclicalReminders] = useState<CyclicalRemindersConfig>(
    settings.cyclicalReminders
  );

  const durationMinutes = Math.round(brushingDuration / 60);

  const handleThemeModeChange = (mode: ThemeMode) => {
    void triggerQuadrantHaptic();
    setThemeMode(mode);
    applyThemeToDOM(mode, colorTheme);
  };

  const handleColorThemeChange = (theme: ColorTheme) => {
    void triggerQuadrantHaptic();
    setColorTheme(theme);
    applyThemeToDOM(themeMode, theme);
  };

  const handleGoalChange = (newCount: number) => {
    void triggerQuadrantHaptic();
    setDailyGoal(newCount);
    setScheduledSlots((prev) => adjustScheduledSlots(prev, newCount));
  };

  const handleTimeChange = (idx: number, value: string) => {
    setScheduledSlots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], time: value };
      return next;
    });
  };

  const handleSlotToggleOption = (idx: number, field: 'floss' | 'mouthwash') => {
    void triggerQuadrantHaptic();
    setScheduledSlots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: !next[idx][field] };
      return next;
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = Number.parseInt(e.target.value, 10);
    const seconds = (minutes * 60) as BrushingDurationSeconds;
    void triggerQuadrantHaptic();
    setBrushingDuration(seconds);
  };

  const handleMouthwashSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = Number.parseInt(e.target.value, 10) as MouthwashDurationSeconds;
    void triggerQuadrantHaptic();
    setMouthwashDuration(seconds);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeCyclical: CyclicalRemindersConfig = {
      toothbrush: {
        ...cyclicalReminders.toothbrush,
        intervalDays: Math.max(
          7,
          Math.min(365, Number(cyclicalReminders.toothbrush.intervalDays) || 60)
        )
      },
      dentist: {
        ...cyclicalReminders.dentist,
        intervalMonths: Math.max(
          1,
          Math.min(24, Number(cyclicalReminders.dentist.intervalMonths) || 6)
        )
      }
    };

    await updateSettings({
      themeMode,
      colorTheme,
      dailyGoal,
      scheduledSlots,
      scheduledTimes: scheduledSlots.map((s) => s.time),
      brushingDuration,
      mouthwashDuration,
      mouthwashEnabled: scheduledSlots.some((s) => s.mouthwash),
      notificationsEnabled,
      cyclicalReminders: safeCyclical
    });
    void triggerQuadrantHaptic();
    showToast('Configurações salvas');
    navigateTo('home');
  };

  const todayKey = toLocalDateKey(new Date());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Fixed/Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              applyThemeToDOM(settings.themeMode, settings.colorTheme);
              navigateTo('home');
            }}
            aria-label="Voltar para a Tela Inicial"
            className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              Configurações
            </h1>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              Personalize sua rotina no Arkada
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        <form id="settings-form" onSubmit={handleSave} className="space-y-5">
          {/* 1. Rotina Diária (Quantidade, Horários, Fio Dental e Enxaguante por Escovação) */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Rotina Diária
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Horários, fio dental e enxaguante por escovação
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Escovações por dia
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((count) => {
                  const isSelected = dailyGoal === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleGoalChange(count)}
                      aria-pressed={isSelected}
                      className={`min-h-[48px] rounded-xl border font-extrabold text-sm flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {count}x
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Horários e etapas de cada escovação
              </span>
              {scheduledSlots.map((slot, index) => {
                const fieldId = `settings-time-${index}`;
                return (
                  <div
                    key={fieldId}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={fieldId}
                        className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-extrabold">
                          {index + 1}
                        </span>
                        <span>Escovação {index + 1}</span>
                      </label>
                      <input
                        id={fieldId}
                        name={`settings_schedule_${index + 1}`}
                        type="time"
                        required
                        value={slot.time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm focus:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                      />
                    </div>

                    {/* Per-Brushing Floss & Mouthwash Toggle Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        aria-pressed={slot.floss}
                        onClick={() => handleSlotToggleOption(index, 'floss')}
                        className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          slot.floss
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                        onClick={() => handleSlotToggleOption(index, 'mouthwash')}
                        className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          slot.mouthwash
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            </div>
          </Card>

          {/* 2. Tempo de Escovação (Range Slider de 2 a 5 minutos com passo de 1 min) */}
          <Card padding="md" className="space-y-3.5">
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <label
                    htmlFor="brushing-duration-slider"
                    className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block cursor-pointer"
                  >
                    Tempo de Escovação
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Dividido entre os 4 quadrantes e a língua
                  </p>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-extrabold text-sm shrink-0">
                {durationMinutes} min
              </span>
            </div>

            <div className="pt-1">
              <input
                id="brushing-duration-slider"
                name="brushing_duration_minutes"
                type="range"
                min={2}
                max={5}
                step={1}
                value={durationMinutes}
                aria-valuetext={`${durationMinutes} minutos`}
                onChange={handleSliderChange}
                style={
                  {
                    '--attr-min': 2,
                    '--attr-max': 5,
                    '--control-value': durationMinutes
                  } as React.CSSProperties
                }
                className="arkada-slider"
              />

              <div
                className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1 mt-1"
                aria-hidden="true"
              >
                {[2, 3, 4, 5].map((minVal) => (
                  <span
                    key={minVal}
                    className={
                      durationMinutes === minVal
                        ? 'text-teal-700 dark:text-teal-400 font-extrabold'
                        : 'text-slate-500 dark:text-slate-500'
                    }
                  >
                    {minVal} min
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 3. Tempo do Enxaguante Bucal (Range Slider de 30 a 60 segundos) */}
          <Card padding="md" className="space-y-3.5">
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <label
                    htmlFor="mouthwash-duration-slider"
                    className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block cursor-pointer"
                  >
                    Tempo do Enxaguante
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Duração do bochecho na etapa de enxaguante
                  </p>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-extrabold text-sm shrink-0">
                {mouthwashDuration}s
              </span>
            </div>

            <div className="pt-1">
              <input
                id="mouthwash-duration-slider"
                name="mouthwash_duration_seconds"
                type="range"
                min={30}
                max={60}
                step={5}
                value={mouthwashDuration}
                aria-valuetext={`${mouthwashDuration} segundos`}
                onChange={handleMouthwashSliderChange}
                style={
                  {
                    '--attr-min': 30,
                    '--attr-max': 60,
                    '--control-value': mouthwashDuration
                  } as React.CSSProperties
                }
                className="arkada-slider"
              />

              <div
                className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1 mt-1"
                aria-hidden="true"
              >
                {[30, 40, 50, 60].map((secVal) => (
                  <span
                    key={secVal}
                    className={
                      mouthwashDuration === secVal
                        ? 'text-teal-700 dark:text-teal-400 font-extrabold'
                        : 'text-slate-500 dark:text-slate-500'
                    }
                  >
                    {secVal}s
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 4. Lembretes Cíclicos (Troca de Escova Dental + Consulta e Limpeza) */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <CalendarClock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Lembretes Cíclicos
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Programe alertas recorrentes para troca de escova e dentista
                </p>
              </div>
            </div>

            {/* Troca de Escova Dental */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
              <Switch
                id="switch-toothbrush-reminder"
                checked={cyclicalReminders.toothbrush.enabled}
                onChange={(enabled) =>
                  setCyclicalReminders((prev) => ({
                    ...prev,
                    toothbrush: { ...prev.toothbrush, enabled }
                  }))
                }
                label="Troca de Escova Dental"
                description="Recomendado a cada 60 a 90 dias (tempo editável)"
              />

              {cyclicalReminders.toothbrush.enabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label
                      htmlFor="tb-interval-days"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      A cada (dias)
                    </label>
                    <input
                      id="tb-interval-days"
                      type="number"
                      min={7}
                      max={365}
                      value={cyclicalReminders.toothbrush.intervalDays}
                      onChange={(e) =>
                        setCyclicalReminders((prev) => ({
                          ...prev,
                          toothbrush: {
                            ...prev.toothbrush,
                            intervalDays: Number.parseInt(e.target.value || '60', 10)
                          }
                        }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="tb-last-date"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Última troca
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCyclicalReminders((prev) => ({
                            ...prev,
                            toothbrush: { ...prev.toothbrush, lastDate: todayKey }
                          }))
                        }
                        className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        Hoje
                      </button>
                    </div>
                    <input
                      id="tb-last-date"
                      type="date"
                      max={todayKey}
                      value={cyclicalReminders.toothbrush.lastDate}
                      onChange={(e) =>
                        setCyclicalReminders((prev) => ({
                          ...prev,
                          toothbrush: {
                            ...prev.toothbrush,
                            lastDate: e.target.value || todayKey
                          }
                        }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Consulta e Limpeza no Dentista */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
              <Switch
                id="switch-dentist-reminder"
                checked={cyclicalReminders.dentist.enabled}
                onChange={(enabled) =>
                  setCyclicalReminders((prev) => ({
                    ...prev,
                    dentist: { ...prev.dentist, enabled }
                  }))
                }
                label="Consulta e Limpeza"
                description="Recomendado pelos dentistas de 6 em 6 meses (tempo editável)"
              />

              {cyclicalReminders.dentist.enabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label
                      htmlFor="dentist-interval-months"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      A cada (meses)
                    </label>
                    <input
                      id="dentist-interval-months"
                      type="number"
                      min={1}
                      max={24}
                      value={cyclicalReminders.dentist.intervalMonths}
                      onChange={(e) =>
                        setCyclicalReminders((prev) => ({
                          ...prev,
                          dentist: {
                            ...prev.dentist,
                            intervalMonths: Number.parseInt(e.target.value || '6', 10)
                          }
                        }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="dentist-last-date"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        Última consulta
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCyclicalReminders((prev) => ({
                            ...prev,
                            dentist: { ...prev.dentist, lastDate: todayKey }
                          }))
                        }
                        className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        Hoje
                      </button>
                    </div>
                    <input
                      id="dentist-last-date"
                      type="date"
                      max={todayKey}
                      value={cyclicalReminders.dentist.lastDate}
                      onChange={(e) =>
                        setCyclicalReminders((prev) => ({
                          ...prev,
                          dentist: {
                            ...prev.dentist,
                            lastDate: e.target.value || todayKey
                          }
                        }))
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 5. Aparência e Temas (Modo Escuro / Claro / Sistema + Cores) */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Aparência e Temas
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Escolha entre tema claro, escuro e a cor de destaque do app
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Modo de exibição
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {THEME_MODES.map((m) => {
                  const active = themeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleThemeModeChange(m.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                        active
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Paleta de cores
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((ct) => {
                  const active = colorTheme === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleColorThemeChange(ct.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                        active
                          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: ct.swatch }}
                        aria-hidden="true"
                      />
                      <span>{ct.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          {/* 6. Lembretes e Notificações */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Lembretes
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Notificações locais diárias no dispositivo
                </p>
              </div>
            </div>

            <Switch
              id="switch-notifications"
              name="notifications_enabled"
              checked={notificationsEnabled}
              onChange={(val) => setNotificationsEnabled(val)}
              label="Notificações Diárias"
              description="Receba alertas nos horários configurados para manter sua sequência."
            />

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => void triggerTestNotification()}
              >
                <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Testar Notificação (3s)</span>
              </Button>
            </div>
          </Card>

          {/* Save Changes Submit Button */}
          <div className="pt-2 space-y-2">
            <Button type="submit" variant="primary" fullWidth>
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
