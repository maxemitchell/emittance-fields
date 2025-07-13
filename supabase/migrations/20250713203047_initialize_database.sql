create extension if not exists "moddatetime" with schema "extensions";


create type "public"."collaborator_role" as enum ('viewer', 'editor');

create table "public"."emitters" (
    "id" uuid not null default gen_random_uuid(),
    "field_id" uuid not null,
    "x" integer not null,
    "y" integer not null,
    "color" text not null default '#ffffff'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."emitters" enable row level security;

create table "public"."field_collaborators" (
    "id" uuid not null default gen_random_uuid(),
    "field_id" uuid not null,
    "user_id" uuid not null,
    "role" collaborator_role not null default 'viewer'::collaborator_role,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."field_collaborators" enable row level security;

create table "public"."fields" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "width" integer not null,
    "height" integer not null,
    "background_color" text not null default '#000000'::text,
    "is_public" boolean not null default false,
    "owner_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."fields" enable row level security;

CREATE INDEX emitters_field_id_idx ON public.emitters USING btree (field_id);

CREATE UNIQUE INDEX emitters_pkey ON public.emitters USING btree (id);

CREATE INDEX field_collaborators_field_id_idx ON public.field_collaborators USING btree (field_id);

CREATE UNIQUE INDEX field_collaborators_field_id_user_id_key ON public.field_collaborators USING btree (field_id, user_id);

CREATE UNIQUE INDEX field_collaborators_pkey ON public.field_collaborators USING btree (id);

CREATE INDEX field_collaborators_user_id_idx ON public.field_collaborators USING btree (user_id);

CREATE INDEX fields_is_public_idx ON public.fields USING btree (is_public);

CREATE INDEX fields_owner_id_idx ON public.fields USING btree (owner_id);

CREATE UNIQUE INDEX fields_pkey ON public.fields USING btree (id);

alter table "public"."emitters" add constraint "emitters_pkey" PRIMARY KEY using index "emitters_pkey";

alter table "public"."field_collaborators" add constraint "field_collaborators_pkey" PRIMARY KEY using index "field_collaborators_pkey";

alter table "public"."fields" add constraint "fields_pkey" PRIMARY KEY using index "fields_pkey";

alter table "public"."emitters" add constraint "emitters_check" CHECK (((x >= 0) AND (y >= 0))) not valid;

alter table "public"."emitters" validate constraint "emitters_check";

alter table "public"."emitters" add constraint "emitters_color_check" CHECK ((color ~ '^#[0-9A-Fa-f]{6}$'::text)) not valid;

alter table "public"."emitters" validate constraint "emitters_color_check";

alter table "public"."emitters" add constraint "emitters_field_id_fkey" FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE not valid;

alter table "public"."emitters" validate constraint "emitters_field_id_fkey";

alter table "public"."emitters" add constraint "emitters_x_check" CHECK ((x > 0)) not valid;

alter table "public"."emitters" validate constraint "emitters_x_check";

alter table "public"."emitters" add constraint "emitters_y_check" CHECK ((y > 0)) not valid;

alter table "public"."emitters" validate constraint "emitters_y_check";

alter table "public"."field_collaborators" add constraint "field_collaborators_field_id_fkey" FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE not valid;

alter table "public"."field_collaborators" validate constraint "field_collaborators_field_id_fkey";

alter table "public"."field_collaborators" add constraint "field_collaborators_field_id_user_id_key" UNIQUE using index "field_collaborators_field_id_user_id_key";

alter table "public"."field_collaborators" add constraint "field_collaborators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."field_collaborators" validate constraint "field_collaborators_user_id_fkey";

alter table "public"."fields" add constraint "fields_height_check" CHECK (((height > 0) AND (height <= 1000))) not valid;

alter table "public"."fields" validate constraint "fields_height_check";

alter table "public"."fields" add constraint "fields_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."fields" validate constraint "fields_owner_id_fkey";

alter table "public"."fields" add constraint "fields_width_check" CHECK (((width > 0) AND (width <= 1000))) not valid;

alter table "public"."fields" validate constraint "fields_width_check";

grant delete on table "public"."emitters" to "anon";

grant insert on table "public"."emitters" to "anon";

grant references on table "public"."emitters" to "anon";

grant select on table "public"."emitters" to "anon";

grant trigger on table "public"."emitters" to "anon";

grant truncate on table "public"."emitters" to "anon";

grant update on table "public"."emitters" to "anon";

grant delete on table "public"."emitters" to "authenticated";

grant insert on table "public"."emitters" to "authenticated";

grant references on table "public"."emitters" to "authenticated";

grant select on table "public"."emitters" to "authenticated";

grant trigger on table "public"."emitters" to "authenticated";

grant truncate on table "public"."emitters" to "authenticated";

grant update on table "public"."emitters" to "authenticated";

grant delete on table "public"."emitters" to "service_role";

grant insert on table "public"."emitters" to "service_role";

grant references on table "public"."emitters" to "service_role";

grant select on table "public"."emitters" to "service_role";

grant trigger on table "public"."emitters" to "service_role";

grant truncate on table "public"."emitters" to "service_role";

grant update on table "public"."emitters" to "service_role";

grant delete on table "public"."field_collaborators" to "anon";

grant insert on table "public"."field_collaborators" to "anon";

grant references on table "public"."field_collaborators" to "anon";

grant select on table "public"."field_collaborators" to "anon";

grant trigger on table "public"."field_collaborators" to "anon";

grant truncate on table "public"."field_collaborators" to "anon";

grant update on table "public"."field_collaborators" to "anon";

grant delete on table "public"."field_collaborators" to "authenticated";

grant insert on table "public"."field_collaborators" to "authenticated";

grant references on table "public"."field_collaborators" to "authenticated";

grant select on table "public"."field_collaborators" to "authenticated";

grant trigger on table "public"."field_collaborators" to "authenticated";

grant truncate on table "public"."field_collaborators" to "authenticated";

grant update on table "public"."field_collaborators" to "authenticated";

grant delete on table "public"."field_collaborators" to "service_role";

grant insert on table "public"."field_collaborators" to "service_role";

grant references on table "public"."field_collaborators" to "service_role";

grant select on table "public"."field_collaborators" to "service_role";

grant trigger on table "public"."field_collaborators" to "service_role";

grant truncate on table "public"."field_collaborators" to "service_role";

grant update on table "public"."field_collaborators" to "service_role";

grant delete on table "public"."fields" to "anon";

grant insert on table "public"."fields" to "anon";

grant references on table "public"."fields" to "anon";

grant select on table "public"."fields" to "anon";

grant trigger on table "public"."fields" to "anon";

grant truncate on table "public"."fields" to "anon";

grant update on table "public"."fields" to "anon";

grant delete on table "public"."fields" to "authenticated";

grant insert on table "public"."fields" to "authenticated";

grant references on table "public"."fields" to "authenticated";

grant select on table "public"."fields" to "authenticated";

grant trigger on table "public"."fields" to "authenticated";

grant truncate on table "public"."fields" to "authenticated";

grant update on table "public"."fields" to "authenticated";

grant delete on table "public"."fields" to "service_role";

grant insert on table "public"."fields" to "service_role";

grant references on table "public"."fields" to "service_role";

grant select on table "public"."fields" to "service_role";

grant trigger on table "public"."fields" to "service_role";

grant truncate on table "public"."fields" to "service_role";

grant update on table "public"."fields" to "service_role";

create policy "Editors can manage emitters"
on "public"."emitters"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM field_collaborators fc
  WHERE ((fc.field_id = emitters.field_id) AND (fc.user_id = auth.uid()) AND (fc.role = 'editor'::collaborator_role)))));


