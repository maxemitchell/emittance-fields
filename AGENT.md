# Emittance Fields - Agent Guide

## Project Overview

Emittance Fields is a collaborative visual system where users can place "emitters" in a shared field - think r/place but with flow field simulation capabilities. The focus is on implementing a robust authorization layer.

## Tech Stack

- **Framework**: SvelteKit 2.22.0 with Svelte 5.0
- **Styling**: Tailwind CSS 4.0
- **Language**: TypeScript 5.0
- **Build Tool**: Vite 7.0
- **Auth/Backend**: Supabase (authentication & database)
- **Package Manager**: Bun
- **Deployment**: Vercel with preview environments
- **Testing**: Playwright (E2E)
- **Linting**: ESLint 9.18 + Prettier

## Key Commands

```bash
# Development
bun run dev              # Start dev server
bun run dev -- --open   # Start dev server and open browser

# Quality Checks
bun run check            # Type checking with svelte-check
bun run check:watch      # Type checking in watch mode
bun run lint             # Run prettier and eslint
bun run format           # Format code with prettier

# Build & Deploy
bun run build            # Production build
bun run preview          # Preview production build

# Testing
bun run test             # Run E2E tests (playwright)
bun run test:e2e         # Explicit E2E test command
```

## Core Concept

The system is implementing a **barebones mode** only: emitters are static and defined by `{x, y, color}`—similar to pixel placement in r/place.

## Data Models

- **Fields**: Canvas areas with dimensions, background, ownership
- **Emitters**: Points that emit particles/pixels with visual state
- **FieldCollaborators**: User permissions for field access
- **Users**: Basic user accounts

## Authorization Focus

This is a challenge project centered on authorization design. The auth layer should handle:

- User permissions on fields (owner, collaborator roles)
- Emitter placement/editing rights
- Field visibility (public/private)
- Collaborative access control

## Project Structure

- `src/routes/` - SvelteKit pages and API routes
- `src/lib/` - Shared components and utilities
- `docs/` - Project documentation and requirements

## Development Notes

- Uses Svelte 5.0 (latest major version)
- Tailwind CSS for styling
- TypeScript for type safety
- Playwright for E2E testing
- ESLint + Prettier for code quality
