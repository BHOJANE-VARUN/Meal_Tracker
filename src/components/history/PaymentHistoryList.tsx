import React from 'react';
import { Payment } from '../../types';
import { formatCurrency } from '../../utils/billCalculator';
import { formatReadableDate, formatDateRange } from '../../utils/dateUtils';
import { Receipt, Calendar, CalendarRange } from 'lucide-react';

interface PaymentHistoryListProps {
  payments: Payment[];
}

export const PaymentHistoryList: React.FC<PaymentHistoryListProps> = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
        <Receipt className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
        <h3 className="text-base font-semibold text-slate-700">No Payment Records Found</h3>
        <p className="text-xs text-slate-400 mt-1">Payments made against meal bills will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Payment Date</th>
              <th className="px-6 py-3.5">Billed Period (From → To)</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Description / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {payments.map((p) => {
              const hasPeriod = Boolean(p.from_date && p.to_date);
              const periodLabel = hasPeriod ? formatDateRange(p.from_date!, p.to_date!) : 'Full Cycle';

              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatReadableDate(p.payment_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-xs bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        {periodLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                    +{formatCurrency(p.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {p.note ? (
                      <span className="text-slate-800">{p.note}</span>
                    ) : (
                      <span className="text-slate-400 italic">No notes</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
