alter table "public"."emitters" drop constraint "emitters_x_check";

alter table "public"."emitters" drop constraint "emitters_y_check";

CREATE UNIQUE INDEX fields_owner_id_name_key ON public.fields USING btree (owner_id, name);

alter table "public"."fields" add constraint "fields_owner_id_name_key" UNIQUE using index "fields_owner_id_name_key";

alter table "public"."emitters" add constraint "emitters_x_check" CHECK ((x >= 0)) not valid;

alter table "public"."emitters" validate constraint "emitters_x_check";

alter table "public"."emitters" add constraint "emitters_y_check" CHECK ((y >= 0)) not valid;

alter table "public"."emitters" validate constraint "emitters_y_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.enforce_max_emitters_per_field()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.validate_emitter_coordinates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE TRIGGER enforce_max_emitters_per_field_trigger BEFORE INSERT ON public.emitters FOR EACH ROW EXECUTE FUNCTION enforce_max_emitters_per_field();

CREATE TRIGGER validate_emitter_coordinates_trigger BEFORE INSERT OR UPDATE ON public.emitters FOR EACH ROW EXECUTE FUNCTION validate_emitter_coordinates();

set check_function_bodies = on;
