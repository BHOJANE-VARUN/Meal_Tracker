# Implementation Plan --- Meal Expense Tracker

## 1. Project scope

Build a mobile-friendly Meal Expense Tracker web application using
React, TypeScript, Tailwind CSS, and Supabase. Deploy it online so it
can be accessed from a phone or computer.

Requirements: - Automatically apply the default weekly meal schedule. -
Edit any individual date without changing other dates. - Edit the weekly
schedule and choose how changes apply. - Add extra items such as chai or
snacks with item name, date, price, and optional note. - **Do not
include quantity** in extra item records or forms. - Calculate daily and
monthly expenses automatically. - Record one or multiple payments
against a monthly bill. - Show **Total Bill**, **Paid Amount**, and
**Pending Amount**. - Use only **Paid** and **Pending** statuses; remove
"Partial Paid". - Remove **Payment Method** from the Record Transaction
form and payment records. - Preserve historical bills and
transactions. - Make the app accessible over the internet and
installable as a PWA.

## 2. Default weekly schedule

  Day           Breakfast + Lunch   Dinner
  ----------- ------------------- --------
  Monday                      Off      ₹50
  Tuesday                     ₹70      ₹50
  Wednesday                   ₹70      ₹50
  Thursday                    ₹70      ₹50
  Friday                      ₹70      Off
  Saturday                    Off      Off
  Sunday                      Off      Off

The default weekly expense is ₹480, excluding extra items. Calculate
each month using its actual dates and weekdays.

## 3. Technology stack

  Layer             Technology
  ----------------- ---------------------------------------------
  Frontend          React + TypeScript
  Styling           Tailwind CSS
  Routing           React Router
  Calendar          React calendar component or custom calendar
  Database          Supabase PostgreSQL
  Authentication    Supabase Auth
  Data access       Supabase JS client
  Hosting           Vercel
  Mobile access     Progressive Web App (PWA)
  Version control   Git + GitHub

A separate Express backend is not required for the initial version. Use
PostgreSQL functions or Supabase Edge Functions for sensitive
transactional operations when needed.

## 4. Suggested project structure

``` text
meal-expense-tracker/
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Calendar/
│   │   ├── DailyMealForm/
│   │   ├── ExtraItemForm/
│   │   ├── RecordTransaction/
│   │   └── PaymentHistory/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── SchedulePage.tsx
│   │   ├── BillsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── scheduleService.ts
│   │   ├── mealService.ts
│   │   ├── extraItemService.ts
│   │   ├── billService.ts
│   │   └── paymentService.ts
│   ├── hooks/
│   │   ├── useMonthlyBill.ts
│   │   └── useDailyMeals.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── billCalculator.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## 5. Phase 1 --- Project setup

Create the application:

``` bash
npm create vite@latest meal-expense-tracker -- --template react-ts
cd meal-expense-tracker
npm install
npm install @supabase/supabase-js react-router-dom lucide-react date-fns
npm install tailwindcss @tailwindcss/vite
```

Configure Tailwind CSS using its Vite integration.

Create a Supabase project, enable authentication, and configure Row
Level Security (RLS).

Create `.env.local`:

``` env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Create `src/services/supabase.ts`:

``` typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

Never put the Supabase service-role key in frontend code.

**Deliverable:** React application running locally and connected to
Supabase.

## 6. Phase 2 --- Database design

Use the following tables.

### `weekly_schedule`

Stores the default weekday schedule: - `id` UUID primary key - `user_id`
UUID referencing `auth.users` - `day_of_week` integer, 0--6 -
`breakfast_lunch_enabled` boolean - `breakfast_lunch_price` numeric -
`dinner_enabled` boolean - `dinner_price` numeric - Unique constraint on
`(user_id, day_of_week)`

Day mapping: Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3,
Thursday = 4, Friday = 5, Saturday = 6.

### `daily_meals`

Stores actual meal charges for each date: - `id` UUID primary key -
`user_id` UUID - `meal_date` date - `breakfast_lunch_enabled` boolean -
`breakfast_lunch_price` numeric - `dinner_enabled` boolean -
`dinner_price` numeric - `note` text - Unique constraint on
`(user_id, meal_date)`

### `extra_items`

Stores additional expenses. Quantity is intentionally excluded: - `id`
UUID primary key - `user_id` UUID - `item_date` date - `item_name`
text - `price` numeric, non-negative - `note` text - `created_at`
timestamp

Each record is one item charge. Multiple entries can be added for the
same date.

### `item_categories` (optional)

Stores reusable extra-item names such as Chai, Snacks, or Cold Drink: -
`id` UUID primary key - `user_id` UUID - `name` text

### `monthly_bills`

Stores each monthly bill: - `id` UUID primary key - `user_id` UUID -
`bill_month` date - `total_amount` numeric - `paid_amount` numeric -
`pending_amount` numeric - `status` text constrained to `Pending` or
`Paid` - `created_at` timestamp - Unique constraint on
`(user_id, bill_month)`

### `payments`

Stores payment history: - `id` UUID primary key - `user_id` UUID -
`bill_id` UUID referencing `monthly_bills` - `payment_date` date -
`amount` numeric, greater than zero - `note` text - `created_at`
timestamp

Do **not** add a `payment_method` column.

Enable RLS on all tables and create policies so authenticated users can
only access their own records. Use `user_id = auth.uid()` in policies.

## 7. Phase 3 --- Weekly schedule

Create a Schedule page where each weekday supports: - Enable/disable
breakfast + lunch - Set breakfast + lunch price - Enable/disable
dinner - Set dinner price - Save changes

When the schedule changes, do not silently overwrite existing daily
records. Offer: 1. Apply to future dates 2. Apply to selected dates 3.
Apply to the entire selected month

Recommended default: future dates only.

## 8. Phase 4 --- Generate monthly meal records

When a month is selected: 1. Determine its first and last dates. 2. Load
the weekly schedule. 3. Generate a daily meal record for each date using
its weekday configuration. 4. Insert only records that do not already
exist. 5. Preserve manually edited daily records.

Use an upsert or insert-on-conflict-do-nothing strategy. Opening a month
repeatedly must not create duplicate records or overwrite existing
edits.

## 9. Phase 5 --- Daily meal editing

When a calendar date is selected, display: - Date - Breakfast + lunch
enabled/disabled - Breakfast + lunch price - Dinner enabled/disabled -
Dinner price - Optional note

Saving updates only that date's `daily_meals` record. It must not modify
the weekly schedule or other dates.

## 10. Phase 6 --- Extra items

The Add Extra Item form should contain: - Item name - Date - Price -
Optional note

It must not contain quantity.

Implement: - Add item - View items for a selected date - Edit item name,
price, date, or note - Delete item

The daily extra-item total is the sum of each item's price.

## 11. Phase 7 --- Bill calculation

Create `src/utils/billCalculator.ts`.

Daily total:

``` typescript
type DailyMeal = {
  breakfastLunchEnabled: boolean;
  breakfastLunchPrice: number;
  dinnerEnabled: boolean;
  dinnerPrice: number;
};

type ExtraItem = {
  price: number;
};

