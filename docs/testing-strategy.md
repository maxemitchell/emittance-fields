# Database Testing Strategy

## Overview

Emittance Fields uses pgTAP for comprehensive database testing, with a focus on validating the authorization layer that controls field ownership, collaboration, and emitter management.

## Testing Philosophy

Since this is an authorization-focused project, our testing strategy prioritizes:

1. **RLS Policy Validation**: Ensuring proper access control across all user scenarios
2. **Schema Integrity**: Validating table structure, constraints, and relationships
3. **Business Rules**: Testing constraint logic and data validation
4. **Performance**: Ensuring indexes and queries perform efficiently

## Test Organization

Tests are organized by domain and functionality:

```
supabase/tests/
├── 01_schema_tests.sql           # Table structure and constraints
├── 02_fields_rls_tests.sql       # Field access control tests
├── 03_collaborators_rls_tests.sql # Collaboration permissions
├── 04_emitters_rls_tests.sql     # Emitter management permissions
└── 05_integration_tests.sql      # Cross-table scenarios
```

## Test Categories

### 1. Schema Tests

- Table existence and structure
- Column definitions and constraints
- Index presence and performance
- Trigger functionality
- Foreign key relationships

### 2. RLS Policy Tests

- **Anonymous users**: Public field access only
- **Field owners**: Full CRUD on owned fields and emitters
- **Editors**: Create/update/delete emitters, view collaborators
- **Viewers**: Read-only access to fields and emitters
- **Unauthorized users**: Proper access denial

### 3. Data Integrity Tests

- Constraint validation (dimensions, colors, coordinates)
- Cascade deletion behavior
- Unique constraint enforcement
- Business rule validation

### 4. Integration Tests

- Complex permission scenarios
- Multi-user collaboration workflows
- Cross-table relationship validation

## User Personas for Testing

### Alice (Field Owner)

- Can create, read, update, delete their fields
- Can manage all emitters in their fields
- Can add/remove collaborators with different roles
- Can change field visibility (public/private)

### Bob (Editor Collaborator)

- Can view fields they have editor access to
- Can create, update, delete emitters in accessible fields
- Can view other collaborators
- Cannot modify field settings or collaborator list

### Carol (Viewer Collaborator)

- Can view fields they have viewer access to
- Can view emitters in accessible fields
- Can view other collaborators
- Cannot modify anything

### Dave (Anonymous User)

- Can only view public fields and their emitters
- Cannot access private fields
- Cannot create or modify anything

## Running Tests

```bash
# Run all database tests
supabase test db

# Run tests with debug output
supabase test db --debug

# Create a new test file
supabase test new test_name
```

## Test Data Strategy

Each test file includes:

- Setup phase: Create test users and base data
- Test execution: Run scenarios with different user contexts
- Cleanup phase: Reset to clean state (handled by pgTAP)

## Assertion Patterns

### RLS Testing Pattern

```sql
-- Switch to specific user context
set local role authenticated;
set local request.jwt.claim.sub = 'user-uuid';

-- Test expected behavior
select results_eq(
    'SELECT count(*) FROM fields',
    ARRAY[expected_count::bigint],
    'User should see correct number of fields'
);
```

### Schema Testing Pattern

```sql
-- Test table structure
select has_table('public', 'fields', 'Fields table exists');
select has_column('public', 'fields', 'name', 'Fields has name column');
select col_not_null('public', 'fields', 'name', 'Name cannot be null');
```

## Coverage Goals

- **100% RLS Policy Coverage**: Every policy tested with positive and negative cases
- **Complete Schema Validation**: All tables, columns, constraints verified
- **User Journey Testing**: End-to-end scenarios for each user type
- **Edge Case Handling**: Boundary conditions and error scenarios
