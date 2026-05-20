# Code Standards

## General

- Keep modules small, single-purpose, and strictly decoupled.
- Fix root causes at the core layer—do not stack conditional workarounds.
- Do not mix business evaluation rules with presentation or persistence layers.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the monorepo workspace.
- Avoid `any`; enforce explicit interfaces or narrowly scoped literal types.
- Validate unknown user payloads at API boundaries using strict types before database injection.
- Use `interface` for structural data object contracts and `type` for conditional/literal unions.

## Next.js (App Router)

- Default to React Server Components for layout structure and progress shells.
- Add `"use client"` exclusively when a form view requires local screen state, hooks, or interactive keyboard handling.
- Rely on high-performance native routing mechanisms; skip unnecessary frontend transitions and page animations.

## Styling & Accessibility

- Use CSS custom property design tokens defined in the shared `@phoenixlabs/ui` styles file—no raw Tailwind color hexes or unmapped theme utilities.
- Maintain high-contrast visual elements targeting full WCAG 2.1 AA conformance standards.
- Ensure all interactive form inputs map to semantic `<label htmlFor>` targets with distinctive focus-ring visibility indicators.
- Append unambiguous, non-breaking `data-testid` properties to interactive elements to ensure end-to-end tests are fully text-agnostic.

## NestJS API Routes

- Validate and parse incoming payloads against runtime input models before any business logic executes.
- Complete form engine operations inside thin, readable controllers.
- Return consistent, predictable payload responses matching the shared interface contract.

## Data and Storage

- Persist the absolute latest user progress snapshot as a JSON string inside the primary session model.
- Treat historical progression tracking as an immutable data ledger; log mutations to an append-only transaction history table on every screen submit.
- Never write evaluation algorithms inside repository methods—keep database operations purely data-driven.

## Testing Depth

- Write pure, side-effect-free evaluation functions so they can be completely verified by Vitest without mocking frameworks or server boots.
- Achieve 100% branch coverage on the core eligibility evaluator module before pushing to code review.
- Leverage Playwright to comprehensively assert the happy-path flow, state hydration on refresh, and edge cases under strict automated conditions.

## File Organization

- `packages/form-engine/` — shared types, schemas, and pure functional screening business logic.
- `packages/ui/` — shared design tokens, Tailwind v4 setup, and highly accessible presentation elements.
- `apps/api/` — NestJS controllers, Prisma configuration modules, and persistence services.
- `apps/web/` — Next.js page routes, interactive form views, and layout context providers.