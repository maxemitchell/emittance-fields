-- Fields table
-- Represents canvas areas where emitters can be placed
create table "public"."fields" (
  "id" uuid default gen_random_uuid() primary key,
  "name" text not null,
  "description" text,
  "width" integer not null check (width > 0 and width <= 1000),
  "height" integer not null check (height > 0 and height <= 1000),
  "background_color" text default '#000000' not null,
  "is_public" boolean default false not null,
  "owner_id" uuid not null references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);


-- Trigger to update timestamp on field updates
create trigger update_fields_updated_at before update on "public"."fields"
  for each row execute procedure moddatetime(updated_at);


-- Index for performance
create index fields_owner_id_idx on "public"."fields" (owner_id);
create index fields_is_public_idx on "public"."fields" (is_public);
