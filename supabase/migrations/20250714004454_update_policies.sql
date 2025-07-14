drop policy "Collaborators can view field team" on "public"."field_collaborators";

drop policy "Editors can manage emitters" on "public"."emitters";

drop policy "Field owners can manage emitters" on "public"."emitters";

drop policy "Public field emitters are viewable" on "public"."emitters";

drop policy "Viewers can view emitters" on "public"."emitters";

drop policy "Field owners can manage collaborators" on "public"."field_collaborators";

drop policy "Users can view their collaborations" on "public"."field_collaborators";

drop policy "Collaborators can view accessible fields" on "public"."fields";

drop policy "Owners can manage their fields" on "public"."fields";

CREATE OR REPLACE FUNCTION public.has_field_access(field_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.has_field_editor_access(field_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_field_owner(field_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_field_public(field_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

create policy "Collaborators can view other collaborators"
on "public"."field_collaborators"
as permissive
for select
to authenticated
using (has_field_access(field_id));


create policy "View collaborators on public fields"
on "public"."field_collaborators"
as permissive
for select
to authenticated
using (is_field_public(field_id));


create policy "Editors can update accessible fields"
on "public"."fields"
as permissive
for update
to authenticated
using (has_field_editor_access(id))
with check (has_field_editor_access(id));


create policy "Editors can manage emitters"
on "public"."emitters"
as permissive
for all
to authenticated
using (has_field_editor_access(field_id))
with check (has_field_editor_access(field_id));


create policy "Field owners can manage emitters"
on "public"."emitters"
as permissive
for all
to authenticated
using (is_field_owner(field_id))
with check (is_field_owner(field_id));


create policy "Public field emitters are viewable"
on "public"."emitters"
as permissive
for select
to authenticated
using (is_field_public(field_id));


create policy "Viewers can view emitters"
on "public"."emitters"
as permissive
for select
to authenticated
using (has_field_access(field_id));


create policy "Field owners can manage collaborators"
on "public"."field_collaborators"
as permissive
for all
to authenticated
using (is_field_owner(field_id))
with check (is_field_owner(field_id));


create policy "Users can view their collaborations"
on "public"."field_collaborators"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Collaborators can view accessible fields"
on "public"."fields"
as permissive
for select
to authenticated
using (has_field_access(id));


create policy "Owners can manage their fields"
on "public"."fields"
as permissive
for all
to authenticated
using ((auth.uid() = owner_id))
with check ((auth.uid() = owner_id));



