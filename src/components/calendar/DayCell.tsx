import React from 'react';
import { DailyMeal, ExtraItem } from '../../types';
import { calculateDailyTotal, formatCurrency } from '../../utils/billCalculator';
import { toISODateString } from '../../utils/dateUtils';
import { isSameDay, isSameMonth } from 'date-fns';

interface DayCellProps {
  day: Date;
  currentMonth: Date;
  meal: DailyMeal | null;
  extraItems: ExtraItem[];
  lastPaidDate: string;
  onClick: () => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  currentMonth,
  meal,
  extraItems,
  lastPaidDate,
  onClick
}) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isToday = isSameDay(day, new Date());
  const dayNumber = day.getDate();
  const dateStr = toISODateString(day);
  const todayStr = toISODateString(new Date());

  const total = calculateDailyTotal(meal, extraItems);
  const hasBL = meal?.breakfast_lunch_enabled;
  const hasDinner = meal?.dinner_enabled;
  const hasExtras = extraItems.length > 0;

  const isPaid = Boolean(lastPaidDate && dateStr <= lastPaidDate);
  const isFuture = dateStr > todayStr;

  return (
    <div
      onClick={onClick}
      className={`min-h-[96px] p-2 flex flex-col justify-between rounded-xl border transition cursor-pointer select-none ${
        !isCurrentMonth
          ? 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-75'
          : isPaid
          ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs'
          : isToday
          ? 'bg-white border-emerald-400 ring-1 ring-emerald-400'
          : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
            isToday
              ? 'bg-emerald-600 text-white'
              : isCurrentMonth
              ? 'text-slate-700'
              : 'text-slate-400'
          }`}
        >
          {dayNumber}
        </span>
        {!isFuture && total > 0 && (
          <span className="text-[11px] font-bold text-slate-800">
            {formatCurrency(total)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 my-1">
        {!isFuture && (
          <div className="flex flex-wrap gap-1">
            {hasBL && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200/60">
                BL ₹{meal?.breakfast_lunch_price}
              </span>
            )}
            {hasDinner && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                D ₹{meal?.dinner_price}
              </span>
            )}
            {hasExtras && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                +{extraItems.length} extra
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px]">
        {isPaid ? (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Paid
          </span>
        ) : !isFuture && meal?.note ? (
          <span className="text-slate-400">Note</span>
        ) : null}
      </div>
    </div>
  );
};
