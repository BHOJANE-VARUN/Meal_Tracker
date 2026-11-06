import React, { useState, useEffect } from 'react';
import { ExtraItem } from '../../types';
import { toISODateString } from '../../utils/dateUtils';
import { X, Coffee, Cookie, CupSoda } from 'lucide-react';

interface ExtraItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  itemToEdit?: ExtraItem | null;
  onSave: (item: { item_name: string; price: number; item_date: string; note?: string | null }) => Promise<void>;
}

const PRESETS = [
  { name: 'Chai', price: 10, icon: Coffee },
  { name: 'Snacks', price: 20, icon: Cookie },
  { name: 'Cold Drink', price: 20, icon: CupSoda },
];

export const ExtraItemModal: React.FC<ExtraItemModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  itemToEdit,
  onSave
}) => {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [itemDate, setItemDate] = useState(toISODateString(new Date()));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.item_name);
      setPrice(itemToEdit.price.toString());
      setItemDate(itemToEdit.item_date);
      setNote(itemToEdit.note || '');
    } else {
      setItemName('');
      setPrice('');
      setItemDate(initialDate || toISODateString(new Date()));
      setNote('');
    }
  }, [itemToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (!itemName.trim() || isNaN(numPrice) || numPrice < 0) return;

    try {
      setSubmitting(true);
      await onSave({
        item_name: itemName.trim(),
        price: numPrice,
        item_date: itemDate,
        note: note.trim() || null
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const selectPreset = (name: string, defaultPrice: number) => {
    setItemName(name);
    setPrice(defaultPrice.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {itemToEdit ? 'Edit Extra Item' : 'Add Extra Item'}
            </h3>
            <p className="text-xs text-slate-500">Record snacks, chai, or additional charges</p>
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
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Quick Presets</span>
            <div className="flex items-center gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => selectPreset(preset.name, preset.price)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium border border-slate-200 text-slate-700 transition"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{preset.name} (₹{preset.price})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Chai, Snacks, Juice"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Date</label>
              <input
                type="date"
                required
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Note (Optional)</label>
            <input
              type="text"
              placeholder="Optional remarks"
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
