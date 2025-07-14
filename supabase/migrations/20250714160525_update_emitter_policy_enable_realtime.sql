drop policy "Public field emitters are viewable" on "public"."emitters";

create policy "Public field emitters are viewable"
on "public"."emitters"
as permissive
for select
to public
using (is_field_public(field_id));

alter publication supabase_realtime add table "public"."emitters";

