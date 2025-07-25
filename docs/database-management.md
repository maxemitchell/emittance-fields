# Database Management Guide

## Declarative Schemas Approach

This project uses [Supabase's declarative schema management](https://supabase.com/docs/guides/local-development/declarative-database-schemas) instead of traditional imperative migrations where possible. This provides several benefits:

- **Single source of truth**: Table definitions live in one place
- **Easier maintenance**: Complex entities (views, functions) can be edited in-place
- **Better code review**: Schema changes are visible as diffs in schema files
- **Automatic migration generation**: Migrations are generated from schema changes

## Key Concepts

### Declarative vs Imperative

- **Declarative** (preferred): Define the desired state in `supabase/schemas/`
- **Imperative** (when needed): Write step-by-step migration instructions

### When to Use Each Approach

**Use declarative schemas for:**

- Table definitions (DDL)
- Views and functions
- Most schema changes

**Use traditional migrations for:**

- Data manipulation (INSERT, UPDATE, DELETE)
- RLS policies and security rules
- Complex transformations requiring specific order

## Workflow

### Initial Setup

```bash
# Pull existing production schema (if any)
supabase db dump > supabase/schemas/prod.sql
```

### Development Cycle

1. Edit schema files in `supabase/schemas/`
2. Stop local database: `supabase stop`
3. Generate migration: `supabase db diff -f <migration_name>`
4. Review generated migration
5. Start local database: `supabase start`
6. Apply locally: `supabase migration up`
7. Test changes
8. Deploy: `supabase db push`

### Schema Organization

Schema files run in **lexicographic order**. For dependencies between tables:

1. Use filename prefixes: `01_users.sql`, `02_fields.sql`, etc.
2. Or specify custom order in `supabase/config.toml`:
   ```toml
   [db.migrations]
   schema_paths = [
     "./schemas/users.sql",
     "./schemas/*.sql"
   ]
   ```

## Best Practices

### Schema File Management

- **Always append new columns** to avoid messy diffs
- **One logical group per file** (related tables, views, functions)
- **Use descriptive filenames** that indicate dependencies

### Development Workflow

- **Stop local database** before running `supabase db diff`
- **Review generated migrations** before applying
- **Test locally** before deploying to production

### Rollback Strategy

- **Development**: Use `supabase db reset --version <timestamp>`
- **Production**: Never reset deployed migrations
- **Production rollbacks**: Revert schema files, generate forward migration

## Limitations

The declarative approach cannot handle:

- DML operations (INSERT, UPDATE, DELETE)
- RLS policies and grants
- View ownership and security settings
- Comments and partitions
- Some advanced PostgreSQL features

For these cases, use traditional migrations in `supabase/migrations/`.

## Directory Structure

```
supabase/
├── schemas/           # Declarative schema definitions
│   ├── 01_extensions.sql
│   ├── 02_fields.sql
│   ├── 03_field_collaborators.sql
│   └── 04_emitters.sql
│   ├── 05_functions.sql
│   └── 06_policies.sql
├── migrations/        # Generated and manual migrations
│   ├── 20250714_*.sql
│   └── 20250715_*.sql
```

## Supabase Commands Reference

```bash
# Stop database before running diff
supabase stop

# Generate migration from schema changes
supabase db diff -f create_new_feature

# Start database
supabase start

# Apply pending migrations locally
supabase migration up

# Deploy all changes to remote database
supabase db push

# Pull production schema to local file
supabase db dump > supabase/schemas/prod.sql

# Reset local database to specific migration (dev only)
supabase db reset --version 20241005112233

# Start/stop local database
supabase start
supabase stop
```
