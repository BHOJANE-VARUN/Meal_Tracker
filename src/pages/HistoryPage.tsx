import React, { useState, useEffect } from 'react';
import { getRecentPayments } from '../services/paymentService';
import { Payment } from '../types';
import { PaymentHistoryList } from '../components/history/PaymentHistoryList';

export const HistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const list = await getRecentPayments(50);
        setPayments(list);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete ledger of all payments recorded against monthly meal bills.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <p className="text-sm">Loading transactions...</p>
        </div>
      ) : (
        <PaymentHistoryList payments={payments} />
      )}
    </div>
  );
};
