-- Row Level Security Policies
-- Numbered 99_ to run after all table definitions

-- ============================================================================
-- FIELDS POLICIES
-- ============================================================================

-- Enable RLS on fields
alter table "public"."fields" enable row level security;

-- Public fields are viewable by everyone
create policy "Public fields are viewable by all" on "public"."fields"
  for select using (is_public = true);

-- Owners can view, update, and delete their fields
create policy "Owners can manage their fields" on "public"."fields"
  for all using (auth.uid() = owner_id);

-- Collaborators can view fields they have access to
create policy "Collaborators can view accessible fields" on "public"."fields"
  for select using (
    exists (
      select 1 from public.field_collaborators fc
      where fc.field_id = fields.id
      and fc.user_id = auth.uid()
    )
  );

-- Users can create new fields
create policy "Users can create fields" on "public"."fields"
  for insert with check (auth.uid() = owner_id);

-- ============================================================================
-- FIELD_COLLABORATORS POLICIES
-- ============================================================================

-- Enable RLS on field_collaborators
alter table "public"."field_collaborators" enable row level security;

-- Field owners can manage collaborators
create policy "Field owners can manage collaborators" on "public"."field_collaborators"
  for all using (
    exists (
      select 1 from public.fields f
      where f.id = field_id
      and f.owner_id = auth.uid()
    )
  );

-- Users can view their own collaborator records
create policy "Users can view their collaborations" on "public"."field_collaborators"
  for select using (auth.uid() = user_id);

-- Collaborators can view other collaborators on the same field
create policy "Collaborators can view field team" on "public"."field_collaborators"
  for select using (
    exists (
      select 1 from public.field_collaborators fc
      where fc.field_id = field_collaborators.field_id
      and fc.user_id = auth.uid()
    )
  );

-- ============================================================================
-- EMITTERS POLICIES
-- ============================================================================

-- Enable RLS on emitters
alter table "public"."emitters" enable row level security;

-- Anyone can view emitters in public fields
create policy "Public field emitters are viewable" on "public"."emitters"
  for select using (
    exists (
      select 1 from public.fields f
      where f.id = field_id
      and f.is_public = true
    )
  );

-- Field owners can manage all emitters in their fields
create policy "Field owners can manage emitters" on "public"."emitters"
  for all using (
    exists (
      select 1 from public.fields f
      where f.id = field_id
      and f.owner_id = auth.uid()
    )
  );

-- Collaborators with editor role can create/update/delete emitters
create policy "Editors can manage emitters" on "public"."emitters"
  for all using (
    exists (
      select 1 from public.field_collaborators fc
      where fc.field_id = emitters.field_id
      and fc.user_id = auth.uid()
      and fc.role = 'editor'
    )
  );

-- Collaborators with viewer role can only view emitters
create policy "Viewers can view emitters" on "public"."emitters"
  for select using (
    exists (
      select 1 from public.field_collaborators fc
      where fc.field_id = emitters.field_id
      and fc.user_id = auth.uid()
    )
  );
