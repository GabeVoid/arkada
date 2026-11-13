import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Droplets,
  Timer
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Switch } from '../components/Switch';
import { useArkadaStore } from '../hooks/useArkadaStore';
import { adjustScheduledSlots } from '../services/storage';
import { triggerQuadrantHaptic } from '../services/haptics';
import {
  BrushingDurationSeconds,
  BrushingSlotConfig,
  MouthwashDurationSeconds
} from '../types';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    navigateTo,
    showToast,
    triggerTestNotification
  } = useArkadaStore();

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

  const durationMinutes = Math.round(brushingDuration / 60);

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
    await updateSettings({
      dailyGoal,
      scheduledSlots,
      scheduledTimes: scheduledSlots.map((s) => s.time),
      brushingDuration,
      mouthwashDuration,
      mouthwashEnabled: scheduledSlots.some((s) => s.mouthwash),
      notificationsEnabled
    });
    void triggerQuadrantHaptic();
    showToast('Configurações salvas');
    navigateTo('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col max-w-md mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Fixed/Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            aria-label="Voltar para a Tela Inicial"
            className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-none">
              Configurações
            </h1>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Personalize sua rotina no Arkada
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        <form id="settings-form" onSubmit={handleSave} className="space-y-5">
          {/* 1. Rotina Diária (Quantidade, Horários, Fio Dental e Enxaguante por Escovação) */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Rotina Diária
                </h2>
                <p className="text-xs text-slate-600">
                  Horários, fio dental e enxaguante por escovação
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {count}x
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Horários e etapas de cada escovação
              </span>
              {scheduledSlots.map((slot, index) => {
                const fieldId = `settings-time-${index}`;
                return (
                  <div
                    key={fieldId}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={fieldId}
                        className="flex items-center gap-2.5 text-sm font-bold text-slate-900 cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center text-xs font-extrabold">
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
                        className="min-h-[48px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-sm focus:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
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
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
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
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
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
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <label
                    htmlFor="brushing-duration-slider"
                    className="text-sm font-extrabold text-slate-900 block cursor-pointer"
                  >
                    Tempo de Escovação
                  </label>
                  <p className="text-xs text-slate-600">
                    Dividido entre os 4 quadrantes e a língua
                  </p>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-sm shrink-0">
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
                className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 mt-1"
                aria-hidden="true"
              >
                {[2, 3, 4, 5].map((minVal) => (
                  <span
                    key={minVal}
                    className={
                      durationMinutes === minVal
                        ? 'text-teal-700 font-extrabold'
                        : 'text-slate-500'
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
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <label
                    htmlFor="mouthwash-duration-slider"
                    className="text-sm font-extrabold text-slate-900 block cursor-pointer"
                  >
                    Tempo do Enxaguante
                  </label>
                  <p className="text-xs text-slate-600">
                    Duração do bochecho na etapa de enxaguante
                  </p>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-extrabold text-sm shrink-0">
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
                className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 mt-1"
                aria-hidden="true"
              >
                {[30, 40, 50, 60].map((secVal) => (
                  <span
                    key={secVal}
                    className={
                      mouthwashDuration === secVal
                        ? 'text-teal-700 font-extrabold'
                        : 'text-slate-500'
                    }
                  >
                    {secVal}s
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 4. Lembretes */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Lembretes
                </h2>
                <p className="text-xs text-slate-600">
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

            <div className="pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => void triggerTestNotification()}
              >
                <Bell className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
