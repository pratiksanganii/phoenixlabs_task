# Architecture Context

## Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| Framework | Next.js 15 (App Router) + TypeScript 5 | Patient-facing client frontend with optimized page loading and hydration. |
| API Service | NestJS 11 + TypeScript 5 | High-performance, concurrent backend managing lifecycle session states and endpoints. |
| Core Logic | Shared `@phoenix/form-engine` | Decoupled workspace package housing form JSON definitions and pure evaluation functions. |
| UI Framework | Tailwind 4 + Shared `@phoenix/ui` | Semantic styling primitives conforming strictly to WCAG 2.1 AA accessibility guidelines. |
| Database | Prisma 6 + PostgreSQL 15 | Highly durable data storage processing atomic state changes and audit trails. |
| Unit Testing | Vitest 4  | Pure business rule verification and NestJS module mocking providing 100% branch coverage. |
| E2E Testing | Playwright Test 1.x  | Cross-browser workflow testing for happy-path, state refresh, and edge-case behaviors. |

## System Boundaries

- `apps/web` — Patient-facing Next.js application : interactive dynamic form view, accessibility components , local tracking state, and validation error alerting.
- `apps/api` — Stateful NestJS request handlers : route controllers handling session initialization, saving answers , tracking mutations, and interfacing with PostgreSQL via Prisma.
- `packages/form-engine` — Isolated, zero-dependency business tier : maintains strict TypeScript schemas , visibility rules, and the pure cascade scoring evaluator.
- `packages/ui` — Reusable, accessible presentation objects : handles native element bindings , keyboard focus navigation loops , and centralized Tailwind v4 style setups.

## Storage Model

- **Session Table**: Tracks active tracking records using UUID tokens as primary keys, saving the latest consolidated JSON answer string of all fields answered up to that moment.
- **SessionHistory Table**: Append-only transaction log recording individual screen data adjustments to build an immutable audit trail of user pathways over time.
- Field parameters like `currentScreenId` or progress metrics are computed dynamically at runtime from the keys present in the data structures, removing stale out-of-sync bugs.
- Session records and historical logs are maintained safely inside PostgreSQL. No information is saved to local media files or object spaces.

## Session and Multi-User Model

- Forms run entirely on anonymous, secure tracking identities without requiring explicit login accounts or profile generation to optimize completion rates.
- Unique session tracking tokens are generated securely on the backend database layer via `POST /api/session/start`.
- Browser `localStorage` caches the session ID on the client side. If a browser tab refresh occurs, the client invokes `GET /api/session/:id` to fully restore the user's progress.
- Isolated database records grouped around individual UUID primary keys ensure total concurrency safety without database row contention when multiple users submit forms simultaneously.

## Clinical Form & Evaluation Model

### Traversal Logic
- Interface generation is driven by a comprehensive structural JSON schema detailing descriptive queries, options, input requirements, and conditional metadata.
- Standard mathematical conversions are calculated at run time to evaluate physiological states ($BMI = \text{weight} / (\text{height}/100)^2$).

### Outcome Evaluation
- Inputs are evaluated across cascading conditional branches inside an isolated, testable pure function.
- **Immediate Ineligibility:** Hard clinical contraindications (Age < 18, BMI < 25, Pregnancy, or HbA1c > 9.0) short-circuit navigation and end the form instantly.
- **Clinical Review Flags:** Moderate risk indicators (Age > 75, BMI ≥ 40, concurrent conditions ≥ 3, active GLP-1 therapy, or high blood pressure readings) are tracked silently. The patient completes the entire questionnaire so clinicians receive a comprehensive chart for downstream analysis.

## Invariants

1. Request controllers never run or store calculations directly—evaluation rules reside exclusively within the pure `@phoenix/form-engine` package.
2. Database actions processing incoming question answers must commit changes across the snapshot and history tables inside a unified atomic transaction block.
3. Every input component must implement semantic HTML tags associated with accessible label definitions, keyboard navigability, and clear test tags.
4. Interactive option screens that accept multiple selections (like Blood Pressure) default to the highest risk category checked to ensure strict patient safety.