-- create table for weekly recurring schedule
create table if not exists weekly_schedule (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    day_of_week integer not null check (day_of_week between 0 and 6),
    breakfast_lunch_enabled boolean not null default false,
    breakfast_lunch_price numeric(10,2) not null default 0,
    dinner_enabled boolean not null default false,
    dinner_price numeric(10,2) not null default 0,
    unique(user_id, day_of_week)
);

-- create table for daily meal records
create table if not exists daily_meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    meal_date date not null,
    breakfast_lunch_enabled boolean not null default false,
    breakfast_lunch_price numeric(10,2) not null default 0,
    dinner_enabled boolean not null default false,
    dinner_price numeric(10,2) not null default 0,
    note text,
    unique(user_id, meal_date)
);

-- create table for extra item expenses without quantity
create table if not exists extra_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    item_date date not null,
    item_name text not null,
    price numeric(10,2) not null check (price >= 0),
    note text,
    created_at timestamptz default now()
);

-- create table for reusable item categories
create table if not exists item_categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null
);

-- create table for bills defined by from date and to date
create table if not exists bills (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    from_date date not null,
    to_date date not null,
    title text,
    total_amount numeric(10,2) not null default 0,
    paid_amount numeric(10,2) not null default 0,
    pending_amount numeric(10,2) not null default 0,
    status text not null default 'Pending' check (status in ('Pending', 'Paid')),
    created_at timestamptz default now(),
    check (to_date >= from_date),
    unique(user_id, from_date, to_date)
);

-- create table for payment transactions without payment method
create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    bill_id uuid not null references bills(id) on delete cascade,
    payment_date date not null,
    amount numeric(10,2) not null check (amount > 0),
    note text,
    from_date date,
    to_date date,
    created_at timestamptz default now()
);

-- function to recalculate bill payment aggregates
create or replace function update_bill_totals_on_payment()
returns trigger as $$
declare
    v_total_paid numeric(10,2);
    v_bill_total numeric(10,2);
    v_pending numeric(10,2);
    v_target_bill_id uuid;
begin
    if TG_OP = 'DELETE' then
        v_target_bill_id := OLD.bill_id;
    else
        v_target_bill_id := NEW.bill_id;
    end if;

    select coalesce(sum(amount), 0) into v_total_paid
    from payments
    where bill_id = v_target_bill_id;

    select total_amount into v_bill_total
    from bills
    where id = v_target_bill_id;

    v_pending := greatest(0, coalesce(v_bill_total, 0) - v_total_paid);

    update bills
    set paid_amount = v_total_paid,
        pending_amount = v_pending,
        status = case when v_pending = 0 then 'Paid' else 'Pending' end
    where id = v_target_bill_id;

    return null;
end;
$$ language plpgsql;

-- trigger for payment changes
drop trigger if exists trg_payments_update_bill on payments;
create trigger trg_payments_update_bill
after insert or update or delete on payments
for each row
execute function update_bill_totals_on_payment();

-- enable row level security on all tables
alter table weekly_schedule enable row level security;
alter table daily_meals enable row level security;
alter table extra_items enable row level security;
alter table item_categories enable row level security;
alter table bills enable row level security;
alter table payments enable row level security;

-- row level security policies
create policy "users access own weekly schedule" on weekly_schedule
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users access own daily meals" on daily_meals
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users access own extra items" on extra_items
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users access own item categories" on item_categories
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users access own bills" on bills
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users access own payments" on payments
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
