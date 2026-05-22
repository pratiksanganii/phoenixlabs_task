# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- **Phase 1: Workspace Setup & Foundational Architecture**

## Current Goal

- Add Vitest branch coverage for the form-engine evaluator (100% branch paths).

## Completed

- **Monorepo Scaffolding:** Initialized a unified workspace environment using Turborepo to handle decoupled `apps/` and `packages/` seamlessly.
- **UI Package Setup:** Configured the shared `@phoenixlabs/ui` package with a forward-looking Tailwind 4 theme structure.
- **Component Styling Fix:** Resolved a critical cross-workspace compilation bug where CSS styles defined inside the shared `@phoenixlabs/ui` package weren't applying to the Next.js `apps/web` client. Researched the root cause and applied a verified integration fix.
- **Form Engine Definitions:** Created the shared `@phoenixlabs/form-engine` workspace package and mapped out strict, type-safe literal types, option bounds, and payload contract structures for all 15 screens.
- **Local Database Environment:** Provisioned a local PostgreSQL 15 container instance running via Docker Compose.
- **Relational Data Modeling:** Created the database blueprint using a streamlined two-table architecture designed for high concurrency, storing consolidated intermediate states alongside an append-only transaction trail (`Session` + `SessionHistory`).
- **Prisma Migrations:** Successfully executed the baseline database initialization tracking using explicit version 6 tags (`npx prisma@6 migrate dev --name init_session_tracking`), ensuring compatibility with the team's production codebase targets.
- **Declarative Form Engine:** Modeled the 15-screen questionnaire using an encapsulated JSON schema engine configuration (`FORM_ENGINE_SCHEMA`). Shuffled the navigation routing into isolated, self-contained functional properties (`resolveProgress`) on individual screen objects to maximize scalability and maintain the Open-Closed SOLID design pattern.
- **Progressive Clinical Evaluator:** Crafted a zero-dependency pure function (`evaluateEligibility`) that mimics chronological clinical traversal. Optimized the data integrity layer to cleanly catch missing data assertions via explicit `try...catch` guards while supporting smooth early-exit workflows (e.g., underage or low-BMI rejections) without throwing false-positive errors on downstream missing variables.
- **Scratchpad Test Harness:** Set up a rapid execution runtime shortcut (`npm run scratchpad`) utilizing `tsx` to evaluate complete and incomplete user state matrices locally inside the package workspace.
- **NestJS Session API:** Implemented `POST /api/session/start`, `POST /api/session/answer`, and `GET /api/session/:id` with Prisma persistence, deduplicated answer short-circuiting, atomic `$transaction` writes to `Session` + `SessionHistory`, and routing/evaluation delegated to `@phoenixlabs/form-engine`.
- **API Integration Tests:** Added Vitest-based `session.controller.spec.ts` with mocked Prisma (no live PostgreSQL required).
- **NestJS CORS:** Enabled `enableCors()` in `apps/api/src/main.ts` driven by `CORS_ORIGIN` (comma-separated origins supported).
- **Shared UI Primitives:** Extended `@phoenixlabs/ui` with medical dark-mode `Card`, `Input` (prefix/suffix/errors), `RadioGroup`, `CheckboxGroup`, and `Button` variants with loading state.
- **Next.js Client UI:** Single-route wizard at `apps/web` with `FormWizardContext` (localStorage hydration, client back stack, server-synced next), config-driven `QuestionRenderer`, terminal `EvaluationDashboard`, and direct `fetch` to `NEXT_PUBLIC_API_URL`.
- **Playwright E2E:** Root `playwright.config.ts` with dual `webServer` (Nest `apps/api` :3001, Next `apps/web` :3000), `e2e/questionnaire.spec.ts` (happy path, mid-flow refresh, underage terminal, BP conflict), Chromium/Firefox/WebKit projects, and `npm run test:e2e`.
- **E2E UI hooks:** Outcome `data-testid` values (`status-eligible`, `status-ineligible`, `status-requires-review`), `validation-error`, client-side blood-pressure conflict guard, and `sessionStorage` draft restore for in-progress numeric fields before submit.
- **WCAG 2.1 AA Accessibility Conformance (Vector 4):** Refactored the custom `RadioGroup` and `CheckboxGroup` components inside the shared `@phoenixlabs/ui` package to use semantic `<fieldset>` and `<legend>` groupings. Converted error alert regions to persistently mount in the DOM using transition-based styling to guarantee dynamic validation announcements for screen readers.
- **Accessible Keyboard Navigation & Auto-Focus:** Wrapped the questionnaire layout inside a semantic HTML `<form>` element and converted the Next navigation button to `type="submit"`, enabling native Enter-to-Submit navigation across numeric inputs, checkboxes, and radio options. Implemented dynamic auto-focus transitions inside `QuestionRenderer` via a React referenced container and lifecycle effect, automatically shifting assistive focus to the first interactive input field (or first group option) upon transitioning to a new active screen.
- **E2E Test-ID Alignment:** Resolved an E2E test failure where persistently mounting error alerts in the DOM caused Playwright's `expect(page.getByTestId("validation-error")).toHaveCount(0)` assertion to fail. Applied a clean and elegant fix by conditionally setting the `data-testid` attribute based on the presence of an active error. This retains the persistent `<p role="alert">` element in the DOM for screen reader accessibility, while dynamically hiding the test-ID attribute when no error is active so that Playwright asserts exactly `0` matches. Tested and verified cleanly via full production build.

## In Progress

- None.

## Next Up

- **Unit Testing Coverage:** Add the Vitest 4 testing suite to force full 100% branch validation paths across every medical scenario defined in the specifications (form-engine).

## Open Questions

- None at this moment. All core spec ambiguities regarding early profile completion, multi-choice blood pressure conflicts, and active diabetes definitions have been resolved and documented in the project specifications.

## Architecture Decisions

- **Append-Only Session Logs:** Chose to extract mutable progress steps out into an isolated, sequential `SessionHistory` data log. This keeps the primary `Session` row small and performant under load, while generating a clean, unblemished clinical audit trail of patient choices.
- **Workspace Dependency Sharing:** Kept raw database client generation outputs centralized within the default `.prisma` framework directory, eliminating fragile relative path mapping across the repository layout while enforcing clean compile-time borders.
- **Stateful Waterfall Resolver Routing:** Upgraded the global router logic to traverse responses progressively from Screen 1 on every entry point request. This creates a defensive state hydration loop that neutralizes browser-refresh skipping bugs, malicious payload injection attempts, or client-side context manipulation.
- **Direct Browser API + CORS:** Web client calls Nest via `NEXT_PUBLIC_API_URL` (no Next.js rewrite proxy). Nest allows the Next origin through `CORS_ORIGIN`. Screen history after refresh is rebuilt from `FORM_ENGINE_SCHEMA` + `savedAnswers`.

## Session Notes

- **Prisma Version Boundary Catch:** Caught a syntax exception where the ecosystem was defaulting to the absolute latest version 7 parameters (which deprecates direct `url` string attributes inside schema blueprints). Reverted the active workspace packages and explicitly pinned the tooling to standard Prisma 6 configurations to exactly match the company's real codebase guidelines.
* **Graph-Traversal Navigation Fix:** Identified an issue where a linear iteration loop overrode early short-circuit routes (like underage or low BMI rejections) by evaluating unreached downstream screens. Refactored the core execution router (`determineCurrentActiveScreen`) into a clean, recursive state-machine pattern that dynamically follows branching targets and halts exactly at base validation boundaries, passing all Vitest test blocks.