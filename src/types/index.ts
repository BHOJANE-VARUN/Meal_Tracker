// weekly schedule entry type
export interface WeeklyScheduleItem {
  id?: string;
  user_id?: string;
  day_of_week: number;
  breakfast_lunch_enabled: boolean;
  breakfast_lunch_price: number;
  dinner_enabled: boolean;
  dinner_price: number;
}

// daily meal entry type
export interface DailyMeal {
  id?: string;
  user_id?: string;
  meal_date: string;
  breakfast_lunch_enabled: boolean;
  breakfast_lunch_price: number;
  dinner_enabled: boolean;
  dinner_price: number;
  note?: string | null;
}

// extra item entry type without quantity
export interface ExtraItem {
  id?: string;
  user_id?: string;
  item_date: string;
  item_name: string;
  price: number;
  note?: string | null;
  created_at?: string;
}

// item category type
export interface ItemCategory {
  id?: string;
  user_id?: string;
  name: string;
}

// bill status restricted to pending or paid
export type BillStatus = 'Pending' | 'Paid';

// bill defined by from date and to date
export interface Bill {
  id?: string;
  user_id?: string;
  from_date: string;
  to_date: string;
  title?: string | null;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: BillStatus;
  created_at?: string;
}

// legacy alias for backward compatibility
export type MonthlyBill = Bill;

// payment transaction type without payment method with billed period
export interface Payment {
  id?: string;
  user_id?: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  note?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  created_at?: string;
}

// calendar day calculation summary
export interface DaySummary {
  date: string;
  dayOfWeek: number;
  meal: DailyMeal | null;
  extraItems: ExtraItem[];
  totalMealExpense: number;
  totalExtraExpense: number;
  totalDayExpense: number;
}
