import React from 'react';
import { Payment } from '../../types';
import { formatCurrency } from '../../utils/billCalculator';
import { formatReadableDate, formatDateRange } from '../../utils/dateUtils';
import { Receipt, Calendar, ArrowUpRight, CalendarRange } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentTransactionsProps {
  payments: Payment[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ payments }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Payments</h2>
          <p className="text-xs text-slate-500">Latest recorded transactions</p>
        </div>
        <Link
          to="/history"
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
          <Receipt className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
          <p className="text-sm font-medium">No payments recorded yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Use Record Payment button to add a transaction</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {payments.map((p) => {
            const hasPeriod = Boolean(p.from_date && p.to_date);
            const periodLabel = hasPeriod ? formatDateRange(p.from_date!, p.to_date!) : null;

            return (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Payment Received
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatReadableDate(p.payment_date)}
                      </span>
                      {periodLabel && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-medium">
                          <CalendarRange className="w-3 h-3" />
                          {periodLabel}
                        </span>
                      )}
                      {p.note && <span>• {p.note}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  +{formatCurrency(p.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
