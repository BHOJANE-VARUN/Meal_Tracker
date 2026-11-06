import React, { useState, useEffect } from 'react';
import { formatCurrency, calculateDailyTotal, calculateMonthlyTotal, calculatePendingAmount } from '../../utils/billCalculator';
import { toISODateString, formatDateRange } from '../../utils/dateUtils';
import { getDailyMeals } from '../../services/mealService';
import { getExtraItems } from '../../services/extraItemService';
import { getBillForDateRange, getNextBillingStartDate } from '../../services/billService';
import { X, AlertCircle } from 'lucide-react';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paidUptillDate?: string;
  onSuccess: () => void;
  onSavePayment: (
    fromDate: string,
    toDate: string,
    paymentDate: string,
    amount: number,
    note?: string | null
  ) => Promise<void>;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({
  isOpen,
  onClose,
  paidUptillDate,
  onSuccess,
  onSavePayment
}) => {
  const defaultTo = toISODateString(new Date());
  const defaultFrom = getNextBillingStartDate(paidUptillDate);

  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  const [paymentDate, setPaymentDate] = useState<string>(defaultTo);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialFrom = getNextBillingStartDate(paidUptillDate);
      const initialTo = toISODateString(new Date());
      setFromDate(initialFrom);
      setToDate(initialTo);
      setPaymentDate(initialTo);
      setAmount('');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, paidUptillDate]);

  useEffect(() => {
    async function calculateInterval() {
      if (!fromDate || !toDate || fromDate > toDate) {
        setPendingAmount(0);
        return;
      }
      setCalculating(true);
      try {
        const [meals, extras, existingBill] = await Promise.all([
          getDailyMeals(fromDate, toDate),
          getExtraItems(fromDate, toDate),
          getBillForDateRange(fromDate, toDate)
        ]);

        const extrasByDate = new Map<string, typeof extras>();
        extras.forEach((e) => {
          const list = extrasByDate.get(e.item_date) || [];
          list.push(e);
          extrasByDate.set(e.item_date, list);
        });

        const dayTotals = meals.map((m) => {
          const dayExtras = extrasByDate.get(m.meal_date) || [];
          return calculateDailyTotal(m, dayExtras);
        });

        const total = calculateMonthlyTotal(dayTotals);
        const paid = existingBill ? Number(existingBill.paid_amount || 0) : 0;
        const pending = calculatePendingAmount(total, paid);

        setPendingAmount(pending);
      } finally {
        setCalculating(false);
      }
    }

    calculateInterval();
  }, [fromDate, toDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fromDate > toDate) {
      setErrorMsg('From Date cannot be later than To Date.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    if (numericAmount > pendingAmount) {
      setErrorMsg(`Amount cannot exceed the pending balance of ${formatCurrency(pendingAmount)}.`);
      return;
    }

    try {
      setSubmitting(true);
      await onSavePayment(fromDate, toDate, paymentDate, numericAmount, note.trim() || null);
      setAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to record transaction');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500">Record transaction for unpaid period</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">From Date (Paid Uptill + 1)</label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">To Date (Current Date)</label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 text-xs">
            <div>
              <span className="font-semibold text-amber-800">Pending For Period</span>
              <p className="text-[11px] text-amber-600">
                {fromDate > toDate
                  ? 'All bills till date are already paid!'
                  : calculating
                  ? 'Calculating...'
                  : formatDateRange(fromDate, toDate)}
              </p>
            </div>
            <span className="text-base font-bold text-amber-700">
              {fromDate > toDate ? '₹0' : calculating ? '...' : formatCurrency(pendingAmount)}
            </span>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
              {pendingAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(pendingAmount.toString())}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  Pay Full Pending ({formatCurrency(pendingAmount)})
                </button>
              )}
            </div>
            <input
              type="number"
              required
              step="any"
              min="1"
              max={pendingAmount > 0 ? pendingAmount : undefined}
              placeholder="Enter paid amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid online or cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || calculating || pendingAmount <= 0}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
