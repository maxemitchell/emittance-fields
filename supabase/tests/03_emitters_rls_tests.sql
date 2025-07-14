begin;

-- Start transaction and declare test plan
select plan(28);

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test users using the proper helper function
select tests.create_supabase_user('alice@test.com');   -- Field owner
select tests.create_supabase_user('bob@test.com');     -- Editor collaborator
select tests.create_supabase_user('carol@test.com');   -- Viewer collaborator
select tests.create_supabase_user('dave@test.com');    -- Unauthorized user

-- Create test fields (using service role to bypass RLS)
insert into public.fields (id, name, width, height, is_public, owner_id) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Public Field', 500, 500, true, tests.get_supabase_uid('alice@test.com')),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Alice Private Field', 400, 400, false, tests.get_supabase_uid('alice@test.com')),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bob Public Field', 300, 300, true, tests.get_supabase_uid('bob@test.com'));

-- Create collaborator relationships (using service role to bypass RLS)
insert into public.field_collaborators (field_id, user_id, role) values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', tests.get_supabase_uid('bob@test.com'), 'editor'),   -- Bob is editor on Alice's private field
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', tests.get_supabase_uid('carol@test.com'), 'viewer'),   -- Carol is viewer on Alice's private field
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', tests.get_supabase_uid('carol@test.com'), 'editor');   -- Carol is editor on Bob's public field

-- Create test emitters (using service role to bypass RLS)
insert into public.emitters (id, field_id, x, y, color) values
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 50, '#ff0000'),   -- Alice's public field
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 100, '#00ff00'), -- Alice's public field
    ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 200, 200, '#0000ff'), -- Alice's private field
    ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 150, 150, '#ffff00'); -- Bob's public field

-- ============================================================================
-- ANONYMOUS USER TESTS (not authenticated)
-- ============================================================================

select tests.clear_authentication();

select results_eq(
    'SELECT count(*) FROM public.emitters',
    ARRAY[3::bigint],
    'Anonymous users can see emitters in public fields'
);

-- ============================================================================
-- ALICE (FIELD OWNER) TESTS
-- ============================================================================

select tests.authenticate_as('alice@test.com');

select results_eq(
    'SELECT count(*) FROM public.emitters',
    ARRAY[4::bigint],
    'Alice can see all emitters (owns 2 emitters, plus public access to Bobs field)'
);

-- Test Alice can managet emitters in her own fields
select lives_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 75, 75, '#800080')$$,
    'Alice can create emitters in her public field'
);

select lives_ok(
    $$UPDATE public.emitters 
      SET color = '#cccccc' 
      WHERE id = '11111111-1111-1111-1111-111111111111'::uuid$$,
    'Alice can update emitters in her fields'
);

select results_eq(
    $$DELETE FROM public.emitters 
      WHERE field_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid 
      AND color = '#800080'
      RETURNING 1$$,
    ARRAY[1::integer],
    'Alice can delete emitters in her fields'
);

-- Test Alice cannot modify emitters in Bob's field
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 300, 300, '#ff0000')$$,
    '42501',
    NULL,
    'Alice cannot create emitters in fields she does not own or have editor access to'
);

select is_empty(
    $$UPDATE public.emitters 
      SET color = '#ff0000' 
      WHERE id = '44444444-4444-4444-4444-444444444444'::uuid 
      RETURNING 1$$,
    'Alice cannot update emitters in fields she does not own'
);

-- ============================================================================
-- BOB (EDITOR COLLABORATOR) TESTS
-- ============================================================================

select tests.authenticate_as('bob@test.com');

select results_eq(
    'SELECT count(*) FROM public.emitters',
    ARRAY[4::bigint],
    'Bob can see all emitters (editor access to Alice private field + owns public field + public access)'
);

-- Test Bob can create emitters in Alice's private field (he's an editor)
select lives_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 300, 300, '#0000ff')$$,
    'Bob can create emitters in Alice private field as editor'
);

-- Test Bob can update emitters in Alice's private field
select lives_ok(
    $$UPDATE public.emitters 
      SET color = '#0066cc' 
      WHERE id = '33333333-3333-3333-3333-333333333333'::uuid$$,
    'Bob can update emitters in Alice private field as editor'
);

