-- Security definer function to check if current user has editor access to a field
-- Returns true if user is field owner or has editor role as collaborator
create or replace function public.has_field_editor_access(field_uuid uuid)
returns boolean as $$
begin
  -- Validate input parameter
  if field_uuid is null then
    return false;
  end if;
  
  return exists (
    select 1 from public.fields f
    where f.id = field_uuid
    and f.owner_id = auth.uid()
  ) or exists (
    select 1 from public.field_collaborators fc
    where fc.field_id = field_uuid
    and fc.user_id = auth.uid()
    and fc.role = 'editor'
  );
end;
$$ language plpgsql security definer stable set search_path = '';

-- Security definer function to check if current user has any access to a field
-- Returns true if user is field owner or has any collaborator role
create or replace function public.has_field_access(field_uuid uuid)
returns boolean as $$
begin
  -- Validate input parameter
  if field_uuid is null then
    return false;
  end if;
  
  return exists (
    select 1 from public.fields f
    where f.id = field_uuid
    and f.owner_id = auth.uid()
  ) or exists (
    select 1 from public.field_collaborators fc
    where fc.field_id = field_uuid
    and fc.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable set search_path = '';

-- Security definer function to check if current user is the owner of a field
-- Returns true if user is the field owner
create or replace function public.is_field_owner(field_uuid uuid)
returns boolean as $$
begin
  -- Validate input parameter
  if field_uuid is null then
    return false;
  end if;
  
  return exists (
    select 1 from public.fields f
    where f.id = field_uuid
    and f.owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable set search_path = '';

-- Security definer function to check if a field is public
-- Returns true if the field has is_public = true
create or replace function public.is_field_public(field_uuid uuid)
returns boolean as $$
begin
  -- Validate input parameter
  if field_uuid is null then
    return false;
  end if;
  
  return exists (
    select 1 from public.fields f
    where f.id = field_uuid
    and f.is_public = true
  );
end;
$$ language plpgsql security definer stable set search_path = '';
