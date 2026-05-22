# Phoenix Questionnaire Monorepo

A high-performance, accessible, single-route medical questionnaire application built inside a modern TypeScript monorepo.

This platform securely screens patients for clinical eligibility while maintaining sub-millisecond local state transitions and robust server-side state synchronization.

---

# 🏗️ Architecture & Topology

The project is structured as an npm workspaces monorepo to isolate core business logic from presentation and delivery layers.

## Applications


| Workspace              | Description                                                  | Port   |
| ---------------------- | ------------------------------------------------------------ | ------ |
| `apps/api`             | NestJS 11 backend API                                        | `3001` |
| `apps/web`             | Next.js 15 frontend application                              | `3000` |
| `packages/form-engine` | Pure TypeScript finite state machine & clinical rules engine | —      |
| `packages/ui`          | Shared headless/Tailwind UI primitives                       | —      |
| `context`              | Architecture blueprints & feature specifications             | —      |


---

# ⚙️ Key Architectural Decisions

## 1. Shared Single Source of Truth (`packages/form-engine`)

### Decision

All questionnaire metadata, sequencing logic, validation rules, and clinical thresholds live inside a dedicated pure TypeScript package.

### Trade-off

This requires a lightweight compilation step during development and CI:

```bash
npm run build --workspace=@phoenixlabs/form-engine
```

However, it guarantees that both the NestJS API and Next.js frontend consume identical schemas, types, and scoring logic without duplication.

---

## 2. Single-Route Dynamic Wizard (`apps/web`)

### Decision

The entire 15-screen questionnaire runs on a single physical route (`/`) using a configuration-driven `QuestionRenderer`.

### Trade-off

This increases client-side state complexity slightly, but eliminates unnecessary route transitions and enables:

- Instant back-button rendering
- Zero network delay navigation
- No broken intermediate URL states

---

## 3. React Context for Local Form State

### Decision

Native React Context (`FormWizardContext`) manages form progression, cached answers, and navigation history.

### Trade-off

Context updates trigger re-renders for consuming components. However, because only a single question card renders at any given time, the render tree remains extremely small and performant.

Benefits include:

- 0 KB third-party state-management dependencies
- Predictable rendering behavior
- Smooth 60fps interactions

---

## 4. Cross-Platform Native Binding Synchronization

### Decision

Explicit architecture-specific bindings are declared for native toolchains such as:

- `rolldown`
- `lightningcss`
- `@tailwindcss/oxide`

### Trade-off

The lockfile becomes slightly larger, but this eliminates platform inconsistencies between:

- Windows development machines
- Ubuntu/Linux CI runners

---

# ⚡ Performance Considerations

## Local-First Back Navigation

When a user clicks **Back**, the application restores state directly from local memory without any API interaction.

Result:

- Zero-latency UX
- Instant question restoration

---

## Idempotent State Synchronization

Advancing forward triggers:

```http
POST /api/session/answer
```

The backend short-circuits database writes when payloads match existing state, minimizing unnecessary I/O while maintaining strict validation guarantees.

---

## Transient Hydration Recovery

On initial mount, the frontend checks for a persisted:

```txt
phoenix_session_id
```

If found:

- A lightweight skeleton UI renders immediately
- Progress hydrates from the database in the background
- Users never lose progress after accidental refreshes

---

# 🚀 Getting Started

## Prerequisites

- Node.js `v22+`
- PostgreSQL database / Docker

---

# 1. Environment Configuration

Create a root-level `.env` file:

```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phoenix_test?schema=public"
CORS_ORIGIN="http://localhost:3000"
```

---

# 2. Install Dependencies

From the repository root:

```bash
npm install
```

---

# 3. Spin Up Local Database (If using Docker for Database)

Launch the dockerized PostgreSQL container in the background:

```bash
docker compose up -d
```

---

# 4. Generate Database Schema

Push Prisma schema definitions to PostgreSQL:

```bash
npm run db:push --workspace=api
```

---

# 5. Build Shared Packages

Compile the shared form engine package:

```bash
npm run build --workspace=@phoenixlabs/form-engine
```

---

# 6. Start Development Servers

Start all workspaces simultaneously:

```bash
npm run dev
```

Or start services individually:

```bash
# Backend API
npm run start:dev --workspace=api

# Frontend
npm run dev --workspace=web
```

---

# 🧪 Testing Pipeline

The project uses a layered testing strategy for fast-failing validation and regression safety.

---

## Unit & Core Logic Tests

Validates:

- Screening rules
- Mathematical evaluators
- State transitions

```bash
npm run test --workspace=@phoenixlabs/form-engine
```

---

## Backend Integration Tests

Validates:

- API endpoints
- Session persistence
- Controller validation

```bash
npm run test --workspace=api
```

---

## End-to-End Tests (Playwright)

Runs multi-browser workflow simulations across:

- Chromium
- Firefox
- WebKit

Coverage includes:

- Happy paths
- Mid-flow refresh recovery
- Ineligibility flows
- Multi-select conflict handling

⚠️ IMPORTANT PORT CONFLICT NOTE: Playwright's config handles spinning up its own isolated backend and frontend instances dynamically. You must kill your active local development servers (npm run dev) before running E2E tests, otherwise Playwright will crash with an EADDRINUSE: :::3001 error.

### First-Time Setup

```bash
npx playwright install --with-deps
```

### Execute E2E Suite

```bash
npm run test:e2e
```

---

# 🔄 Continuous Integration

GitHub Actions automatically validates every pull request against `main` and `master`.

CI workflow responsibilities include:

- Spinning up isolated PostgreSQL containers
- Restoring dependency + Playwright caches
- Building workspace dependencies
- Running core engine tests
- Executing backend integration suites
- Running Playwright cross-browser matrices

This guarantees high-confidence regression protection before merge.

---

# 📦 Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- TailwindCSS

## Backend

- NestJS 11
- Prisma
- PostgreSQL

## Tooling

- npm Workspaces
- Vitest
- Playwright
- ESLint
- Prettier

---

# 📄 License

Private/Internal Project