-- Test Bob can delete emitters in Alice's private field
select results_eq(
    $$DELETE FROM public.emitters 
      WHERE field_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid 
      AND color = '#0000ff'
      RETURNING 1$$,
    ARRAY[1::integer],
    'Bob can delete emitters in Alice private field as editor'
);

-- Test Bob can manage emitters in his own field
select lives_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 250, 250, '#006611')$$,
    'Bob can create emitters in his own field'
);

select lives_ok(
    $$UPDATE public.emitters 
      SET color = '#006600' 
      WHERE id = '44444444-4444-4444-4444-444444444444'::uuid$$,
    'Bob can update emitters in his own field'
);

select results_eq(
    $$DELETE FROM public.emitters 
      WHERE field_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid 
      AND color = '#006611'
      RETURNING 1$$,
    ARRAY[1::integer],
    'Bob can delete emitters in his own field'
);


-- Test Bob cannot modify emitters in Alice's public field (no editor access)
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 400, 400, '#ff0000')$$,
    '42501',
    NULL,
    'Bob cannot create emitters in fields where he is not owner or editor'
);

-- ============================================================================
-- CAROL (VIEWER COLLABORATOR) TESTS
-- ============================================================================

select tests.authenticate_as('carol@test.com');

select results_eq(
    'SELECT count(*) FROM public.emitters',
    ARRAY[4::bigint],
    'Carol can see all emitters (viewer access to Alice private + editor on Bob public + public access)'
);

-- Test Carol cannot create emitters in Alice's private field (viewer role)
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 350, 350, '#ff69b4')$$,
    '42501',
    NULL,
    'Carol cannot create emitters in Alice private field as viewer'
);

select is_empty(
    $$UPDATE public.emitters 
      SET color = '#ff0000' 
      WHERE id = '33333333-3333-3333-3333-333333333333'::uuid
      RETURNING 1$$,
    'Carol cannot update emitters in Alice private field as viewer'
);

-- Test Carol can manage emitters in Bob's public field (editor role)
select lives_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 275, 275, '#9966cc')$$,
    'Carol can create emitters in Bob public field as editor'
);

select lives_ok(
    $$UPDATE public.emitters 
      SET color = '#cc99ff' 
      WHERE id = '44444444-4444-4444-4444-444444444444'::uuid$$,
    'Carol can update emitters in Bob public field as editor'
);

select results_eq(
    $$DELETE FROM public.emitters 
      WHERE field_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid 
      AND color = '#9966cc'
      RETURNING 1$$,
    ARRAY[1::integer],
    'Carol can delete emitters in Bob public field as editor'
);

-- Test Carol cannot modify emitters in Alice's public field (no special access)
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 450, 450, '#ff0000')$$,
    '42501',
    NULL,
    'Carol cannot create emitters in public fields where she has no editor access'
);


-- ============================================================================
-- DAVE (UNAUTHORIZED USER) TESTS
-- ============================================================================

select tests.authenticate_as('dave@test.com');

select results_eq(
    'SELECT count(*) FROM public.emitters',
    ARRAY[3::bigint],
    'Dave can only see emitters in public fields'
);

-- Test Dave cannot see emitters in private fields
select results_eq(
    'SELECT count(*) FROM public.emitters WHERE field_id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''::uuid',
    ARRAY[0::bigint],
    'Dave cannot see emitters in private fields'
);

-- Test Dave cannot create emitters anywhere (no editor access to any field)
select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 500, 500, '#ff0000')$$,
    '42501',
    NULL,
    'Dave cannot create emitters in public fields without editor access'
);

select throws_ok(
    $$INSERT INTO public.emitters (field_id, x, y, color) 
      VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 250, 250, '#ff0000')$$,
    '42501',
    NULL,
    'Dave cannot create emitters in any field without editor access'
);

-- Test Dave cannot update or delete any emitters
select is_empty(
    $$UPDATE public.emitters 
      SET color = '#ff0000' 
      WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
      RETURNING 1$$,
    'Dave cannot update emitters without proper access'
);

select is_empty(
    $$DELETE FROM public.emitters 
      WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
      RETURNING 1$$,
    'Dave cannot delete emitters without proper access'
);

-- ============================================================================
-- FINISH TESTS
-- ============================================================================

select * from finish();

rollback;