create policy "Field owners can manage emitters"
on "public"."emitters"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM fields f
  WHERE ((f.id = emitters.field_id) AND (f.owner_id = auth.uid())))));


create policy "Public field emitters are viewable"
on "public"."emitters"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM fields f
  WHERE ((f.id = emitters.field_id) AND (f.is_public = true)))));


create policy "Viewers can view emitters"
on "public"."emitters"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM field_collaborators fc
  WHERE ((fc.field_id = emitters.field_id) AND (fc.user_id = auth.uid())))));


create policy "Collaborators can view field team"
on "public"."field_collaborators"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM field_collaborators fc
  WHERE ((fc.field_id = field_collaborators.field_id) AND (fc.user_id = auth.uid())))));


create policy "Field owners can manage collaborators"
on "public"."field_collaborators"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM fields f
  WHERE ((f.id = field_collaborators.field_id) AND (f.owner_id = auth.uid())))));


create policy "Users can view their collaborations"
on "public"."field_collaborators"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Collaborators can view accessible fields"
on "public"."fields"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM field_collaborators fc
  WHERE ((fc.field_id = fields.id) AND (fc.user_id = auth.uid())))));


create policy "Owners can manage their fields"
on "public"."fields"
as permissive
for all
to public
using ((auth.uid() = owner_id));


create policy "Public fields are viewable by all"
on "public"."fields"
as permissive
for select
to public
using ((is_public = true));


create policy "Users can create fields"
on "public"."fields"
as permissive
for insert
to public
with check ((auth.uid() = owner_id));


CREATE TRIGGER update_emitters_updated_at BEFORE UPDATE ON public.emitters FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER update_field_collaborators_updated_at BEFORE UPDATE ON public.field_collaborators FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');


