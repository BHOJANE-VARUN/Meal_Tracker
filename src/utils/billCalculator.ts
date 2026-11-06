import { DailyMeal, ExtraItem, BillStatus } from '../types';

// calculate daily meal expense from breakfast lunch and dinner
export function calculateDailyMealExpense(meal: DailyMeal | null): number {
  if (!meal) return 0;
  const blPrice = meal.breakfast_lunch_enabled ? Number(meal.breakfast_lunch_price || 0) : 0;
  const dPrice = meal.dinner_enabled ? Number(meal.dinner_price || 0) : 0;
  return blPrice + dPrice;
}

// calculate daily extra items total price
export function calculateDailyExtraExpense(items: ExtraItem[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => total + Number(item.price || 0), 0);
}

// calculate grand daily total
export function calculateDailyTotal(meal: DailyMeal | null, items: ExtraItem[]): number {
  return calculateDailyMealExpense(meal) + calculateDailyExtraExpense(items);
}

// calculate sum of daily totals for monthly bill
export function calculateMonthlyTotal(dayTotals: number[]): number {
  return dayTotals.reduce((sum, current) => sum + current, 0);
}

// calculate remaining pending amount ensuring non-negative
export function calculatePendingAmount(totalBill: number, paidAmount: number): number {
  const diff = Number(totalBill) - Number(paidAmount);
  return Math.max(0, Math.round(diff * 100) / 100);
}

// determine status based strictly on pending amount
export function determineBillStatus(pendingAmount: number): BillStatus {
  return pendingAmount <= 0 ? 'Paid' : 'Pending';
}

// format number to inr currency string
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
