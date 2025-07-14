begin;

select plan(20);

select tests.create_supabase_user('alice', 'alice@test.com');   -- Field owner
select tests.create_supabase_user('bob', 'bob@test.com');       -- Editor collaborator
select tests.create_supabase_user('carol', 'carol@test.com');   -- Viewer collaborator
select tests.create_supabase_user('dave', 'dave@test.com');     -- Unauthorized user

-- Authenticate as Alice (field owner) for setup
select tests.authenticate_as('alice');

-- Create test field
insert into public.fields (id, name, width, height, is_public, owner_id) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Integration Test Field', 1000, 1000, false, tests.get_supabase_uid('alice'));

-- Alice adds Bob as editor
select lives_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('bob'), 'editor')$$,
    'Alice can add Bob as editor'
);

-- Alice adds Carol as viewer
select lives_ok(
    $$INSERT INTO public.field_collaborators (field_id, user_id, role) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, tests.get_supabase_uid('carol'), 'viewer')$$,
    'Alice can add Carol as viewer'
);

-- Alice creates an emitter
select lives_ok(
    $$INSERT INTO public.emitters (id, field_id, x, y, color) 
      VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 100, 100, '#aa0000')$$,
    'Alice can create emitter in her field'
);

-- ============================================================================
-- INTEGRATION TEST: COMPLETE COLLABORATION WORKFLOW
-- ============================================================================

-- Switch to Bob (editor)
select tests.authenticate_as('bob');

-- Bob should see the field
select results_eq(
    $$SELECT count(*) FROM public.fields WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[1::bigint],
    'Bob can see the field where he is editor'
);

-- Bob should see all collaborators
select results_eq(
    $$SELECT count(*) FROM public.field_collaborators WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[2::bigint],
    'Bob can see all collaborators on the field'
);

-- Bob should see Alice's emitter
select results_eq(
    $$SELECT count(*) FROM public.emitters WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[1::bigint],
    'Bob can see emitters in the field'
);

-- Bob creates his own emitter
select lives_ok(
    $$INSERT INTO public.emitters (id, field_id, x, y, color) 
      VALUES ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 200, 200, '#0000bb')$$,
    'Bob can create emitter as editor'
);

-- Bob updates Alice's emitter
select lives_ok(
    $$UPDATE public.emitters 
      SET color = '#0033bb' 
      WHERE id = '11111111-1111-1111-1111-111111111111'::uuid$$,
    'Bob can update existing emitters as editor'
);

-- ============================================================================
-- Switch to Carol (viewer)
-- ============================================================================

select tests.authenticate_as('carol');

-- Carol should see the field
select results_eq(
    $$SELECT count(*) FROM public.fields WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[1::bigint],
    'Carol can see the field where she is viewer'
);

-- Carol should see all collaborators
select results_eq(
    $$SELECT count(*) FROM public.field_collaborators WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[2::bigint],
    'Carol can see all collaborators on the field'
);

-- Carol should see both emitters
select results_eq(
    $$SELECT count(*) FROM public.emitters WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[2::bigint],
    'Carol can see all emitters in the field'
);

-- Carol cannot create emitters (viewer role)
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 300, 300, '#cc0000')$$,
    '42501',
    'new row violates row-level security policy for table "emitters"',
    'Carol cannot create emitters as viewer'
);

-- ============================================================================
-- Switch to Dave (no access)
-- ============================================================================

select tests.authenticate_as('dave');

-- Dave should not see the field
select results_eq(
    $$SELECT count(*) FROM public.fields WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[0::bigint],
    'Dave cannot see private field without access'
);

-- Dave should not see any collaborators
select results_eq(
    $$SELECT count(*) FROM public.field_collaborators WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[0::bigint],
    'Dave cannot see collaborators without access'
);

-- Dave should not see any emitters
select results_eq(
    $$SELECT count(*) FROM public.emitters WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[0::bigint],
    'Dave cannot see emitters without access'
);

-- ============================================================================
-- INTEGRATION TEST: CASCADING DELETES
-- ============================================================================

-- Switch back to Alice to test cascading deletes
select tests.authenticate_as('alice');

-- Record counts before deletion
select results_eq(
    $$SELECT count(*) FROM public.field_collaborators WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[2::bigint],
    'There are 2 collaborators before field deletion'
);

select results_eq(
    $$SELECT count(*) FROM public.emitters WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[2::bigint],
    'There are 2 emitters before field deletion'
);

-- Delete the field - should cascade delete collaborators and emitters
select lives_ok(
    $$DELETE FROM public.fields WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    'Alice can delete her field'
);

-- Verify cascading deletes worked
select results_eq(
    $$SELECT count(*) FROM public.field_collaborators WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[0::bigint],
    'Collaborators are cascade deleted when field is deleted'
);

select results_eq(
    $$SELECT count(*) FROM public.emitters WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
    ARRAY[0::bigint],
    'Emitters are cascade deleted when field is deleted'
);

-- ============================================================================
-- FINISH TESTS
-- ============================================================================

select * from finish();

rollback;
