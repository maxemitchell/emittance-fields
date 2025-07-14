-- ============================================================================
-- FIELDS POLICIES
-- ============================================================================

-- Public fields are viewable by everyone
create policy "Public fields are viewable by all" on "public"."fields"
  for select
  to public
  using (is_public = true);

-- Owners can view, update, and delete their fields
create policy "Owners can manage their fields" on "public"."fields"
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Collaborators can view fields they have access to
create policy "Collaborators can view accessible fields" on "public"."fields"
  for select
  to authenticated
  using ( 
    public.has_field_access(id)
  );

-- Collaborators with editor role can update fields they have access to
create policy "Editors can update accessible fields" on "public"."fields"
  for update
  to authenticated
  using ( 
    public.has_field_editor_access(id)
  )
  with check (
    public.has_field_editor_access(id)
  );

-- Users can create new fields (must be the owner)
create policy "Users can create fields" on "public"."fields"
  for insert
  with check (auth.uid() = owner_id);

-- ============================================================================
-- FIELD_COLLABORATORS POLICIES
-- ============================================================================

-- Field owners can manage collaborators
create policy "Field owners can manage collaborators" on "public"."field_collaborators"
  for all
  to authenticated
  using (
    public.is_field_owner(field_id)
  )
  with check (
    public.is_field_owner(field_id)
  );

-- Users can view their own collaborator records
create policy "Users can view their collaborations" on "public"."field_collaborators"
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Collaborators can view other collaborators on the same field
create policy "Collaborators can view other collaborators" on "public"."field_collaborators"
  for select
  to authenticated
  using (
    public.has_field_access(field_id)
  );

-- Anyone can view collaborators on public fields
create policy "View collaborators on public fields" on "public"."field_collaborators"
  for select
  to authenticated
  using (
    public.is_field_public(field_id)
  );

-- ============================================================================
-- EMITTERS POLICIES
-- ============================================================================

-- Anyone can view emitters in public fields
create policy "Public field emitters are viewable" on "public"."emitters"
  for select
  to authenticated
  using (
    public.is_field_public(field_id)
  );

-- Field owners can manage all emitters in their fields
create policy "Field owners can manage emitters" on "public"."emitters"
  for all
  to authenticated
  using (
    public.is_field_owner(field_id)
  )
  with check (
    public.is_field_owner(field_id)
  );

-- Collaborators with editor role can create/update/delete emitters
create policy "Editors can manage emitters" on "public"."emitters"
  for all
  to authenticated
  using (
    public.has_field_editor_access(field_id)
  )
  with check (
    public.has_field_editor_access(field_id)
  );

-- Collaborators with viewer role can only view emitters
create policy "Viewers can view emitters" on "public"."emitters"
  for select
  to authenticated
  using (
    public.has_field_access(field_id)
  );
