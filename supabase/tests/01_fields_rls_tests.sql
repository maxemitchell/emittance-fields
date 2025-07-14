begin;

-- Start transaction and declare test plan
select plan(21);

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test users using the proper helper function
select tests.create_supabase_user('alice@test.com');   -- Field owner
select tests.create_supabase_user('bob@test.com');     -- Editor collaborator
select tests.create_supabase_user('carol@test.com');   -- Viewer collaborator
select tests.create_supabase_user('dave@test.com');    -- Unauthorized user

-- Create test fields (using service role to bypass RLS)
insert into public.fields (id, name, description, width, height, is_public, owner_id) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Public Field', 'Public field owned by Alice', 100, 100, true, tests.get_supabase_uid('alice@test.com')),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Alice Private Field', 'Private field owned by Alice', 200, 200, false, tests.get_supabase_uid('alice@test.com')),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob Public Field', 'Public field owned by Bob', 150, 150, true, tests.get_supabase_uid('bob@test.com'));

-- Create collaborator relationships (using service role to bypass RLS)
insert into public.field_collaborators (field_id, user_id, role) values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', tests.get_supabase_uid('bob@test.com'), 'editor'),   -- Bob is editor on Alice's private field
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', tests.get_supabase_uid('carol@test.com'), 'viewer');   -- Carol is viewer on Alice's private field

-- ============================================================================
-- ANONYMOUS USER TESTS (not authenticated)
-- ============================================================================

select tests.clear_authentication();

select results_eq(
    'SELECT count(*) FROM public.fields',
    ARRAY[2::bigint],
    'Anonymous users can see public fields'
);

select throws_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Alice New Field', 300, 300, tests.get_supabase_uid('alice@test.com'))$$,
    '42501',
    NULL,
    'Anonymous users cannot create fields'
);

-- ============================================================================
-- ALICE (FIELD OWNER) TESTS
-- ============================================================================

-- Switch to Alice (field owner)
select tests.authenticate_as('alice@test.com');

select results_eq(
    'SELECT count(*) FROM public.fields',
    ARRAY[3::bigint],
    'Alice can see all fields (her own + public)'
);

-- Test Alice can create a new field
select lives_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Alice New Field', 300, 300, tests.get_supabase_uid('alice@test.com'))$$,
    'Alice can create a new field'
);

-- Test Alice can update her own field
select lives_ok(
    $$UPDATE public.fields 
      SET description = 'Updated description' 
      WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    'Alice can update her own field'
);

-- Test Alice can delete her own field
select lives_ok(
    $$DELETE FROM public.fields 
      WHERE name = 'Alice New Field'$$,
    'Alice can delete her own field'
);

-- Test Alice cannot update fields owned by others (should affect 0 rows due to RLS)
select is_empty(
    $$UPDATE public.fields SET description = 'Hacked by Alice' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid RETURNING 1$$,
    'Alice cannot update fields owned by others'
);


-- ============================================================================
-- BOB (EDITOR COLLABORATOR) TESTS
-- ============================================================================

-- Switch to Bob (editor collaborator on Alice's private field)
select tests.authenticate_as('bob@test.com');

select results_eq(
    'SELECT count(*) FROM public.fields',
    ARRAY[3::bigint],
    'Bob can see public fields + fields he owns + fields he collaborates on'
);

-- Test Bob can see Alice's private field (he's an editor)
select results_eq(
    'SELECT count(*) FROM public.fields WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[1::bigint],
    'Bob can see Alice private field where he is editor'
);

-- Test Bob cannot create fields with Alice as owner
select throws_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Bob Hacking Field', 100, 100, tests.get_supabase_uid('alice@test.com'))$$,
    '42501',
    NULL,
    'Bob cannot create fields with Alice as owner'
);

-- Test Bob can create his own field
select lives_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Bob New Field', 250, 250, tests.get_supabase_uid('bob@test.com'))$$,
    'Bob can create his own field'
);

-- Test Bob can update Alice's field he edits
select lives_ok(
    $$UPDATE public.fields 
      SET description = 'Updated by Bob' 
      WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
    'Bob can update Alice private field where he is editor'
);

-- ============================================================================
-- CAROL (VIEWER COLLABORATOR) TESTS
-- ============================================================================

-- Switch to Carol (viewer collaborator on Alice's private field)
select tests.authenticate_as('carol@test.com');

select results_eq(
    'SELECT count(*) FROM public.fields',
    ARRAY[3::bigint],
    'Carol can see public fields + fields she collaborates on'
);

-- Test Carol can see Alice's private field (she's a viewer)
select results_eq(
    'SELECT count(*) FROM public.fields WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[1::bigint],
    'Carol can see Alice private field where she is viewer'
);

-- Test Carol can create her own field
select lives_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Carol New Field', 180, 180, tests.get_supabase_uid('carol@test.com'))$$,
    'Carol can create her own field'
);

-- Test Carol cannot update Alice's field she views (should affect 0 rows due to RLS)
select is_empty(
    $$UPDATE public.fields SET description = 'Hacked by Carol' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid RETURNING 1$$,
    'Carol cannot update fields owned by others'
);

-- ============================================================================
-- DAVE (UNAUTHORIZED USER) TESTS
-- ============================================================================

-- Switch to Dave (no special permissions)
select tests.authenticate_as('dave@test.com');

select results_eq(
    'SELECT count(*) FROM public.fields',
    ARRAY[2::bigint],
    'Dave can only see public fields'
);

-- Test Dave cannot see Alice's private field
select results_eq(
    'SELECT count(*) FROM public.fields WHERE id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[0::bigint],
    'Dave cannot see private fields where he has no access'
);

-- Test Dave can create his own field
select lives_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Dave New Field', 120, 120, tests.get_supabase_uid('dave@test.com'))$$,
    'Dave can create his own field'
);

-- Test Dave cannot create field with Alice as owner
select throws_ok(
    $$INSERT INTO public.fields (name, width, height, owner_id) 
      VALUES ('Dave Hacking Field', 100, 100, tests.get_supabase_uid('alice@test.com'))$$,
    '42501',
    NULL,
    'Dave cannot create fields with others as owner'
);

-- Test Dave cannot update Alice's public field (should affect 0 rows due to RLS)
select is_empty(
    $$UPDATE public.fields SET description = 'Hacked by Dave' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid RETURNING 1$$,
    'Dave cannot update fields owned by others'
);

-- ============================================================================
-- FINISH TESTS
-- ============================================================================

select * from finish();

rollback;
