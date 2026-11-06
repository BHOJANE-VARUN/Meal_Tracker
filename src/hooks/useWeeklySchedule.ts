import { useState, useEffect } from 'react';
import { WeeklyScheduleItem } from '../types';
import { getWeeklySchedule, saveWeeklySchedule } from '../services/scheduleService';

export function useWeeklySchedule() {
  const [schedule, setSchedule] = useState<WeeklyScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWeeklySchedule();
        setSchedule(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateSchedule = async (newSchedule: WeeklyScheduleItem[]) => {
    setSchedule(newSchedule);
    await saveWeeklySchedule(newSchedule);
  };

  return { schedule, loading, updateSchedule };
}
