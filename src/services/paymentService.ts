import { supabase, isSupabaseConfigured } from './supabase';
import { Payment } from '../types';
import { getBillById, getBillForDateRange } from './billService';
import { calculatePendingAmount, determineBillStatus } from '../utils/billCalculator';

const LOCAL_STORAGE_KEY = 'meal_tracker_payments';
const BILLS_KEY = 'meal_tracker_bills';

function getLocalPayments(): Payment[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!cached) return [];
  try {
    const list: Payment[] = JSON.parse(cached);
    const cachedBills = localStorage.getItem(BILLS_KEY);
    const bills = cachedBills ? JSON.parse(cachedBills) : [];
    const billsMap = new Map<string, { from_date: string; to_date: string }>();
    bills.forEach((b: { id?: string; from_date: string; to_date: string }) => {
      if (b.id) billsMap.set(b.id, b);
    });

    return list.map(p => {
      if (!p.from_date && p.bill_id && billsMap.has(p.bill_id)) {
        const found = billsMap.get(p.bill_id)!;
        return { ...p, from_date: found.from_date, to_date: found.to_date };
      }
      return p;
    });
  } catch {
    return [];
  }
}

function saveLocalPayments(payments: Payment[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payments));
}

// get payments for specific bill id
export async function getPaymentsForBill(billId: string): Promise<Payment[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, bills(from_date, to_date)')
        .eq('bill_id', billId)
        .order('payment_date', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          from_date: item.from_date || item.bills?.from_date || null,
          to_date: item.to_date || item.bills?.to_date || null
        }));
      }
    }
  }

  const all = getLocalPayments();
  return all.filter(p => p.bill_id === billId).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

// get recent transactions across all bills
export async function getRecentPayments(limitCount = 50): Promise<Payment[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, bills(from_date, to_date)')
        .order('payment_date', { ascending: false })
        .limit(limitCount);

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          from_date: item.from_date || item.bills?.from_date || null,
          to_date: item.to_date || item.bills?.to_date || null
        }));
      }
    }
  }

  const all = getLocalPayments();
  return all.sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, limitCount);
}

// record transaction for a specific bill id without payment method
export async function recordPayment(
  billId: string,
  paymentDate: string,
  amount: number,
  note?: string | null
): Promise<{ payment: Payment; pendingAmount: number }> {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const bill = await getBillById(billId);
  if (!bill) {
    throw new Error('Bill record not found');
  }

  if (amount > bill.pending_amount) {
    throw new Error('Payment amount exceeds current pending amount');
  }

  const newPayment: Payment = {
    id: crypto.randomUUID(),
    bill_id: bill.id as string,
    payment_date: paymentDate,
    amount: amount,
    note: note || null,
    from_date: bill.from_date,
    to_date: bill.to_date,
    created_at: new Date().toISOString()
  };

  const newPaid = Number(bill.paid_amount) + Number(amount);
  const newPending = calculatePendingAmount(bill.total_amount, newPaid);
  const newStatus = determineBillStatus(newPending);

  const allPayments = getLocalPayments();
  allPayments.push(newPayment);
  saveLocalPayments(allPayments);

  const cachedBills = localStorage.getItem(BILLS_KEY);
  if (cachedBills) {
    try {
      const parsedBills = JSON.parse(cachedBills);
      const bIndex = parsedBills.findIndex((b: { id?: string }) => b.id === billId);
      if (bIndex >= 0) {
        parsedBills[bIndex].paid_amount = newPaid;
        parsedBills[bIndex].pending_amount = newPending;
        parsedBills[bIndex].status = newStatus;
        localStorage.setItem(BILLS_KEY, JSON.stringify(parsedBills));
      }
    } catch {
      // ignore
    }
  }

  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const paymentPayload = {
        bill_id: bill.id,
        payment_date: paymentDate,
        amount: amount,
        note: note || null,
        from_date: bill.from_date,
        to_date: bill.to_date,
        user_id: userResp.user.id
      };

      await supabase.from('payments').insert(paymentPayload);

      await supabase
        .from('bills')
        .update({
          paid_amount: newPaid,
          pending_amount: newPending,
          status: newStatus
        })
        .eq('id', bill.id);
    }
  }

  return { payment: newPayment, pendingAmount: newPending };
}

// record payment by date range
export async function recordPaymentForCycle(
  fromDate: string,
  toDate: string,
  paymentDate: string,
  amount: number,
  note?: string | null
): Promise<{ payment: Payment; pendingAmount: number }> {
  const bill = await getBillForDateRange(fromDate, toDate);
  if (!bill || !bill.id) {
    throw new Error('Bill not found for the specified date range');
  }
  return recordPayment(bill.id, paymentDate, amount, note);
}
