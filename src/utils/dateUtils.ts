import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  parseISO, 
  isValid,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  setDate
} from 'date-fns';

// format date to standard yyyy-mm-dd
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// format date for display heading
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

// format date to human readable form
export function formatReadableDate(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, 'EEE, dd MMM yyyy');
}

// format compact date
export function formatCompactDate(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, 'dd MMM yyyy');
}

// format date range string
export function formatDateRange(fromStr: string, toStr: string): string {
  return `${formatCompactDate(fromStr)} - ${formatCompactDate(toStr)}`;
}

// calculate billing cycle from 4th of month to 5th of next month both included
export function getBillingCycle(referenceDate: Date): { fromDate: string; toDate: string; label: string } {
  const dayOfMonth = referenceDate.getDate();
  let cycleStart: Date;
  let cycleEnd: Date;

  if (dayOfMonth > 5) {
    cycleStart = setDate(referenceDate, 4);
    const nextMonth = addMonths(cycleStart, 1);
    cycleEnd = setDate(nextMonth, 5);
  } else {
    const prevMonth = subMonths(referenceDate, 1);
    cycleStart = setDate(prevMonth, 4);
    cycleEnd = setDate(referenceDate, 5);
  }

  const fromStr = toISODateString(cycleStart);
  const toStr = toISODateString(cycleEnd);
  return {
    fromDate: fromStr,
    toDate: toStr,
    label: formatDateRange(fromStr, toStr)
  };
}

// get start and end dates of a month
export function getMonthBounds(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return { start, end };
}

// get calendar grid days including padding days
export function getCalendarGridDays(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

// get weekday index from date 0 is sunday 6 is saturday
export function getWeekdayIndex(date: Date): number {
  return getDay(date);
}

// get month first day formatted as yyyy-mm-01
export function getMonthKey(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM-01');
}
