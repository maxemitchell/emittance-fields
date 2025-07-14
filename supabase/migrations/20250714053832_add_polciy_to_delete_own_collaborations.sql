create policy "Users can delete their own collaborations"
on "public"."field_collaborators"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));



