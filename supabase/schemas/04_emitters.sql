-- Emitters table
-- Represents static points that emit particles/pixels in fields
create table "public"."emitters" (
  "id" uuid default gen_random_uuid() primary key,
  "field_id" uuid not null references public.fields(id) on delete cascade,
  "x" integer not null check (x > 0),
  "y" integer not null check (y > 0),
  "color" text not null default '#ffffff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  check (x >= 0 and y >= 0 )
);



-- Trigger to update timestamp
create trigger update_emitters_updated_at before update on "public"."emitters"
  for each row execute procedure moddatetime(updated_at);

-- Indexes for performance
create index emitters_field_id_idx on "public"."emitters" (field_id);
