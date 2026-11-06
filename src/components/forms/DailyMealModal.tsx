import React, { useState, useEffect } from 'react';
import { DailyMeal, ExtraItem } from '../../types';
import { formatCurrency, calculateDailyTotal } from '../../utils/billCalculator';
import { formatReadableDate } from '../../utils/dateUtils';
import { X, Plus, Trash2, Utensils, Moon, CheckCircle2 } from 'lucide-react';

interface DailyMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  meal: DailyMeal | null;
  extraItems: ExtraItem[];
  lastPaidDate?: string;
  onSaveMeal: (meal: DailyMeal) => Promise<void>;
  onOpenAddExtra: (dateStr: string) => void;
  onDeleteExtra: (id: string) => Promise<void>;
}

export const DailyMealModal: React.FC<DailyMealModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  meal,
  extraItems,
  lastPaidDate,
  onSaveMeal,
  onOpenAddExtra,
  onDeleteExtra,
}) => {
  const [blEnabled, setBlEnabled] = useState(false);
  const [blPrice, setBlPrice] = useState('70');
  const [dinnerEnabled, setDinnerEnabled] = useState(false);
  const [dinnerPrice, setDinnerPrice] = useState('50');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meal) {
      setBlEnabled(meal.breakfast_lunch_enabled);
      setBlPrice(meal.breakfast_lunch_price > 0 ? meal.breakfast_lunch_price.toString() : '70');
      setDinnerEnabled(meal.dinner_enabled);
      setDinnerPrice(meal.dinner_price > 0 ? meal.dinner_price.toString() : '50');
      setNote(meal.note || '');
    } else {
      setBlEnabled(false);
      setBlPrice('70');
      setDinnerEnabled(false);
      setDinnerPrice('50');
      setNote('');
    }
  }, [meal, dateStr, isOpen]);

  if (!isOpen) return null;

  const isPaid = Boolean(lastPaidDate && dateStr <= lastPaidDate);

  const handleToggleBL = () => {
    const nextState = !blEnabled;
    setBlEnabled(nextState);
    if (nextState && (parseFloat(blPrice) <= 0 || !blPrice)) {
      setBlPrice('70');
    }
  };

  const handleToggleDinner = () => {
    const nextState = !dinnerEnabled;
    setDinnerEnabled(nextState);
    if (nextState && (parseFloat(dinnerPrice) <= 0 || !dinnerPrice)) {
      setDinnerPrice('50');
    }
  };

  const currentMeal: DailyMeal = {
    meal_date: dateStr,
    breakfast_lunch_enabled: blEnabled,
    breakfast_lunch_price: parseFloat(blPrice) || 0,
    dinner_enabled: dinnerEnabled,
    dinner_price: parseFloat(dinnerPrice) || 0,
    note: note.trim() || null
  };

  const dayTotal = calculateDailyTotal(currentMeal, extraItems);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveMeal(currentMeal);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Edit Daily Meal</h3>
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Paid (Settled)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{formatReadableDate(dateStr)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Breakfast + Lunch</p>
                  <p className="text-xs text-slate-400">Regular combined meal (Default ₹70)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={!blEnabled}
                  value={blPrice}
                  onChange={(e) => setBlPrice(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-right disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleToggleBL}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    blEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Dinner</p>
                  <p className="text-xs text-slate-400">Evening meal (Default ₹50)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={!dinnerEnabled}
                  value={dinnerPrice}
                  onChange={(e) => setDinnerPrice(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-right disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleToggleDinner}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    dinnerEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extra Items</span>
              <button
                type="button"
                onClick={() => onOpenAddExtra(dateStr)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra</span>
              </button>
            </div>

            {extraItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No extra items recorded for this date.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {extraItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-white text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{item.item_name}</span>
                      {item.note && <span className="text-slate-400 ml-1.5">({item.note})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{formatCurrency(item.price)}</span>
                      {item.id && (
                        <button
                          type="button"
                          onClick={() => onDeleteExtra(item.id!)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Daily Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Skipped dinner or feast day"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500">Day Total:</span>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(dayTotal)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
