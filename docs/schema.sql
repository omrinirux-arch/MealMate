-- MealMate database schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Households
create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- Household members (users join households)
create table public.household_members (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Staple items (always-on-hand ingredients)
create table public.staple_items (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  category text check (category in ('oils','spices','grains','canned','condiments','frozen','dairy_basics','other')),
  created_at timestamptz not null default now()
);

-- Migration (run if table already exists without category column):
-- alter table public.staple_items
--   add column if not exists category text
--   check (category in ('oils','spices','grains','canned','condiments','frozen','dairy_basics','other'));

-- Kitchen tools
create table public.kitchen_tools (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Household preferences
create table public.household_preferences (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade unique,
  dietary_goals text[] not null default '{}',
  recipe_style text[] not null default '{}',
  spice_tolerance text not null default 'medium' check (spice_tolerance in ('none', 'mild', 'medium', 'hot')),
  -- Migration (run if table already exists):
  -- alter table public.household_preferences drop constraint if exists household_preferences_spice_tolerance_check;
  -- alter table public.household_preferences add constraint household_preferences_spice_tolerance_check
  --   check (spice_tolerance in ('none', 'mild', 'medium', 'hot'));
  exclusions text[] not null default '{}',
  servings integer not null default 4,
  updated_at timestamptz not null default now()
);

-- Meal plans
create table public.meal_plans (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_at timestamptz not null default now()
);

-- On-hand items (per plan)
create table public.on_hand_items (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Meal plan days (7 rows per plan, option_a/b are JSONB recipe objects)
create table public.meal_plan_days (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  day_index integer not null check (day_index between 0 and 6),
  option_a jsonb,
  option_b jsonb,
  selected_option text check (selected_option in ('a', 'b', 'skip')),
  created_at timestamptz not null default now(),
  unique (meal_plan_id, day_index)
);

-- Recipe ratings (written when plan is confirmed)
create table public.recipe_ratings (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_url text not null,
  recipe_title text not null,
  rating text check (rating in ('up', 'down')),
  cooked_at date not null,
  created_at timestamptz not null default now(),
  unique (household_id, recipe_url, cooked_at)
);

-- Grocery lists
create table public.grocery_lists (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

-- Grocery items
create table public.grocery_items (
  id uuid primary key default uuid_generate_v4(),
  grocery_list_id uuid not null references public.grocery_lists(id) on delete cascade,
  name text not null,
  quantity text not null default '',
  unit text not null default '',
  aisle text not null default 'Other',
  is_checked boolean not null default false,
  is_manual boolean not null default false,
  source_recipe_title text,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.staple_items enable row level security;
alter table public.kitchen_tools enable row level security;
alter table public.household_preferences enable row level security;
alter table public.meal_plans enable row level security;
alter table public.on_hand_items enable row level security;
alter table public.meal_plan_days enable row level security;
alter table public.recipe_ratings enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;

-- Helper function: returns household_id for the authenticated user
create or replace function public.my_household_id()
returns uuid language sql security definer stable as $$
  select household_id from public.household_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Households: any authed user can create; members can read; admin can update
create policy "authenticated users can create household" on public.households
  for insert with check (auth.uid() is not null);

create policy "household members can view" on public.households
  for select using (id = public.my_household_id());

create policy "household members can update name" on public.households
  for update using (
    exists (
      select 1 from public.household_members
      where household_id = id and user_id = auth.uid() and role = 'admin'
    )
  );

-- Household members
create policy "members can view own household members" on public.household_members
  for select using (household_id = public.my_household_id());

create policy "users can insert themselves" on public.household_members
  for insert with check (user_id = auth.uid());

-- Generic household-scoped policy factory for remaining tables
create policy "household scoped select" on public.staple_items
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.staple_items
  for insert with check (household_id = public.my_household_id());
create policy "household scoped update" on public.staple_items
  for update using (household_id = public.my_household_id());
create policy "household scoped delete" on public.staple_items
  for delete using (household_id = public.my_household_id());

create policy "household scoped select" on public.kitchen_tools
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.kitchen_tools
  for insert with check (household_id = public.my_household_id());
create policy "household scoped update" on public.kitchen_tools
  for update using (household_id = public.my_household_id());
create policy "household scoped delete" on public.kitchen_tools
  for delete using (household_id = public.my_household_id());

create policy "household scoped select" on public.household_preferences
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.household_preferences
  for insert with check (household_id = public.my_household_id());
create policy "household scoped update" on public.household_preferences
  for update using (household_id = public.my_household_id());

create policy "household scoped select" on public.meal_plans
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.meal_plans
  for insert with check (household_id = public.my_household_id());
create policy "household scoped update" on public.meal_plans
  for update using (household_id = public.my_household_id());

create policy "household scoped select" on public.on_hand_items
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.on_hand_items
  for insert with check (household_id = public.my_household_id());
create policy "household scoped delete" on public.on_hand_items
  for delete using (household_id = public.my_household_id());

create policy "meal plan days select" on public.meal_plan_days
  for select using (
    meal_plan_id in (
      select id from public.meal_plans where household_id = public.my_household_id()
    )
  );
create policy "meal plan days insert" on public.meal_plan_days
  for insert with check (
    meal_plan_id in (
      select id from public.meal_plans where household_id = public.my_household_id()
    )
  );
create policy "meal plan days update" on public.meal_plan_days
  for update using (
    meal_plan_id in (
      select id from public.meal_plans where household_id = public.my_household_id()
    )
  );

create policy "household scoped select" on public.recipe_ratings
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.recipe_ratings
  for insert with check (household_id = public.my_household_id());
create policy "household scoped update" on public.recipe_ratings
  for update using (household_id = public.my_household_id());

create policy "household scoped select" on public.grocery_lists
  for select using (household_id = public.my_household_id());
create policy "household scoped insert" on public.grocery_lists
  for insert with check (household_id = public.my_household_id());

create policy "grocery items select" on public.grocery_items
  for select using (
    grocery_list_id in (
      select id from public.grocery_lists where household_id = public.my_household_id()
    )
  );
create policy "grocery items insert" on public.grocery_items
  for insert with check (
    grocery_list_id in (
      select id from public.grocery_lists where household_id = public.my_household_id()
    )
  );
create policy "grocery items update" on public.grocery_items
  for update using (
    grocery_list_id in (
      select id from public.grocery_lists where household_id = public.my_household_id()
    )
  );
create policy "grocery items delete" on public.grocery_items
  for delete using (
    grocery_list_id in (
      select id from public.grocery_lists where household_id = public.my_household_id()
    )
  );
