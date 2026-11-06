import { supabase, isSupabaseConfigured } from './supabase';
import { Bill } from '../types';
import { calculatePendingAmount, determineBillStatus } from '../utils/billCalculator';
import { formatDateRange, toISODateString } from '../utils/dateUtils';
import { addDays, parseISO } from 'date-fns';

const LOCAL_STORAGE_KEY = 'meal_tracker_bills';
const PAID_UPTILL_DATE_KEY = 'meal_tracker_paid_uptill_date';
export const DEFAULT_PAID_UPTILL_DATE = '2026-10-05';

function getLocalBills(): Bill[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!cached) return [];
  try {
    return JSON.parse(cached);
  } catch {
    return [];
  }
}

function saveLocalBills(bills: Bill[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bills));
}

// get date uptill which bill has been settled defaulting to 5 oct 2026
export function getPaidUptillDate(): string {
  const stored = localStorage.getItem(PAID_UPTILL_DATE_KEY);
  return stored || DEFAULT_PAID_UPTILL_DATE;
}

// set date uptill which bill has been settled
export function setPaidUptillDate(dateStr: string): void {
  localStorage.setItem(PAID_UPTILL_DATE_KEY, dateStr);
}

// get the start date of the next unpaid bill which is paid uptill date plus one day
export function getNextBillingStartDate(paidUptill?: string): string {
  const base = paidUptill || getPaidUptillDate();
  try {
    return toISODateString(addDays(parseISO(base), 1));
  } catch {
    return base;
  }
}

// alias for backward compatibility
export const getLastPaidDate = getPaidUptillDate;
export const setLastPaidDate = setPaidUptillDate;

// get bill for specific from date and to date
export async function getBillForDateRange(fromDate: string, toDate: string): Promise<Bill | null> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('from_date', fromDate)
        .eq('to_date', toDate)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    }
  }

  const all = getLocalBills();
  return all.find(b => b.from_date === fromDate && b.to_date === toDate) || null;
}

// get bill by id
export async function getBillById(id: string): Promise<Bill | null> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    }
  }

  const all = getLocalBills();
  return all.find(b => b.id === id) || null;
}

// sync bill for date range ensuring totals and pending are correct
export async function syncDateRangeBill(
  fromDate: string, 
  toDate: string, 
  totalAmount: number,
  title?: string
): Promise<Bill> {
  const existing = await getBillForDateRange(fromDate, toDate);
  const paidAmount = existing ? existing.paid_amount : 0;
  const pendingAmount = calculatePendingAmount(totalAmount, paidAmount);
  const status = determineBillStatus(pendingAmount);
  const cycleTitle = title || formatDateRange(fromDate, toDate);

  const updatedBill: Bill = {
    id: existing?.id || crypto.randomUUID(),
    from_date: fromDate,
    to_date: toDate,
    title: cycleTitle,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    pending_amount: pendingAmount,
    status: status,
    created_at: existing?.created_at || new Date().toISOString()
  };

  const all = getLocalBills();
  const index = all.findIndex(b => b.from_date === fromDate && b.to_date === toDate);
  if (index >= 0) {
    all[index] = { ...all[index], ...updatedBill };
  } else {
    all.push(updatedBill);
  }
  saveLocalBills(all);

  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const payload = {
        from_date: fromDate,
        to_date: toDate,
        title: cycleTitle,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        status: status,
        user_id: userResp.user.id
      };

      const { data, error } = await supabase
        .from('bills')
        .upsert(payload, { onConflict: 'user_id,from_date,to_date' })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  }

  return updatedBill;
}

// settle current bill and set next paid uptill date
export function settleBillToDate(settlementDate: string): void {
  setPaidUptillDate(settlementDate);
}

// get all historical bills sorted descending by from date
export async function getAllBills(): Promise<Bill[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('from_date', { ascending: false });

      if (!error && data) {
        return data;
      }
    }
  }

  const all = getLocalBills();
  return all.sort((a, b) => b.from_date.localeCompare(a.from_date));
}
