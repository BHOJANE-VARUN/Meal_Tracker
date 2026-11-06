import { useState, useEffect, useCallback } from 'react';
import { DailyMeal, ExtraItem, Bill, WeeklyScheduleItem } from '../types';
import { formatDateRange, toISODateString, formatCompactDate } from '../utils/dateUtils';
import { initializeMonthMeals } from '../services/mealService';
import { getExtraItems } from '../services/extraItemService';
import { syncDateRangeBill, getPaidUptillDate, setPaidUptillDate, getNextBillingStartDate } from '../services/billService';
import { calculateDailyTotal, calculateMonthlyTotal } from '../utils/billCalculator';
import { parseISO } from 'date-fns';

export function useMonthlyData(
  schedule: WeeklyScheduleItem[],
  customRange?: { fromDate: string; toDate: string }
) {
  const [meals, setMeals] = useState<DailyMeal[]>([]);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [paidUptill, setPaidUptill] = useState<string>(getPaidUptillDate());
  
  const [startDate, setStartDate] = useState<string>(
    customRange?.fromDate || getNextBillingStartDate(getPaidUptillDate())
  );
  const [endDate, setEndDate] = useState<string>(
    customRange?.toDate || toISODateString(new Date())
  );

  useEffect(() => {
    if (customRange) {
      setStartDate(customRange.fromDate);
      setEndDate(customRange.toDate);
    } else {
      const currentPaidUptill = getPaidUptillDate();
      setPaidUptill(currentPaidUptill);
      setStartDate(getNextBillingStartDate(currentPaidUptill));
      setEndDate(toISODateString(new Date()));
    }
  }, [customRange]);

  const isFullyPaidTillDate = startDate > endDate;

  const loadData = useCallback(async () => {
    if (schedule.length === 0) return;
    setLoading(true);
    try {
      if (startDate > endDate) {
        setMeals([]);
        setExtraItems([]);
        setBill({
          id: 'settled',
          from_date: startDate,
          to_date: endDate,
          title: `All Bills Paid Uptill ${formatCompactDate(paidUptill)}`,
          total_amount: 0,
          paid_amount: 0,
          pending_amount: 0,
          status: 'Paid',
          created_at: new Date().toISOString()
        });
        return;
      }

      const fromDateObj = parseISO(startDate);
      const toDateObj = parseISO(endDate);

      const [loadedMeals, loadedExtras] = await Promise.all([
        initializeMonthMeals(fromDateObj, toDateObj, schedule),
        getExtraItems(startDate, endDate)
      ]);

      const mealsByDate = new Map<string, DailyMeal>();
      loadedMeals.forEach(m => mealsByDate.set(m.meal_date, m));

      const extrasByDate = new Map<string, ExtraItem[]>();
      loadedExtras.forEach(e => {
        const list = extrasByDate.get(e.item_date) || [];
        list.push(e);
        extrasByDate.set(e.item_date, list);
      });

      const dayTotals = loadedMeals.map(meal => {
        const dayExtras = extrasByDate.get(meal.meal_date) || [];
        return calculateDailyTotal(meal, dayExtras);
      });

      const totalAmount = calculateMonthlyTotal(dayTotals);
      const label = `From ${formatCompactDate(startDate)} to ${formatCompactDate(endDate)}`;
      const syncedBill = await syncDateRangeBill(
        startDate,
        endDate,
        totalAmount,
        label
      );

      setMeals(loadedMeals);
      setExtraItems(loadedExtras);
      setBill(syncedBill);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, paidUptill, schedule]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePaidUptillDate = (newPaidUptill: string) => {
    setPaidUptillDate(newPaidUptill);
    setPaidUptill(newPaidUptill);
    const nextStart = getNextBillingStartDate(newPaidUptill);
    setStartDate(nextStart);
  };

  return {
    meals,
    extraItems,
    bill,
    paidUptillDate: paidUptill,
    fromDate: startDate,
    toDate: endDate,
    isFullyPaidTillDate,
    cycleLabel: isFullyPaidTillDate ? `Paid uptill ${formatCompactDate(paidUptill)}` : formatDateRange(startDate, endDate),
    loading,
    refresh: loadData,
    updatePaidUptillDate
  };
}
