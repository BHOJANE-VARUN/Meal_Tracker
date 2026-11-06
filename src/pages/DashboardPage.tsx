import React, { useState, useEffect } from 'react';
import { StatCards } from '../components/dashboard/StatCards';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { RecordTransactionModal } from '../components/forms/RecordTransactionModal';
import { ExtraItemModal } from '../components/forms/ExtraItemModal';
import { useWeeklySchedule } from '../hooks/useWeeklySchedule';
import { useMonthlyData } from '../hooks/useMonthlyData';
import { getRecentPayments, recordPayment } from '../services/paymentService';
import { addExtraItem, getExtraItems } from '../services/extraItemService';
import { getDailyMeals } from '../services/mealService';
import { syncDateRangeBill } from '../services/billService';
import { Payment } from '../types';
import { toISODateString, formatCompactDate } from '../utils/dateUtils';
import { calculateDailyTotal, calculateMonthlyTotal, formatCurrency } from '../utils/billCalculator';
import { PlusCircle, Calendar as CalendarIcon, Utensils, Moon, Coffee, Settings2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { schedule } = useWeeklySchedule();
  const { 
    meals, 
    extraItems, 
    bill, 
    paidUptillDate, 
    fromDate, 
    toDate, 
    isFullyPaidTillDate,
    cycleLabel, 
    loading, 
    refresh, 
    updatePaidUptillDate 
  } = useMonthlyData(schedule);
  
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [tempPaidUptill, setTempPaidUptill] = useState(paidUptillDate);

  const todayStr = toISODateString(new Date());
  const todayMeal = meals.find((m) => m.meal_date === todayStr) || null;
  const todayExtras = extraItems.filter((e) => e.item_date === todayStr);
  const todayTotal = calculateDailyTotal(todayMeal, todayExtras);

  const loadPayments = async () => {
    const list = await getRecentPayments(5);
    setRecentPayments(list);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    setTempPaidUptill(paidUptillDate);
  }, [paidUptillDate]);

  const handleRecordPayment = async (
    payFromDate: string,
    payToDate: string,
    paymentDate: string,
    amount: number,
    note?: string | null
  ) => {
    const [periodMeals, periodExtras] = await Promise.all([
      getDailyMeals(payFromDate, payToDate),
      getExtraItems(payFromDate, payToDate)
    ]);

    const extrasByDate = new Map<string, typeof periodExtras>();
    periodExtras.forEach((e) => {
      const list = extrasByDate.get(e.item_date) || [];
      list.push(e);
      extrasByDate.set(e.item_date, list);
    });

    const dayTotals = periodMeals.map((m) => {
      const dayExtras = extrasByDate.get(m.meal_date) || [];
      return calculateDailyTotal(m, dayExtras);
    });

    const total = calculateMonthlyTotal(dayTotals);
    const synced = await syncDateRangeBill(payFromDate, payToDate, total);
    
    if (synced?.id) {
      const res = await recordPayment(synced.id, paymentDate, amount, note);
      if (res.pendingAmount === 0) {
        updatePaidUptillDate(payToDate);
      }
    }

    await refresh();
    await loadPayments();
  };

  const handleAddExtraItem = async (item: { item_name: string; price: number; item_date: string; note?: string | null }) => {
    await addExtraItem(item);
    await refresh();
  };

  const handleSavePaidUptill = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPaidUptill) {
      updatePaidUptillDate(tempPaidUptill);
      setIsEditingStart(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-6xl mx-auto w-full pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            {isFullyPaidTillDate ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All Bills Paid (Paid Uptill {formatCompactDate(paidUptillDate)})</span>
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4" />
                <span>Unpaid Bill: {cycleLabel}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Dashboard Overview</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingStart(!isEditingStart)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Paid Uptill: {formatCompactDate(paidUptillDate)}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExtraModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Add Extra Item</span>
          </button>
        </div>
      </div>

      {isEditingStart && (
        <form onSubmit={handleSavePaidUptill} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Paid Uptill Date (Bill Settled Through):</label>
            <input
              type="date"
              required
              value={tempPaidUptill}
              onChange={(e) => setTempPaidUptill(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Update Paid Uptill
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <p className="text-sm">Loading expense data...</p>
        </div>
      ) : (
        <>
          <StatCards
            bill={bill}
            onRecordPaymentClick={() => setIsRecordModalOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Today's Meals & Extras</h2>
                    <p className="text-xs text-slate-500">Expenses for today</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    Total: {formatCurrency(todayTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Breakfast + Lunch</p>
                        <p className="text-[11px] text-slate-400">
                          {todayMeal?.breakfast_lunch_enabled ? 'Active' : 'Off'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {todayMeal?.breakfast_lunch_enabled ? formatCurrency(todayMeal.breakfast_lunch_price) : '₹0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Dinner</p>
                        <p className="text-[11px] text-slate-400">
                          {todayMeal?.dinner_enabled ? 'Active' : 'Off'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {todayMeal?.dinner_enabled ? formatCurrency(todayMeal.dinner_price) : '₹0'}
                    </span>
                  </div>
                </div>

                {todayExtras.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span>Today's Extra Items</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {todayExtras.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <span className="font-semibold">{e.item_name}</span>
                          <span>{formatCurrency(e.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Link
                    to="/calendar"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View Calendar & Daily Records →
                  </Link>
                </div>
              </div>

              <RecentTransactions payments={recentPayments} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {isFullyPaidTillDate ? 'All Bills Settled' : 'Unpaid Billing Period'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    {isFullyPaidTillDate
                      ? 'No outstanding meal or extra dues up to today.'
                      : `Calculates meals & extras from day after paid uptill (${formatCompactDate(fromDate)}) to today.`}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 mt-6">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs text-xs flex flex-col gap-1">
                    <span className="text-emerald-200 font-medium">Status:</span>
                    <span className="font-bold text-white text-sm">
                      {isFullyPaidTillDate
                        ? `Paid through Today (${formatCompactDate(toDate)})`
                        : `${formatCompactDate(fromDate)} to Today (${formatCompactDate(toDate)})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(true)}
                    disabled={!bill || bill.pending_amount <= 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition disabled:opacity-50 text-center cursor-pointer shadow-xs"
                  >
                    {bill && bill.pending_amount > 0 ? 'Record Payment' : 'Bill Fully Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExtraModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold transition text-center cursor-pointer"
                  >
                    + Add Extra Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <RecordTransactionModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        paidUptillDate={paidUptillDate}
        onSuccess={() => {}}
        onSavePayment={handleRecordPayment}
      />

      <ExtraItemModal
        isOpen={isExtraModalOpen}
        onClose={() => setIsExtraModalOpen(false)}
        onSave={handleAddExtraItem}
      />
    </div>
  );
};
