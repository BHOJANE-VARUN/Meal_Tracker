import React, { useState, useEffect } from 'react';
import { useWeeklySchedule } from '../hooks/useWeeklySchedule';
import { WeeklyScheduleItem } from '../types';
import { formatCurrency } from '../utils/billCalculator';
import { Clock, Check, Utensils, Moon } from 'lucide-react';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const SchedulePage: React.FC = () => {
  const { schedule, updateSchedule } = useWeeklySchedule();
  const [localSchedule, setLocalSchedule] = useState<WeeklyScheduleItem[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schedule.length > 0) {
      setLocalSchedule([...schedule]);
    }
  }, [schedule]);

  const handleToggle = (dayOfWeek: number, field: 'breakfast_lunch_enabled' | 'dinner_enabled') => {
    setLocalSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, [field]: !item[field] }
          : item
      )
    );
  };

  const handlePriceChange = (
    dayOfWeek: number,
    field: 'breakfast_lunch_price' | 'dinner_price',
    value: string
  ) => {
    const num = parseFloat(value) || 0;
    setLocalSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, [field]: num }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSchedule(localSchedule);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const weeklySum = localSchedule.reduce((acc, item) => {
    const bl = item.breakfast_lunch_enabled ? item.breakfast_lunch_price : 0;
    const d = item.dinner_enabled ? item.dinner_price : 0;
    return acc + bl + d;
  }, 0);

  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-4xl mx-auto w-full pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Meal Schedule</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure default daily meals and pricing. Applied automatically to new months.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span>Weekly Default:</span>
            <span>{formatCurrency(weeklySum)}</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : saving ? 'Saving...' : 'Save Schedule'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {displayOrder.map((dayOfWeek) => {
          const item = localSchedule.find((s) => s.day_of_week === dayOfWeek);
          if (!item) return null;

          const dayTotal =
            (item.breakfast_lunch_enabled ? item.breakfast_lunch_price : 0) +
            (item.dinner_enabled ? item.dinner_price : 0);

          return (
            <div
              key={dayOfWeek}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center justify-between md:justify-start gap-3 min-w-[140px]">
                <span className="text-sm font-bold text-slate-900">{DAY_NAMES[dayOfWeek]}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {formatCurrency(dayTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-slate-700">Breakfast + Lunch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!item.breakfast_lunch_enabled}
                      value={item.breakfast_lunch_price}
                      onChange={(e) =>
                        handlePriceChange(dayOfWeek, 'breakfast_lunch_price', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs text-right border border-slate-200 rounded-md font-medium disabled:opacity-30"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggle(dayOfWeek, 'breakfast_lunch_enabled')}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                        item.breakfast_lunch_enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-700">Dinner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!item.dinner_enabled}
                      value={item.dinner_price}
                      onChange={(e) =>
                        handlePriceChange(dayOfWeek, 'dinner_price', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs text-right border border-slate-200 rounded-md font-medium disabled:opacity-30"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggle(dayOfWeek, 'dinner_enabled')}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                        item.dinner_enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
