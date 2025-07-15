# Emittance Fields - Agent Guide

## Project Overview

Emittance Fields is a collaborative visual system where users can place "emitters" in a shared field, similar to r/place.

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Build Tool**: Vite 7
- **Auth/Backend**: Supabase (authentication & database)
- **Package Manager**: Bun
- **Deployment**: Vercel with preview environments
- **Testing**: Playwright (E2E), pgTAP (database)
- **Linting**: ESLint, Prettier, svelte-check

## Key Commands

```bash
# Development
bun run dev              # Start dev server
bun run dev -- --open    # Start dev server and open browser

# Quality Checks
bun run format           # Format code with prettier
bun run lint             # Run prettier and eslint
bun run check            # Type checking with svelte-check
bun run check:watch      # Type checking in watch mode

# Build & Deploy
bun run build            # Production build
bun run preview          # Preview production build

# Testing
bun run test             # Run E2E tests (playwright)
bun run test:e2e         # Explicit E2E test command
```

## Data Models

- **Fields**: Canvas areas with dimensions, background, ownership
- **Emitters**: Points that emit particles/pixels with visual state
- **FieldCollaborators**: User permissions for field access

## Project Structure

- `src/routes/` - SvelteKit pages and API routes
- `src/lib/` - Shared components and utilities
- `docs/` - Project documentation and requirements
- `supabase/` - Supabase database schema, migrations, and pgTAP tests

## Development Notes

- Uses Svelte 5.0 (latest major version)
- Tailwind CSS for styling
- TypeScript for type safety
- Playwright for E2E testing
- ESLint + Prettier for code quality

## Database Management

**Pattern**: Use declarative schemas (`supabase/schemas/`) instead of imperative migrations where possible.

### Key Commands

```bash
supabase stop                                 # Stop supabase before generating migrations
supabase db diff -f <migration_name>          # Generate migration from schema changes
supabase start                                # Start supabase locally
supabase migration up                         # Apply pending migrations locally
supabase db push                              # Deploy to remote database
supabase db dump > supabase/schemas/prod.sql  # Pull production schema
supabase db reset --version <timestamp>       # Rollback for development
```

### Best Practices

- Store table definitions in `supabase/schemas/` directory
- Schema files run in lexicographic order (customize via `config.toml` if needed)
- Always append new columns to avoid messy diffs
- Use `supabase db diff` to generate migrations from schema changes
- For complex entities (views, functions): edit in-place in schema files
- DML operations and RLS policies still require traditional migrations
- Never reset deployed migrations - use forward-only rollbacks for production

## Database Testing

**Pattern**: Use pgTAP for comprehensive database testing, focusing on authorization layer validation.

### Key Commands

```bash
supabase test new <test_name>              # Create new test file
supabase test db                           # Run all database tests
supabase test db --debug                   # Run tests with verbose output
```
