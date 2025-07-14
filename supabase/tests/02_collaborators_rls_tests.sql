begin;

-- Start transaction and declare test plan
select plan(31);

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test users using the proper helper function
select tests.create_supabase_user('alice@test.com');   -- Field owner
select tests.create_supabase_user('bob@test.com');     -- Editor collaborator
select tests.create_supabase_user('carol@test.com');   -- Viewer collaborator
select tests.create_supabase_user('dave@test.com');    -- Unauthorized user
select tests.create_supabase_user('eve@test.com');     -- Additional user

-- Create test fields (using service role to bypass RLS)
insert into public.fields (id, name, description, width, height, is_public, owner_id) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Private Field', 'Private field owned by Alice', 100, 100, false, tests.get_supabase_uid('alice@test.com')),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Private Field', 'Private field owned by Bob', 200, 200, false, tests.get_supabase_uid('bob@test.com')),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alice Public Field', 'Public field owned by Alice', 150, 150, true, tests.get_supabase_uid('alice@test.com'));

-- Create collaborator relationships (using service role to bypass RLS)
insert into public.field_collaborators (field_id, user_id, role) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', tests.get_supabase_uid('bob@test.com'), 'editor'),   -- Bob is editor on Alice's private field
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', tests.get_supabase_uid('carol@test.com'), 'viewer'), -- Carol is viewer on Alice's private field
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', tests.get_supabase_uid('carol@test.com'), 'editor'), -- Carol is editor on Bob's private field
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', tests.get_supabase_uid('bob@test.com'), 'viewer');   -- Bob is viewer on Alice's public field

-- ============================================================================
-- ANONYMOUS USER TESTS (not authenticated)
-- ============================================================================

select tests.clear_authentication();

select results_eq(
    'SELECT count(*) FROM public.field_collaborators',
    ARRAY[0::bigint],
    'Anonymous users can not see any collaborator records'
);

-- ============================================================================
-- ALICE (FIELD OWNER) TESTS
-- ============================================================================

-- Switch to Alice (field owner)
select tests.authenticate_as('alice@test.com');

-- Alice should see all collaborators on her private field
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''::uuid',
    ARRAY[2::bigint],
    'Alice can see all collaborators on her private field'
);

-- Alice should see collaborators on her public field
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''cccccccc-cccc-cccc-cccc-cccccccccccc''::uuid',
    ARRAY[1::bigint],
    'Alice can see all collaborators on her public field'
);

-- Alice should not see collaborators on other fields
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[0::bigint],
    'Alice cannot see collaborators on fields she does not own'
);

-- Test Alice can add collaborators to her field
select lives_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('dave@test.com'), 'viewer')$$,
    'Alice can add collaborators to her field'
);

-- Test Alice can update collaborator roles on her field
select lives_ok(
    $$UPDATE public.field_collaborators 
      SET role = 'editor' 
      WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        AND user_id = tests.get_supabase_uid('carol@test.com')$$,
    'Alice can update collaborator roles on her field'
);

-- Test Alice can remove collaborators from her field
select lives_ok(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('dave@test.com') 
      AND field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    'Alice can remove collaborators from her field'
);

-- Test Alice cannot add collaborators to Bob's field
select throws_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, tests.get_supabase_uid('eve@test.com'), 'viewer')$$,
    '42501',
    NULL,
    'Alice cannot add collaborators to fields she does not own'
);

-- Test Alice cannot update collaborators on Bob's field
select is_empty(
    $$UPDATE public.field_collaborators 
      SET role = 'editor' 
      WHERE field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        AND user_id = tests.get_supabase_uid('carol@test.com')
      RETURNING 1$$,
    'Alice cannot update collaborators on fields she does not own'
);

-- Test Alice cannot remove collaborators from Bob's field
select is_empty(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('carol@test.com') 
      AND field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
      RETURNING 1$$,
    'Alice cannot remove collaborators from fields she does not own'
);

-- ============================================================================
-- BOB (EDITOR COLLABORATOR) TESTS
-- ============================================================================

-- Switch to Bob (editor collaborator on Alice's private field, owner of his own field)
select tests.authenticate_as('bob@test.com');

-- Bob should see his own collaborator records
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE user_id = ''' || tests.get_supabase_uid('bob@test.com') || '''::uuid',
    ARRAY[2::bigint],
    'Bob can see his own collaborator records'
);

-- Bob can see other collaborator records on Alice's private field
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''::uuid',
    ARRAY[2::bigint],
    'Bob can see other collaborator records on private fields he does not own'
);

-- Bob should see collaborators on his own field
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[1::bigint],
    'Bob can see collaborators on his own field'
);

-- Test Bob can add collaborators to his own field
select lives_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, tests.get_supabase_uid('eve@test.com'), 'viewer')$$,
    'Bob can add collaborators to his own field'
);

