# Emittance Fields

[Live Demo](https://emittance-fields.vercel.app)

![Emittance Fields](static/logo.png)
_Logo via Krea.ai_

A collaborative visual system for creating and sharing digital canvases with real-time emitter placement. Currently, these emitters are static pixels defined by `{x, y, color}`, but in the future I will add support for dynamic emitters with a flowfield-like particle simulation system.

I am also planning to use this as the basis for a TouchDesigner live music visual experience. I can build a custom TD component to ingest realtime emitter data from Supabase, and have that emitter data run in a realtime audioreactive flowfield patch. Attendees will be able to interact with the visuals live by placing, editing, and deleting emitters via this web app, while I can control the simulation parameters, audioreactivity, and other settings through TD.

## What is Emittance Fields?

Emittance Fields is a collaborative r/place-style system where users:

- Create private or public fields (canvases) with custom dimensions
- Place colored emitters (pixels) anywhere on fields
- Share fields with others using viewer/editor permissions
- See real-time updates as collaborators make changes

The system demonstrates a comprehensive authorization layer with PostgreSQL Row Level Security (RLS) and extensive testing.

## Architecture

- **Frontend**: SvelteKit with Svelte 5.0 and TypeScript
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Authorization**: Row Level Security with helper functions
- **Testing**: pgTAP for database-level authorization testing, Playwright for E2E testing (not yet implemented)
- **Deployment**: Vercel with preview environments

## Key Features

- **Robust Authorization**: RLS policies with pgTAP test assertions
- **Real-time Collaboration**: Live updates via Supabase subscriptions
- **Role-based Access**: Owner/Editor/Viewer permissions with field-level granularity
- **Comprehensive Testing**: Database-level authorization validation
- **Modern Stack**: SvelteKit 5.0, TypeScript, Tailwind CSS, Supabase

## Quick Start

```bash
# Install dependencies
bun install

# Set up Supabase locally
bunx supabase start

# Start development server
bun run dev

# Open in browser
bun run dev -- --open
```

## Documentation

- **[System Overview](docs/system-overview.md)** - What/How/Why of the system
- **[Testing Strategy](docs/testing-strategy.md)** - Authorization testing approach
- **[Database Management](docs/database-management.md)** - Schema and migration workflow

## Development Commands

```bash
# Auto format
bun run format

# Linting
bun run lint

# Type checking
bun run check

# Run E2E tests
bun run test:e2e

# Run database tests
supabase test db

# Build for production
bun run build

# Preview production build
bun run preview
```
