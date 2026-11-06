import React, { useState } from 'react';
import { CalendarView } from '../components/calendar/CalendarView';
import { useWeeklySchedule } from '../hooks/useWeeklySchedule';
import { useMonthlyData } from '../hooks/useMonthlyData';
import { saveDailyMeal } from '../services/mealService';
import { addExtraItem, deleteExtraItem } from '../services/extraItemService';
import { getLastPaidDate } from '../services/billService';
import { DailyMeal } from '../types';
import { getMonthBounds, toISODateString } from '../utils/dateUtils';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { schedule } = useWeeklySchedule();
  
  const { start, end } = getMonthBounds(currentDate);
  const { meals, extraItems, refresh } = useMonthlyData(schedule, {
    fromDate: toISODateString(start),
    toDate: toISODateString(end)
  });

  const lastPaidDate = getLastPaidDate();

  const handleSaveMeal = async (meal: DailyMeal) => {
    await saveDailyMeal(meal);
    await refresh();
  };

  const handleAddExtraItem = async (item: { item_name: string; price: number; item_date: string; note?: string | null }) => {
    await addExtraItem(item);
    await refresh();
  };

  const handleDeleteExtraItem = async (id: string) => {
    await deleteExtraItem(id);
    await refresh();
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-6xl mx-auto w-full pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Calendar & Daily Meals</h1>
        <p className="text-xs text-slate-500 mt-1">
          Click any date to view details, toggle meals, or add extra items. Green badge indicates settled/paid dates.
        </p>
      </div>

      <CalendarView
        currentDate={currentDate}
        onMonthChange={setCurrentDate}
        meals={meals}
        extraItems={extraItems}
        lastPaidDate={lastPaidDate}
        onSaveMeal={handleSaveMeal}
        onAddExtraItem={handleAddExtraItem}
        onDeleteExtraItem={handleDeleteExtraItem}
      />
    </div>
  );
};
