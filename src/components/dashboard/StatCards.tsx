import React from 'react';
import { Bill } from '../../types';
import { formatCurrency } from '../../utils/billCalculator';
import { CheckCircle2, Clock4, DollarSign, Wallet } from 'lucide-react';

interface StatCardsProps {
  bill: Bill | null;
  onRecordPaymentClick: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ bill, onRecordPaymentClick }) => {
  const total = bill ? bill.total_amount : 0;
  const paid = bill ? bill.paid_amount : 0;
  const pending = bill ? bill.pending_amount : 0;
  const isPaid = pending <= 0 && total > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Bill</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-400 mt-1">Calculated meals & extras for cycle</p>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Paid Amount</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(paid)}</p>
            <p className="text-xs text-slate-400 mt-1">Recorded payments for cycle</p>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Pending Amount</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600">
              <Clock4 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pending)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {isPaid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Paid
                </span>
              ) : (
                <p className="text-xs text-slate-400">Outstanding balance</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRecordPaymentClick}
          disabled={pending <= 0}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-xs ${
            pending > 0
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {pending > 0 ? 'Record Payment' : 'Bill Fully Paid'}
        </button>
      </div>
    </div>
  );
};
