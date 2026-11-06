import { supabase, isSupabaseConfigured } from './supabase';
import { ExtraItem } from '../types';

const LOCAL_STORAGE_KEY = 'meal_tracker_extra_items';

function getLocalItems(): ExtraItem[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!cached) return [];
  try {
    return JSON.parse(cached);
  } catch {
    return [];
  }
}

function saveLocalItems(items: ExtraItem[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

// fetch extra items for date range
export async function getExtraItems(startDate: string, endDate: string): Promise<ExtraItem[]> {
  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const { data, error } = await supabase
        .from('extra_items')
        .select('*')
        .gte('item_date', startDate)
        .lte('item_date', endDate)
        .order('item_date', { ascending: true });

      if (!error && data) {
        return data;
      }
    }
  }

  const all = getLocalItems();
  return all.filter(item => item.item_date >= startDate && item.item_date <= endDate);
}

// add a new extra item without quantity
export async function addExtraItem(item: Omit<ExtraItem, 'id' | 'created_at'>): Promise<ExtraItem> {
  const newItem: ExtraItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };

  const all = getLocalItems();
  all.push(newItem);
  saveLocalItems(all);

  if (isSupabaseConfigured) {
    const { data: userResp } = await supabase.auth.getUser();
    if (userResp?.user) {
      const payload = { ...item, user_id: userResp.user.id };
      const { data, error } = await supabase
        .from('extra_items')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  }

  return newItem;
}

// update an extra item
export async function updateExtraItem(id: string, item: Partial<ExtraItem>): Promise<void> {
  const all = getLocalItems();
  const index = all.findIndex(i => i.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...item };
    saveLocalItems(all);
  }

  if (isSupabaseConfigured) {
    await supabase.from('extra_items').update(item).eq('id', id);
  }
}

// delete an extra item
export async function deleteExtraItem(id: string): Promise<void> {
  const all = getLocalItems();
  const filtered = all.filter(i => i.id !== id);
  saveLocalItems(filtered);

  if (isSupabaseConfigured) {
    await supabase.from('extra_items').delete().eq('id', id);
  }
}