-- Test Bob can update collaborators on his own field
select lives_ok(
    $$UPDATE public.field_collaborators 
      SET role = 'viewer' 
      WHERE field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        AND user_id = tests.get_supabase_uid('carol@test.com')$$,
    'Bob can update collaborator roles on his own field'
);

-- Test Bob can remove collaborators from his own field
select lives_ok(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('eve@test.com') 
      AND field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
    'Bob can remove collaborators from his own field'
);

-- Test Bob cannot add collaborators to Alice's field (even though he's an editor)
select throws_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('eve@test.com'), 'viewer')$$,
    '42501',
    NULL,
    'Bob cannot add collaborators to fields he does not own'
);

-- Test Bob cannot update collaborators on Alice's field
select is_empty(
    $$UPDATE public.field_collaborators 
      SET role = 'editor' 
      WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        AND user_id = tests.get_supabase_uid('carol@test.com')
      RETURNING 1$$,
    'Bob cannot update collaborators on fields he does not own'
);

-- Test Bob cannot remove collaborators from Alice's field
select is_empty(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('carol@test.com') 
      AND field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      RETURNING 1$$,
    'Bob cannot remove collaborators from fields he does not own'
);

-- ============================================================================
-- CAROL (VIEWER COLLABORATOR) TESTS
-- ============================================================================

-- Switch to Carol (viewer collaborator on Alice's private field, editor on Bob's field)
select tests.authenticate_as('carol@test.com');

-- Carol should see her own collaborator records
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE user_id = ''' || tests.get_supabase_uid('carol@test.com') || '''::uuid',
    ARRAY[2::bigint],
    'Carol can see her own collaborator records'
);

-- Carol should only see her own collaborator record on Alice's field (private field)
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''::uuid AND user_id = ''' || tests.get_supabase_uid('carol@test.com') || '''::uuid',
    ARRAY[1::bigint],
    'Carol can only see her own collaborator record on private fields'
);

-- Carol should only see her own collaborator record on Bob's field (private field)
select results_eq(
    'SELECT count(*) FROM public.field_collaborators WHERE field_id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid AND user_id = ''' || tests.get_supabase_uid('carol@test.com') || '''::uuid',
    ARRAY[1::bigint],
    'Carol can only see her own collaborator record on private fields she does not own'
);

-- Test Carol cannot add collaborators to any field (she's not an owner)
select throws_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('eve@test.com'), 'viewer')$$,
    '42501',
    NULL,
    'Carol cannot add collaborators to fields she does not own'
);

-- Test Carol cannot update collaborators on any field
select is_empty(
    $$UPDATE public.field_collaborators 
      SET role = 'editor' 
      WHERE field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        AND user_id = tests.get_supabase_uid('carol@test.com')
      RETURNING 1$$,
    'Carol cannot update collaborators on fields she does not own'
);

-- Test Carol can remove her own collaborations
select results_eq(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('carol@test.com') 
      AND field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
      RETURNING 1$$,
    ARRAY[1::integer],
    'Carol can remove her own collaborations'
);

-- ============================================================================
-- DAVE (UNAUTHORIZED USER) TESTS
-- ============================================================================

-- Switch to Dave (no collaborator relationships)
select tests.authenticate_as('dave@test.com');

select results_eq(
    'SELECT count(*) FROM public.field_collaborators',
    ARRAY[1::bigint],
    'Dave can only see collaborators on public fields'
);

-- Test Dave cannot add collaborators to any field
select throws_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('eve@test.com'), 'viewer')$$,
    '42501',
    NULL,
    'Dave cannot add collaborators to fields he does not own'
);

-- Test Dave cannot update collaborators on any field
select is_empty(
    $$UPDATE public.field_collaborators 
      SET role = 'editor' 
      WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        AND user_id = tests.get_supabase_uid('bob@test.com')
      RETURNING 1$$,
    'Dave cannot update collaborators on fields he does not own'
);

-- Test Dave cannot remove collaborators from any field
select is_empty(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('bob@test.com') 
      AND field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
    RETURNING 1$$,    
    'Dave cannot remove collaborators from fields he does not own'
);

-- ============================================================================
-- UNIQUE CONSTRAINT TEST
-- ============================================================================

-- Switch back to Alice to test unique constraint
select tests.authenticate_as('alice@test.com');

-- Test that we cannot add the same user twice to the same field
select throws_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('bob@test.com'), 'viewer')$$,
    '23505',
    NULL,
    'Cannot add the same user as collaborator twice on the same field'
);


-- Test that Bob can remove his own collaboration on a field he doesn't own
select tests.authenticate_as('bob@test.com');

select results_eq(
    $$DELETE FROM public.field_collaborators 
      WHERE user_id = tests.get_supabase_uid('bob@test.com') 
      AND field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      RETURNING 1$$,
      ARRAY[1::integer],
      'Bob can remove his own collaboration on a field he does not own'
);



-- ============================================================================
-- FINISH TESTS
-- ============================================================================

select * from finish();

rollback;
