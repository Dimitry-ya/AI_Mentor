# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### `ai-mentor` (artifacts/ai-mentor) — main product

Russian-language internal enterprise web app for a bank to author, validate,
publish, and run training units (Тренажёры and Экзамены).

- **Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + lucide-react
  + wouter + sonner + recharts + react-hook-form
- **Persistence**: localStorage only (key `ai-mentor:v1`); no backend
- **Routing**: `/catalog`, `/analytics`, `/admin/access` (in `AppLayout` with
  248px nav rail); `/builder/:id`, `/preview/:id`, `/sandbox/:id`,
  `/learner/:id` (full-screen, no rail)
- **Domain**: `src/lib/types.ts` (Training, Section, Case, Question, Criterion,
  Hint, Onboarding, Theory, Finish, Employee, AnalyticsRecord, …),
  `src/lib/factory.ts`, `src/lib/validation.ts` (errors per block, readiness%,
  byBlock map), `src/lib/seed.ts` (7 seed trainings, 23 employees, full
  analytics matrix), `src/lib/constants.ts`
- **Store**: `src/store.tsx` — full CRUD with auto status flip to "Есть
  изменения" on edit of published, validation-driven readiness, employee bulk
  ops, resetAttempt, resetAll
- **Design tokens (locked)**: bg `#F3F5F8`, brand red `#C62828`, Inter, 16px
  radius, 8px grid, 920px content max-width. Brand red used only for primary
  CTA / errors. All UI text in Russian; no emojis, no lorem ipsum.
- **Pages**: `catalog.tsx` (search/type/status filters, status-grouped grid,
  card menu), `builder/{index,tree,editors,inspector}.tsx` (3-pane builder
  with Flow Stepper, Ctrl+S save, Проверить drawer), `runner.tsx` (preview /
  sandbox / learner with onboarding/theory/case/finish scenes, silence timer,
  hint reveal, AI eval mock with per-criterion scoring), `analytics.tsx`
  (KPI cards, BarChart + PieChart, table with CSV export), `access.tsx`
  (employee management with bulk role/status/delete, protected owner row)

To verify changes: `pnpm --filter ai-mentor run typecheck`, then restart the
`artifacts/ai-mentor: web` workflow.
