-- Emitters table
-- Represents static points that emit particles/pixels in fields
create table "public"."emitters" (
  "id" uuid default gen_random_uuid() primary key,
  "field_id" uuid not null references public.fields(id) on delete cascade,
  "x" integer not null check (x >= 0),
  "y" integer not null check (y >= 0),
  "color" text not null default '#ffffff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  -- Ensure coordinates are within field boundaries
  check (x >= 0 and y >= 0)
);

-- Enable RLS on emitters
alter table "public"."emitters" enable row level security;

-- Enable Realtime on emitters
alter publication supabase_realtime add table "public"."emitters";

-- Trigger to update timestamp
create trigger update_emitters_updated_at before update on "public"."emitters"
  for each row execute procedure moddatetime(updated_at);

-- Indexes for performance
create index emitters_field_id_idx on "public"."emitters" (field_id);

-- Function to validate emitter coordinates are within field boundaries
create or replace function validate_emitter_coordinates()
returns trigger as $$
begin
  -- Check if coordinates are within field boundaries
  if exists (
    select 1 from public.fields 
    where id = NEW.field_id 
    and (NEW.x >= width or NEW.y >= height)
  ) then
    raise exception 'Emitter coordinates must be within field boundaries';
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger to validate emitter coordinates
create trigger validate_emitter_coordinates_trigger
  before insert or update on public.emitters
  for each row execute function validate_emitter_coordinates();

-- Function to enforce maximum emitters per field
create or replace function enforce_max_emitters_per_field()
returns trigger as $$
begin
  -- Check if adding this emitter would exceed the limit
  if (
    select count(*) + 1 from public.emitters 
    where field_id = NEW.field_id
  ) > 10000 then
    raise exception 'Maximum 10,000 emitters allowed per field';
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger to enforce maximum emitters per field
create trigger enforce_max_emitters_per_field_trigger
  before insert on public.emitters
  for each row execute function enforce_max_emitters_per_field();
