-- Field collaborators table
-- Manages user permissions for field access
create type "public"."collaborator_role" as enum ('viewer', 'editor');

create table "public"."field_collaborators" (
  "id" uuid default gen_random_uuid() primary key,
  "field_id" uuid not null references public.fields(id) on delete cascade,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "role" collaborator_role not null default 'viewer',
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  unique (field_id, user_id)
);

-- Enable RLS on field_collaborators
alter table "public"."field_collaborators" enable row level security;

-- Trigger to update timestamp
create trigger update_field_collaborators_updated_at before update on "public"."field_collaborators"
  for each row execute procedure moddatetime(updated_at);

-- Indexes for performance
create index field_collaborators_field_id_idx on "public"."field_collaborators" (field_id);
create index field_collaborators_user_id_idx on "public"."field_collaborators" (user_id);
