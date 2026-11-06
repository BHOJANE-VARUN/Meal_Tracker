import React, { useState } from 'react';
import { DailyMeal, ExtraItem } from '../../types';
import { getCalendarGridDays, formatMonthYear, toISODateString, formatCompactDate } from '../../utils/dateUtils';
import { DayCell } from './DayCell';
import { DailyMealModal } from '../forms/DailyMealModal';
import { ExtraItemModal } from '../forms/ExtraItemModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';

interface CalendarViewProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  meals: DailyMeal[];
  extraItems: ExtraItem[];
  lastPaidDate: string;
  onSaveMeal: (meal: DailyMeal) => Promise<void>;
  onAddExtraItem: (item: { item_name: string; price: number; item_date: string; note?: string | null }) => Promise<void>;
  onDeleteExtraItem: (id: string) => Promise<void>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onMonthChange,
  meals,
  extraItems,
  lastPaidDate,
  onSaveMeal,
  onAddExtraItem,
  onDeleteExtraItem,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [extraModalDate, setExtraModalDate] = useState<string>(toISODateString(new Date()));

  const calendarDays = getCalendarGridDays(currentDate);

  const mealsByDate = new Map<string, DailyMeal>();
  meals.forEach((m) => mealsByDate.set(m.meal_date, m));

  const extrasByDate = new Map<string, ExtraItem[]>();
  extraItems.forEach((e) => {
    const list = extrasByDate.get(e.item_date) || [];
    list.push(e);
    extrasByDate.set(e.item_date, list);
  });

  const handlePrevMonth = () => onMonthChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentDate, 1));
  const handleToday = () => onMonthChange(new Date());

  const activeMeal = selectedDateStr ? mealsByDate.get(selectedDateStr) || null : null;
  const activeExtras = selectedDateStr ? extrasByDate.get(selectedDateStr) || [] : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">{formatMonthYear(currentDate)}</h2>
          </div>
          {lastPaidDate && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid uptill {formatCompactDate(lastPaidDate)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="text-xs font-bold text-slate-400 uppercase py-1">
            {wd}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const dateStr = toISODateString(day);
          const meal = mealsByDate.get(dateStr) || null;
          const dayExtras = extrasByDate.get(dateStr) || [];
          return (
            <DayCell
              key={dateStr}
              day={day}
              currentMonth={currentDate}
              meal={meal}
              extraItems={dayExtras}
              lastPaidDate={lastPaidDate}
              onClick={() => setSelectedDateStr(dateStr)}
            />
          );
        })}
      </div>

      {selectedDateStr && (
        <DailyMealModal
          isOpen={Boolean(selectedDateStr)}
          onClose={() => setSelectedDateStr(null)}
          dateStr={selectedDateStr}
          meal={activeMeal}
          extraItems={activeExtras}
          lastPaidDate={lastPaidDate}
          onSaveMeal={onSaveMeal}
          onOpenAddExtra={(date) => {
            setExtraModalDate(date);
            setIsExtraModalOpen(true);
          }}
          onDeleteExtra={onDeleteExtraItem}
        />
      )}

      <ExtraItemModal
        isOpen={isExtraModalOpen}
        onClose={() => setIsExtraModalOpen(false)}
        initialDate={extraModalDate}
        onSave={async (item) => {
          await onAddExtraItem(item);
        }}
      />
    </div>
  );
};