export function calculateDailyTotal(
  meal: DailyMeal,
  extraItems: ExtraItem[]
): number {
  const breakfastLunch = meal.breakfastLunchEnabled
    ? meal.breakfastLunchPrice
    : 0;

  const dinner = meal.dinnerEnabled
    ? meal.dinnerPrice
    : 0;

  const extras = extraItems.reduce(
    (total, item) => total + item.price,
    0
  );

  return breakfastLunch + dinner + extras;
}
```

Monthly total is the sum of all daily totals for the selected month.

Pending amount:

``` typescript
export function calculatePendingAmount(
  totalBill: number,
  paidAmount: number
): number {
  return Math.max(0, totalBill - paidAmount);
}
```

Validate payment amounts against the outstanding balance. For reliable
financial arithmetic, use integer paise or a suitable decimal
representation rather than binary floating-point values.

## 12. Phase 8 --- Record transactions

The Record Transaction form should contain: - Bill month - Payment
date - Amount - Optional note

It must not contain Payment Method.

Payment flow: 1. Load the selected monthly bill. 2. Calculate current
pending amount. 3. Validate amount is greater than zero. 4. Validate
amount does not exceed pending. 5. Insert the payment record. 6. Update
paid amount. 7. Update pending amount. 8. Update status.

Use a PostgreSQL transaction or database function so inserting a payment
and updating the bill happen atomically.

Status: - `Paid` when pending amount is zero. - `Pending` when pending
amount is greater than zero.

Do not use a `Partial Paid` status.

## 13. Phase 9 --- Dashboard and history

Dashboard displays: - Selected month - Total bill - Paid amount -
Pending amount - Paid/Pending status - Today's meals - Extra expenses -
Recent transactions

Monthly history lets the user select previous months and inspect bills
and payments.

Never delete historical bill or payment records when creating a new
month.

## 14. Phase 10 --- Mobile UI and PWA

Desktop navigation: - Dashboard - Calendar - Schedule - Bills -
History - Settings

Mobile bottom navigation: - Home - Calendar - Bills - History

Make forms responsive and touch-friendly.

Then: 1. Add PWA manifest. 2. Configure application icons. 3. Configure
service worker. 4. Enable installation from browser. 5. Deploy to
Vercel. 6. Test on Android Chrome.

The first version can require internet connectivity for database
operations.

## 15. Testing checklist

### Schedule

-   Monday breakfast + lunch is off.
-   Monday dinner is ₹50.
-   Tuesday--Thursday are ₹120 per day.
-   Friday dinner is off.
-   Saturday and Sunday are off.
-   Monthly calculations account for actual calendar dates.

### Expenses

-   Adding chai increases the daily total.
-   Extra item form has no quantity.
-   Editing one date affects only that date.
-   Weekly schedule changes do not overwrite existing daily edits.

### Payments

-   Pending amount decreases after payment.
-   Pending becomes zero when fully paid.
-   Status changes to Paid when pending is zero.
-   Payment form has no payment method.
-   Multiple payments are supported.
-   Payment cannot exceed pending.
-   Historical payments remain available.

### Deployment

-   App works on mobile Chrome and desktop.
-   User can log in and access their own records.
-   RLS protects database records.
-   App is accessible through an HTTPS URL.

## 16. Recommended implementation order

1.  Initialize React, TypeScript, Tailwind, and Supabase.
2.  Create database tables and RLS policies.
3.  Implement weekly schedule configuration.
4.  Implement monthly date generation.
5.  Implement daily meal editing.
6.  Implement extra-item CRUD without quantity.
7.  Implement bill calculations.
8.  Implement transaction recording without payment method.
9.  Implement pending amount and Paid/Pending status.
10. Implement dashboard and historical bills.
11. Make the app responsive and installable.
12. Deploy and test on mobile.

## 17. Acceptance criteria

The application is complete when: - Default weekly schedule is applied
automatically. - Any individual date can be edited. - Weekly schedule
can be changed. - Extra items have name and price, with no quantity. -
Expenses and monthly bills calculate automatically. - Dashboard shows
total bill, paid amount, and pending amount. - Record Transaction has no
payment method. - Multiple payments are supported. - Paid bills remain
in historical records. - App is accessible online from mobile. -
Authentication and RLS protect personal records.

**First milestone:** Complete the database, weekly schedule, monthly
calendar, and daily meal editing. Then implement extra items, billing,
and payments on top of the stable expense calculation system.

## 18. Files created and modified

Note: Configured .gitignore and vercel.json for Git repository pushing and SPA routing on Vercel.

1. `.gitignore`
2. `vercel.json`
3. `package.json`
2. `tsconfig.json`
3. `vite.config.ts`
4. `index.html`
5. `.env.example`
6. `.env.local`
7. `public/manifest.json`
8. `public/icon.svg`
9. `supabase/schema.sql`
10. `src/main.tsx`
11. `src/App.tsx`
12. `src/index.css`
13. `src/vite-env.d.ts`
14. `src/types/index.ts`
15. `src/services/supabase.ts`
16. `src/services/scheduleService.ts`
17. `src/services/mealService.ts`
18. `src/services/extraItemService.ts`
19. `src/services/billService.ts`
20. `src/services/paymentService.ts`
21. `src/utils/dateUtils.ts`
22. `src/utils/billCalculator.ts`
23. `src/hooks/useWeeklySchedule.ts`
24. `src/hooks/useMonthlyData.ts`
25. `src/components/layout/Navbar.tsx`
26. `src/components/layout/BottomNav.tsx`
27. `src/components/dashboard/StatCards.tsx`
28. `src/components/dashboard/RecentTransactions.tsx`
29. `src/components/calendar/CalendarView.tsx`
30. `src/components/calendar/DayCell.tsx`
31. `src/components/forms/DailyMealModal.tsx`
32. `src/components/forms/ExtraItemModal.tsx`
33. `src/components/forms/RecordTransactionModal.tsx`
34. `src/components/history/PaymentHistoryList.tsx`
35. `src/pages/DashboardPage.tsx`
36. `src/pages/CalendarPage.tsx`
37. `src/pages/SchedulePage.tsx`
38. `src/pages/HistoryPage.tsx`

