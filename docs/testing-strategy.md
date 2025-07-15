# Database Testing Strategy

## Overview

Emittance Fields uses pgTAP for comprehensive database testing, with a focus on validating the authorization layer that controls field ownership, collaboration, and emitter management.

## Testing Philosophy

Since this is an authorization-focused project, our testing strategy prioritizes:

1. **RLS Policy Validation**: Ensuring proper access control across all user scenarios
2. **Business Rules**: Testing constraint logic and data validation

## Test Organization

Tests are organized by domain and functionality:

```
supabase/tests/
├── 00_setup_tests_hooks.sql           # Setup tests hooks
├── 01_fields_rls_tests.sql            # Field access control tests
├── 02_collaborators_rls_tests.sql     # Collaboration permissions
├── 03_emitters_rls_tests.sql          # Emitter management permissions
└── 04_integration_tests.sql           # Cross-table scenarios
```

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
select tests.authenticate_as('user@example.com');

-- Test expected behavior
select results_eq(
    'SELECT count(*) FROM fields',
    ARRAY[expected_count::bigint],
    'User should see correct number of fields'
);
```

## Coverage Goals

- **100% RLS Policy Coverage**: Every policy tested with positive and negative cases
- **Complete Schema Validation**: All tables, columns, constraints verified
- **User Journey Testing**: End-to-end scenarios for each user type
- **Edge Case Handling**: Boundary conditions and error scenarios
