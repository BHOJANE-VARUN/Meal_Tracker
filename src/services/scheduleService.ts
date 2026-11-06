import { supabase, isSupabaseConfigured } from './supabase';
import { WeeklyScheduleItem } from '../types';

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleItem[] = [
  { day_of_week: 0, breakfast_lunch_enabled: false, breakfast_lunch_price: 70, dinner_enabled: false, dinner_price: 50 },
  { day_of_week: 1, breakfast_lunch_enabled: false, breakfast_lunch_price: 70, dinner_enabled: true, dinner_price: 50 },
  { day_of_week: 2, breakfast_lunch_enabled: true, breakfast_lunch_price: 70, dinner_enabled: true, dinner_price: 50 },
  { day_of_week: 3, breakfast_lunch_enabled: true, breakfast_lunch_price: 70, dinner_enabled: true, dinner_price: 50 },
  { day_of_week: 4, breakfast_lunch_enabled: true, breakfast_lunch_price: 70, dinner_enabled: true, dinner_price: 50 },
  { day_of_week: 5, breakfast_lunch_enabled: true, breakfast_lunch_price: 70, dinner_enabled: false, dinner_price: 50 },
  { day_of_week: 6, breakfast_lunch_enabled: false, breakfast_lunch_price: 70, dinner_enabled: false, dinner_price: 50 },
];

const LOCAL_STORAGE_KEY = 'meal_tracker_weekly_schedule';

// load weekly schedule
export async function getWeeklySchedule(): Promise<WeeklyScheduleItem[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    }
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback to default
    }
  }
  return DEFAULT_WEEKLY_SCHEDULE;
}

// save weekly schedule configuration
export async function saveWeeklySchedule(items: WeeklyScheduleItem[]): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));

  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const payload = items.map((item) => ({
        ...item,
        user_id: userResp.user.id
      }));

      await supabase
        .from('weekly_schedule')
        .upsert(payload, { onConflict: 'user_id,day_of_week' });
    }
  }
}
