import { supabase, isSupabaseConfigured } from './supabase';
import { DailyMeal, WeeklyScheduleItem } from '../types';
import { getWeekdayIndex, toISODateString } from '../utils/dateUtils';
import { eachDayOfInterval } from 'date-fns';

const LOCAL_STORAGE_KEY = 'meal_tracker_daily_meals';

function getLocalMeals(): DailyMeal[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!cached) return [];
  try {
    return JSON.parse(cached);
  } catch {
    return [];
  }
}

function saveLocalMeals(meals: DailyMeal[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(meals));
}

// fetch meals for date range
export async function getDailyMeals(startDate: string, endDate: string): Promise<DailyMeal[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('daily_meals')
        .select('*')
        .gte('meal_date', startDate)
        .lte('meal_date', endDate);

      if (!error && data) {
        return data;
      }
    }
  }

  const allMeals = getLocalMeals();
  return allMeals.filter(m => m.meal_date >= startDate && m.meal_date <= endDate);
}

// initialize missing days in a month from weekly schedule without overwriting existing
export async function initializeMonthMeals(
  startDate: Date,
  endDate: Date,
  schedule: WeeklyScheduleItem[]
): Promise<DailyMeal[]> {
  const startStr = toISODateString(startDate);
  const endStr = toISODateString(endDate);

  const existingMeals = await getDailyMeals(startStr, endStr);
  const existingMap = new Map<string, DailyMeal>();
  existingMeals.forEach(m => existingMap.set(m.meal_date, m));

  const scheduleMap = new Map<number, WeeklyScheduleItem>();
  schedule.forEach(s => scheduleMap.set(s.day_of_week, s));

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const missingMeals: DailyMeal[] = [];

  for (const day of allDays) {
    const dateStr = toISODateString(day);
    if (!existingMap.has(dateStr)) {
      const dayOfWeek = getWeekdayIndex(day);
      const dayConfig = scheduleMap.get(dayOfWeek);

      const newMeal: DailyMeal = {
        meal_date: dateStr,
        breakfast_lunch_enabled: dayConfig?.breakfast_lunch_enabled ?? false,
        breakfast_lunch_price: (dayConfig?.breakfast_lunch_price && dayConfig.breakfast_lunch_price > 0) ? dayConfig.breakfast_lunch_price : 70,
        dinner_enabled: dayConfig?.dinner_enabled ?? false,
        dinner_price: (dayConfig?.dinner_price && dayConfig.dinner_price > 0) ? dayConfig.dinner_price : 50,
        note: null
      };

      missingMeals.push(newMeal);
      existingMap.set(dateStr, newMeal);
    }
  }

  if (missingMeals.length > 0) {
    if (isSupabaseConfigured) {
      const { data: userResp } = await supabase.auth.getUser();
      if (userResp?.user) {
        const payload = missingMeals.map(m => ({ ...m, user_id: userResp.user.id }));
        await supabase.from('daily_meals').insert(payload);
      }
    }
    const all = getLocalMeals();
    saveLocalMeals([...all, ...missingMeals]);
  }

  return Array.from(existingMap.values()).sort((a, b) => a.meal_date.localeCompare(b.meal_date));
}

// save or update an individual day meal
export async function saveDailyMeal(meal: DailyMeal): Promise<DailyMeal> {
  const all = getLocalMeals();
  const existingIndex = all.findIndex(m => m.meal_date === meal.meal_date);
  
  if (existingIndex >= 0) {
    all[existingIndex] = { ...all[existingIndex], ...meal };
  } else {
    all.push(meal);
  }
  saveLocalMeals(all);

  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const payload = { ...meal, user_id: userResp.user.id };
      const { data, error } = await supabase
        .from('daily_meals')
        .upsert(payload, { onConflict: 'user_id,meal_date' })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  }

  return meal;
}
