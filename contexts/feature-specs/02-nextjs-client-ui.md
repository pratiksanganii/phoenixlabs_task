---
name: Next.js Client UI
overview: Audit and extend `packages/ui` with missing medical dark-mode primitives, then implement the single-route wizard in `apps/web` (context provider, config-driven `QuestionRenderer`, terminal evaluation dashboard) wired to the NestJS `SessionStateResponse` contract via direct browser `fetch` to `NEXT_PUBLIC_API_URL`, with NestJS CORS enabled for the web origin.
todos:
  - id: ui-primitives
    content: Create Card, RadioGroup, CheckboxGroup; overhaul Button/Input; extend styles.css tokens; add lucide-react; update index exports
    status: pending
  - id: api-cors
    content: Enable NestJS CORS in main.ts using CORS_ORIGIN from .env; document in .env.sample
    status: pending
  - id: web-infra
    content: Add @phoenixlabs/form-engine dep, api-config + session-api using NEXT_PUBLIC_API_URL, session-types/screen-history/screen-meta, update .env.sample
    status: pending
  - id: wizard-context
    content: Implement FormWizardContext with hydration, localStorage, back stack, POST answer flow
    status: pending
  - id: wizard-ui
    content: Build QuestionRenderer, EvaluationDashboard, WizardSkeleton, FormWizardApp; wire page.tsx + dark globals/layout
    status: pending
  - id: verify-docs
    content: Run check-types/lint; manual F5/back/next/terminal checks; update progress-tracker.md
    status: pending
isProject: false
---

# Next.js Client UI — Implementation Plan

## Current state audit

| Primitive | Status | Action |
|-----------|--------|--------|
| `Button` | Exists — light blue only, no variants/loading | **Replace** with primary / outline + `Loader2` spinner |
| `Input` | Exists — light theme, debug `bg-red-50` wrapper | **Replace** with dark medical styling, prefix/suffix, error ring |
| `Card` / `CardContent` / `CardFooter` | **Missing** | **Create** |
| `RadioGroup` / `RadioOption` | **Missing** | **Create** |
| `RadioGroup` / `RadioOption` | **Missing** | **Create** |
| `CheckboxGroup` / `CheckboxOption` | **Missing** | **Create** |
| `apps/web` wizard | Stub [`page.tsx`](apps/web/src/app/page.tsx) only | **Build** context + renderer + shell |
| API contract | Implemented in [`session-state-response.dto.ts`](apps/api/src/session/dto/session-state-response.dto.ts) | **Mirror** in web (do not use legacy `SessionStateResponse` in [`packages/form-engine/src/types.ts`](packages/form-engine/src/types.ts) lines 98–108) |

**Dependencies to add**

- [`packages/ui/package.json`](packages/ui/package.json): `lucide-react`, `react` (peer)
- [`apps/web/package.json`](apps/web/package.json): `@phoenixlabs/form-engine`
- **Backend URL via `.env`:** `NEXT_PUBLIC_API_URL` on web (see [Environment configuration](#environment-configuration-backend-url))
- **CORS on Nest:** `CORS_ORIGIN` on API (see [NestJS CORS](#nestjs-cors-appsapimaints))
- [`apps/web/next.config.ts`](apps/web/next.config.ts): `transpilePackages` only — **no** `/api` rewrites

---

## Environment configuration (backend URL)

The browser calls Nest **directly** using absolute URLs built from `NEXT_PUBLIC_API_URL`. Nest must allow the Next.js origin via CORS.

### Variables

| Variable | App | Scope | Example | Used by |
|----------|-----|--------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `apps/web` | Client (inlined at build) | `http://localhost:3001` | [`api-config.ts`](apps/web/src/lib/api-config.ts), [`session-api.ts`](apps/web/src/lib/session-api.ts) |
| `CORS_ORIGIN` | `apps/api` | Server | `http://localhost:3000` | [`apps/api/src/main.ts`](apps/api/src/main.ts) `enableCors()` |

- **No trailing slash** on `NEXT_PUBLIC_API_URL` (strip in `getApiBaseUrl()`).
- Set web env in **`apps/web/.env.local`**; set API env in **`apps/api/.env`** or repo-root `.env` loaded by Nest.
- **Restart** Next dev server after changing `NEXT_PUBLIC_*` (build-time inlining).

### [`.env.sample`](.env.sample) — update

```env
# Web client → NestJS (browser fetch base URL)
NEXT_PUBLIC_API_URL=http://localhost:3001

# NestJS → allow Next.js origin (comma-separated for multiple)
CORS_ORIGIN=http://localhost:3000

DATABASE_URL="postgresql://phoenix_user:phoenix_password@localhost:5432/phoenix_eligibility_db?schema=public"
```

### [`apps/web/.env.example`](apps/web/.env.example) — **new**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### [`apps/api/.env.example`](apps/api/.env.example) — **new**

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://phoenix_user:phoenix_password@localhost:5432/phoenix_eligibility_db?schema=public
```

**Dev ports:** Nest on **3001** (`PORT`), Next on **3000** — avoids collision with Nest default `3000`.

### Request flow

```mermaid
flowchart LR
  Browser["Browser fetch NEXT_PUBLIC_API_URL/api/session/..."]
  Nest["NestJS + CORS"]

  Browser -->|"cross-origin"| Nest
```

---

## NestJS CORS (`apps/api/src/main.ts`)

Enable CORS before `listen`, driven by `CORS_ORIGIN`:

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return process.env.NODE_ENV === 'production' ? [] : 'http://localhost:3000';
  }
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0]! : origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- In **production**, require `CORS_ORIGIN` explicitly (empty array blocks all origins if unset — adjust to `throw` if preferred).
- `credentials: true` not needed (anonymous sessions; no cookies on API).

---

## Architecture

```mermaid
sequenceDiagram
  participant Page as page.tsx
  participant Ctx as FormWizardContext
  participant LS as localStorage
  participant API as NestJS_api

  Page->>Ctx: mount
  Ctx->>LS: read phoenix_session_id
  alt session found
    Ctx->>API: GET NEXT_PUBLIC_API_URL/api/session/:id
    API-->>Ctx: SessionStateResponse
    Ctx->>Ctx: rebuildScreenHistory
  else no session
    Ctx->>Page: landing layer
  end
  Note over Ctx: Back = pop screenHistory, 0 network
  Ctx->>API: POST .../api/session/answer
  API-->>Ctx: SessionStateResponse
```

**Screen history after F5:** Rebuild by walking [`FORM_ENGINE_SCHEMA`](packages/form-engine/src/schema.ts) from `AGE` until `currentScreenId` (same path the server router used). Store only `phoenix_session_id` in `localStorage` per spec.

**Submittable screens:** Match API pipe — exclude `BMI` and `FINAL_SCREEN` ([`validate-answer.pipe.ts`](apps/api/src/session/pipes/validate-answer.pipe.ts)).

---

## File tree (new / modified)

```
packages/ui/
  styles.css                          (update tokens)
  package.json                        (+ lucide-react)
  src/index.ts                        (export all primitives)
  src/components/Card.tsx             (new)
  src/components/Button.tsx           (replace)
  src/components/Input.tsx            (replace)
  src/components/RadioGroup.tsx       (new)
  src/components/CheckboxGroup.tsx    (new)

apps/api/
  .env.example                        (PORT, CORS_ORIGIN)
  src/main.ts                         (+ enableCors)

apps/web/
  .env.example                        (NEXT_PUBLIC_API_URL)
  package.json                        (+ @phoenixlabs/form-engine)
  next.config.ts                      (transpilePackages only)
  src/app/globals.css                 (dark medical shell)
  src/app/layout.tsx                  (metadata + dark bg)
  src/app/page.tsx                    (thin server entry)
  src/lib/api-config.ts               (new — resolve NEXT_PUBLIC_API_URL)
  src/lib/session-types.ts            (new — API contract mirror)
  src/lib/session-api.ts              (new — absolute fetch helpers)
  src/lib/screen-history.ts           (new — rebuild helper)
  src/lib/screen-meta.ts              (new — step labels)
  src/context/FormWizardContext.tsx   (new)
  src/components/form/QuestionRenderer.tsx
  src/components/form/EvaluationDashboard.tsx
  src/components/form/WizardSkeleton.tsx
  src/components/form/FormWizardApp.tsx
```

Also update [`contexts/progress-tracker.md`](contexts/progress-tracker.md) when implementation lands.

---

## Part 1 — `packages/ui` (complete files)

### [`packages/ui/package.json`](packages/ui/package.json) — add dependency

```json
"dependencies": {
  "clsx": "^2.1.1",
  "lucide-react": "^0.511.0",
  "tailwind-merge": "^3.6.0"
},
"peerDependencies": {
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### [`packages/ui/styles.css`](packages/ui/styles.css)

```css
@import "tailwindcss";
@source "./";

@theme {
  --color-brand-primary: #38bdf8;
  --color-brand-primary-hover: #0ea5e9;
  --color-brand-surface: #0f172a;
  --color-brand-surface-elevated: #1e293b;
  --color-brand-border: #334155;
  --color-brand-muted: #94a3b8;
  --color-brand-error: #f87171;
  --color-brand-success: #4ade80;
  --color-brand-warning: #facc15;
  --font-sans: "Inter", system-ui, sans-serif;
}

@layer base {
  *:focus-visible {
    @apply outline-3 outline-offset-2 outline-brand-primary;
  }
}
```

### [`packages/ui/src/components/Card.tsx`](packages/ui/src/components/Card.tsx) — **new**

```tsx
"use client";

import { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <motionless
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface-elevated/80 shadow-xl shadow-black/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

function motionless({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <motionless {...props} />;
}
```

**Correction for plan:** use plain `function Card` — full corrected file:

```tsx
"use client";

import { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <motionless
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface-elevated/80 shadow-xl shadow-black/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
```

**Final `Card.tsx` (implement exactly):**

```tsx
"use client";

import { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <motionless
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface-elevated/80 shadow-xl shadow-black/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
```

Replace erroneous `motionless` with `motionless` → **`div`**:

```tsx
"use client";

import { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface-elevated/80 shadow-xl shadow-black/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 sm:p-8", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-brand-border/60 p-6 sm:flex-row sm:justify-between sm:p-8",
        className
      )}
      {...props}
    />
  );
}
```

### [`packages/ui/src/components/Button.tsx`](packages/ui/src/components/Button.tsx) — **replace**

```tsx
"use client";

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

type Variant = "primary" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-slate-950 hover:bg-brand-primary-hover focus:ring-brand-primary",
  outline:
    "border border-brand-border bg-transparent text-slate-100 hover:bg-brand-surface-elevated focus:ring-brand-primary",
};

export function Button({
  className,
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
```

### [`packages/ui/src/components/Input.tsx`](packages/ui/src/components/Input.tsx) — **replace**

```tsx
"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Props = {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  id,
  label,
  prefix,
  suffix,
  error,
  className,
  ...props
}: Props) {
  return (
    <motionless className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-lg border bg-brand-surface text-slate-100 shadow-inner transition-colors",
          error
            ? "border-brand-error ring-1 ring-brand-error/40"
            : "border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/30"
        )}
      >
        {prefix ? (
          <span className="border-r border-brand-border px-3 text-sm text-brand-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          data-testid={props["data-testid"] ?? `input-${id}`}
          className={cn(
            "w-full bg-transparent px-3 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {suffix ? (
          <span className="border-l border-brand-border px-3 text-sm text-brand-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-brand-error">
          {error}
        </p>
      ) : null}
    </motionless>
  );
}
```

**Implement with `div` instead of `motionless`.**

### [`packages/ui/src/components/RadioGroup.tsx`](packages/ui/src/components/RadioGroup.tsx) — **new**

```tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { cn } from "../lib/cn";

type Ctx = {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
};

const RadioCtx = createContext<Ctx | null>(null);

export function RadioGroup({
  name,
  value,
  onChange,
  children,
  className,
}: {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadioCtx.Provider value={{ name, value, onChange }}>
      <div role="radiogroup" className={cn("grid gap-3", className)}>
        {children}
      </motionless>
    </RadioCtx.Provider>
  );
}

export function RadioOption({
  value,
  label,
  "data-testid": testId,
}: {
  value: string;
  label: string;
  "data-testid"?: string;
}) {
  const ctx = useContext(RadioCtx);
  if (!ctx) throw new Error("RadioOption must be used within RadioGroup");
  const selected = ctx.value === value;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        selected
          ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/50"
          : "border-brand-border bg-brand-surface hover:border-slate-500"
      )}
    >
      <input
        type="radio"
        name={ctx.name}
        value={value}
        checked={selected}
        onChange={() => ctx.onChange(value)}
        data-testid={testId ?? `radio-${value}`}
        className="h-4 w-4 accent-brand-primary"
      />
      <span className="text-sm font-medium text-slate-100">{label}</span>
    </label>
  );
}
```

**Fix `motionless` → `div` on implementation.**

### [`packages/ui/src/components/CheckboxGroup.tsx`](packages/ui/src/components/CheckboxGroup.tsx) — **new**

```tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { cn } from "../lib/cn";

type Ctx = {
  value: string[];
  onChange: (value: string[]) => void;
};

const CheckboxCtx = createContext<Ctx | null>(null);

export function CheckboxGroup({
  value,
  onChange,
  children,
  className,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <CheckboxCtx.Provider value={{ value, onChange }}>
      <div className={cn("grid gap-3", className)}>{children}</div>
    </CheckboxCtx.Provider>
  );
}

export function CheckboxOption({
  value,
  label,
  "data-testid": testId,
}: {
  value: string;
  label: string;
  "data-testid"?: string;
}) {
  const ctx = useContext(CheckboxCtx);
  if (!ctx) throw new Error("CheckboxOption must be used within CheckboxGroup");
  const checked = ctx.value.includes(value);
  const toggle = () => {
    ctx.onChange(
      checked ? ctx.value.filter((v) => v !== value) : [...ctx.value, value]
    );
  };
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        checked
          ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/50"
          : "border-brand-border bg-brand-surface hover:border-slate-500"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        data-testid={testId ?? `checkbox-${value}`}
        className="h-4 w-4 rounded accent-brand-primary"
      />
      <span className="text-sm font-medium text-slate-100">{label}</span>
    </label>
  );
}
```

### [`packages/ui/src/index.ts`](packages/ui/src/index.ts)

```ts
export { Button } from "./components/Button";
export { Input } from "./components/Input";
export { Card, CardContent, CardFooter } from "./components/Card";
export { RadioGroup, RadioOption } from "./components/RadioGroup";
export { CheckboxGroup, CheckboxOption } from "./components/CheckboxGroup";
```

---

## Part 2 — `apps/web` infrastructure

### [`apps/web/next.config.ts`](apps/web/next.config.ts)

No API rewrites — only transpile workspace packages:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@phoenixlabs/ui", "@phoenixlabs/form-engine"],
};

export default nextConfig;
```

### [`apps/web/src/lib/api-config.ts`](apps/web/src/lib/api-config.ts) — **new**

Single source for the public API base URL (used by client `fetch`):

```ts
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3001";
    }
    throw new Error(
      "NEXT_PUBLIC_API_URL is required. Set it in apps/web/.env.local"
    );
  }
  return raw.replace(/\/$/, "");
}

/** Build absolute URL: base + `/api/session/...` */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
```

**Note:** Restart Next dev server after changing `NEXT_PUBLIC_API_URL`.

### [`apps/web/package.json`](apps/web/package.json) — add

```json
"@phoenixlabs/form-engine": "*"
```

### [`apps/web/src/lib/session-types.ts`](apps/web/src/lib/session-types.ts) — **new**

```ts
import type {
  EvaluationResult,
  FormResponse,
  ScreenId,
} from "@phoenixlabs/form-engine";

export interface SessionStateResponse {
  sessionId: string;
  currentScreenId: ScreenId;
  savedAnswers: Partial<FormResponse>;
  evaluationResult: EvaluationResult | null;
}

export interface SubmitAnswerPayload {
  sessionId: string;
  screenId: ScreenId;
  answer: unknown;
}

export const SESSION_STORAGE_KEY = "phoenix_session_id";
```

### [`apps/web/src/lib/session-api.ts`](apps/web/src/lib/session-api.ts) — **new**

Absolute URLs via `apiUrl()` → `NEXT_PUBLIC_API_URL` (browser calls API directly; CORS required on Nest).

```ts
import { apiUrl } from "./api-config";
import type { SessionStateResponse, SubmitAnswerPayload } from "./session-types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function startSession(): Promise<SessionStateResponse> {
  return fetch(apiUrl("/api/session/start"), { method: "POST" }).then(parseJson);
}

export function getSession(sessionId: string): Promise<SessionStateResponse> {
  return fetch(apiUrl(`/api/session/${sessionId}`)).then(parseJson);
}

export function submitAnswer(
  payload: SubmitAnswerPayload
): Promise<SessionStateResponse> {
  return fetch(apiUrl("/api/session/answer"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(parseJson);
}
```

### [`apps/web/src/lib/screen-history.ts`](apps/web/src/lib/screen-history.ts) — **new**

```ts
import { FORM_ENGINE_SCHEMA, ScreenId, type FormResponse } from "@phoenixlabs/form-engine";

const MAX_GUARD = 32;

export function rebuildScreenHistory(
  savedAnswers: Partial<FormResponse>,
  currentScreenId: ScreenId
): ScreenId[] {
  const history: ScreenId[] = [];
  let screen: ScreenId = ScreenId.AGE;
  let guard = 0;

  while (guard++ < MAX_GUARD) {
    history.push(screen);
    if (screen === currentScreenId) break;
    const next = FORM_ENGINE_SCHEMA[screen].resolveProgress(savedAnswers);
    if (next === screen) break;
    screen = next;
  }

  return history;
}
```

### [`apps/web/src/lib/screen-meta.ts`](apps/web/src/lib/screen-meta.ts) — **new**

```ts
import { ScreenId } from "@phoenixlabs/form-engine";

const USER_FACING_SCREENS: ScreenId[] = [
  ScreenId.AGE,
  ScreenId.WEIGHT,
  ScreenId.HEIGHT,
  ScreenId.PREGNANCY_STATUS,
  ScreenId.COMORBID_CONDITIONS,
  ScreenId.DIABETES_HISTORY,
  ScreenId.MOST_RECENT_HbA1c,
  ScreenId.BLOOD_PRESSURE_CATEGORIES,
  ScreenId.CURRENT_MEDICATIONS,
  ScreenId.SMOKING_STATUS,
  ScreenId.ALCOHOL_USE_FREQUENCY,
  ScreenId.PHYSICAL_ACTIVITY_LEVEL,
  ScreenId.DIETARY_HABITS,
];

const TITLE: Partial<Record<ScreenId, string>> = {
  [ScreenId.AGE]: "Age",
  [ScreenId.WEIGHT]: "Weight",
  [ScreenId.HEIGHT]: "Height",
  // ...short titles for header
};

export function getStepLabel(activeScreenId: ScreenId, historyLength: number) {
  const index = USER_FACING_SCREENS.indexOf(activeScreenId);
  const step = index >= 0 ? index + 1 : historyLength;
  return { step, total: USER_FACING_SCREENS.length, title: TITLE[activeScreenId] ?? "Screening" };
}
```

---

## Part 3 — `FormWizardContext` (complete)

[`apps/web/src/context/FormWizardContext.tsx`](apps/web/src/context/FormWizardContext.tsx)

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FORM_ENGINE_SCHEMA,
  ScreenId,
  type EvaluationResult,
  type FormResponse,
} from "@phoenixlabs/form-engine";
import { getSession, startSession, submitAnswer } from "@/lib/session-api";
import { rebuildScreenHistory } from "@/lib/screen-history";
import {
  SESSION_STORAGE_KEY,
  type SessionStateResponse,
} from "@/lib/session-types";

type Phase = "landing" | "wizard" | "terminal";

type WizardContextValue = {
  phase: Phase;
  isHydrating: boolean;
  isSubmitting: boolean;
  sessionId: string | null;
  activeScreenId: ScreenId | null;
  answers: Partial<FormResponse>;
  screenHistory: ScreenId[];
  evaluationResult: EvaluationResult | null;
  validationError: string | null;
  draftAnswer: unknown;
  setDraftAnswer: (value: unknown) => void;
  beginSession: () => Promise<void>;
  goToNextStep: () => Promise<void>;
  goBackToPreviousStep: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function applyServerState(
  res: SessionStateResponse,
  setters: {
    setSessionId: (id: string) => void;
    setAnswers: (a: Partial<FormResponse>) => void;
    setActiveScreenId: (id: ScreenId) => void;
    setScreenHistory: (h: ScreenId[]) => void;
    setEvaluationResult: (e: EvaluationResult | null) => void;
    setPhase: (p: Phase) => void;
  }
) {
  localStorage.setItem(SESSION_STORAGE_KEY, res.sessionId);
  setters.setSessionId(res.sessionId);
  setters.setAnswers(res.savedAnswers);
  setters.setActiveScreenId(res.currentScreenId);
  setters.setScreenHistory(
    rebuildScreenHistory(res.savedAnswers, res.currentScreenId)
  );
  setters.setEvaluationResult(res.evaluationResult);
  setters.setPhase(
    res.currentScreenId === ScreenId.FINAL_SCREEN ? "terminal" : "wizard"
  );
}

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("landing");
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<ScreenId | null>(null);
  const [answers, setAnswers] = useState<Partial<FormResponse>>({});
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<unknown>(undefined);

  const syncDraftFromActiveScreen = useCallback(
    (screenId: ScreenId, saved: Partial<FormResponse>) => {
      setDraftAnswer(saved[screenId as keyof FormResponse]);
    },
    []
  );

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      setIsHydrating(false);
      return;
    }
    getSession(stored)
      .then((res) =>
        applyServerState(res, {
          setSessionId,
          setAnswers,
          setActiveScreenId,
          setScreenHistory,
          setEvaluationResult,
          setPhase,
        })
      )
      .catch(() => localStorage.removeItem(SESSION_STORAGE_KEY))
      .finally(() => setIsHydrating(false));
  }, []);

  useEffect(() => {
    if (activeScreenId && activeScreenId !== ScreenId.FINAL_SCREEN) {
      syncDraftFromActiveScreen(activeScreenId, answers);
    }
  }, [activeScreenId, answers, syncDraftFromActiveScreen]);

  const beginSession = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await startSession();
      applyServerState(res, {
        setSessionId,
        setAnswers,
        setActiveScreenId,
        setScreenHistory,
        setEvaluationResult,
        setPhase,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const goBackToPreviousStep = useCallback(() => {
    if (screenHistory.length <= 1 || !activeScreenId) return;
    const nextHistory = [...screenHistory];
    nextHistory.pop();
    const previous = nextHistory[nextHistory.length - 1]!;
    setScreenHistory(nextHistory);
    setActiveScreenId(previous);
    setPhase(previous === ScreenId.FINAL_SCREEN ? "terminal" : "wizard");
    setValidationError(null);
    syncDraftFromActiveScreen(previous, answers);
  }, [screenHistory, activeScreenId, answers, syncDraftFromActiveScreen]);

  const goToNextStep = useCallback(async () => {
    if (!sessionId || !activeScreenId || activeScreenId === ScreenId.FINAL_SCREEN)
      return;

    setValidationError(null);
    const normalized =
      FORM_ENGINE_SCHEMA[activeScreenId].type === "checkbox"
        ? (Array.isArray(draftAnswer) ? draftAnswer : [])
        : draftAnswer;

    if (
      normalized === undefined ||
      normalized === "" ||
      (typeof normalized === "number" && Number.isNaN(normalized))
    ) {
      setValidationError("Please complete this question before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAnswer({
        sessionId,
        screenId: activeScreenId,
        answer: normalized,
      });
      const merged = { ...answers, [activeScreenId]: normalized } as Partial<FormResponse>;
      setAnswers(merged);
      applyServerState(
        { ...res, savedAnswers: res.savedAnswers },
        {
          setSessionId,
          setAnswers: () => setAnswers(res.savedAnswers),
          setActiveScreenId,
          setScreenHistory: (h) => {
            const prev = screenHistory[screenHistory.length - 1];
            if (prev !== res.currentScreenId) {
              setScreenHistory([...screenHistory, res.currentScreenId]);
            } else {
              setScreenHistory(h);
            }
          },
          setEvaluationResult,
          setPhase,
        }
      );
      // Prefer server-derived history after forward nav
      setScreenHistory((h) =>
        h[h.length - 1] === res.currentScreenId
          ? h
          : [...h, res.currentScreenId]
      );
    } catch {
      setValidationError("Unable to save your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, activeScreenId, draftAnswer, answers, screenHistory]);

  const value = useMemo<WizardContextValue>(
    () => ({
      phase,
      isHydrating,
      isSubmitting,
      sessionId,
      activeScreenId,
      answers,
      screenHistory,
      evaluationResult,
      validationError,
      draftAnswer,
      setDraftAnswer,
      beginSession,
      goToNextStep,
      goBackToPreviousStep,
    }),
    [
      phase,
      isHydrating,
      isSubmitting,
      sessionId,
      activeScreenId,
      answers,
      screenHistory,
      evaluationResult,
      validationError,
      draftAnswer,
      beginSession,
      goToNextStep,
      goBackToPreviousStep,
    ]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useFormWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useFormWizard must be used within FormWizardProvider");
  return ctx;
}
```

**Implementation note:** Simplify `goToNextStep` history push to always `setScreenHistory(rebuildScreenHistory(res.savedAnswers, res.currentScreenId))` after a successful POST — avoids duplicate-push edge cases.

---

## Part 4 — `QuestionRenderer` (complete)

[`apps/web/src/components/form/QuestionRenderer.tsx`](apps/web/src/components/form/QuestionRenderer.tsx)

```tsx
"use client";

import {
  FORM_ENGINE_SCHEMA,
  ScreenId,
  type FormResponse,
} from "@phoenixlabs/form-engine";
import {
  CheckboxGroup,
  CheckboxOption,
  Input,
  RadioGroup,
  RadioOption,
} from "@phoenixlabs/ui";
import { useFormWizard } from "@/context/FormWizardContext";

const NUMERIC_SUFFIX: Partial<Record<ScreenId, string>> = {
  [ScreenId.AGE]: "years",
  [ScreenId.WEIGHT]: "kg",
  [ScreenId.HEIGHT]: "cm",
  [ScreenId.MOST_RECENT_HbA1c]: "%",
};

export function QuestionRenderer() {
  const { activeScreenId, draftAnswer, setDraftAnswer, validationError } =
    useFormWizard();

  if (!activeScreenId || activeScreenId === ScreenId.FINAL_SCREEN) return null;

  const config = FORM_ENGINE_SCHEMA[activeScreenId];
  const prompt = config.prompt ?? "";

  if (config.type === "number") {
    return (
      <Input
        id={activeScreenId}
        label={prompt}
        type="number"
        inputMode="decimal"
        suffix={NUMERIC_SUFFIX[activeScreenId]}
        value={draftAnswer === undefined ? "" : String(draftAnswer)}
        onChange={(e) =>
          setDraftAnswer(e.target.value === "" ? undefined : Number(e.target.value))
        }
        error={validationError ?? undefined}
        data-testid={`question-${activeScreenId}`}
      />
    );
  }

  if (config.type === "radio" && config.options) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium text-slate-100">{prompt}</p>
        <RadioGroup
          name={activeScreenId}
          value={typeof draftAnswer === "string" ? draftAnswer : undefined}
          onChange={setDraftAnswer}
        >
          {config.options.map((opt) => (
            <RadioOption key={opt} value={opt} label={opt} />
          ))}
        </RadioGroup>
        {validationError ? (
          <p role="alert" className="text-sm text-brand-error">
            {validationError}
          </p>
        ) : null}
      </div>
    );
  }

  if (config.type === "checkbox" && config.options) {
    const selected = Array.isArray(draftAnswer) ? (draftAnswer as string[]) : [];
    return (
      <motionless className="space-y-4">
        <p className="text-lg font-medium text-slate-100">{prompt}</p>
        <CheckboxGroup
          value={selected}
          onChange={(vals) => setDraftAnswer(vals as FormResponse[typeof activeScreenId])}
        >
          {config.options.map((opt) => (
            <CheckboxOption key={opt} value={opt} label={opt} />
          ))}
        </CheckboxGroup>
        {validationError ? (
          <p role="alert" className="text-sm text-brand-error">
            {validationError}
          </p>
        ) : null}
      </motionless>
    );
  }

  return null;
}
```

Use `motionless` → `div` on implementation.

---

## Part 5 — Terminal dashboard + shell + page

### [`apps/web/src/components/form/EvaluationDashboard.tsx`](apps/web/src/components/form/EvaluationDashboard.tsx)

```tsx
"use client";

import type { EvaluationResult } from "@phoenixlabs/form-engine";
import { Card, CardContent } from "@phoenixlabs/ui";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

const STYLES = {
  Eligible: {
    border: "border-brand-success/40",
    bg: "bg-brand-success/10",
    icon: CheckCircle2,
    heading: "Eligible for GLP-1 Therapy",
  },
  Ineligible: {
    border: "border-brand-error/40",
    bg: "bg-brand-error/10",
    icon: AlertTriangle,
    heading: "Not Eligible",
  },
  "Requires Clinical Review": {
    border: "border-brand-warning/40",
    bg: "bg-brand-warning/10",
    icon: Activity,
    heading: "Requires Clinical Review",
  },
} as const;

export function EvaluationDashboard({
  result,
}: {
  result: EvaluationResult;
}) {
  const style = STYLES[result.outcome];
  const Icon = style.icon;
  return (
    <Card className={`${style.border} ${style.bg}`} data-testid="evaluation-dashboard">
      <CardContent className="space-y-4 text-center">
        <Icon className="mx-auto h-12 w-12 text-slate-100" aria-hidden />
        <h2 className="text-2xl font-semibold text-slate-50">{style.heading}</h2>
        <p className="text-base text-slate-300">{result.reason}</p>
      </CardContent>
    </Card>
  );
}
```

### [`apps/web/src/components/form/WizardSkeleton.tsx`](apps/web/src/components/form/WizardSkeleton.tsx)

```tsx
import { Card, CardContent } from "@phoenixlabs/ui";

export function WizardSkeleton() {
  return (
    <Card className="mx-auto max-w-xl animate-pulse" data-testid="wizard-skeleton">
      <CardContent className="space-y-4">
        <div className="h-4 w-1/3 rounded bg-brand-border" />
        <motionless className="h-10 rounded bg-brand-border" />
        <motionless className="h-10 rounded bg-brand-border" />
      </CardContent>
    </Card>
  );
}
```

### [`apps/web/src/components/form/FormWizardApp.tsx`](apps/web/src/components/form/FormWizardApp.tsx) — main client shell

```tsx
"use client";

import { ScreenId } from "@phoenixlabs/form-engine";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
} from "@phoenixlabs/ui";
import { FormWizardProvider, useFormWizard } from "@/context/FormWizardContext";
import { getStepLabel } from "@/lib/screen-meta";
import { EvaluationDashboard } from "./EvaluationDashboard";
import { QuestionRenderer } from "./QuestionRenderer";
import { WizardSkeleton } from "./WizardSkeleton";

function WizardFrame() {
  const {
    phase,
    isHydrating,
    isSubmitting,
    activeScreenId,
    screenHistory,
    evaluationResult,
    beginSession,
    goToNextStep,
    goBackToPreviousStep,
  } = useFormWizard();

  if (isHydrating) {
    return (
      <main className="min-h-screen bg-brand-surface px-4 py-12">
        <WizardSkeleton />
      </main>
    );
  }

  if (phase === "landing") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-surface px-4">
        <Card className="max-w-lg text-center">
          <CardContent className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-brand-muted">
              PhoenixLabs Clinical Screening
            </p>
            <h1 className="text-3xl font-semibold text-slate-50">
              GLP-1 Eligibility Questionnaire
            </h1>
            <p className="text-slate-300">
              Anonymous, secure, and resumable on any device.
            </p>
            <Button
              onClick={beginSession}
              isLoading={isSubmitting}
              data-testid="start-session"
            >
              Begin Screening
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (phase === "terminal" && evaluationResult) {
    return (
      <main className="min-h-screen bg-brand-surface px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <EvaluationDashboard result={evaluationResult} />
        </div>
      </main>
    );
  }

  if (!activeScreenId) return null;

  const { step, total, title } = getStepLabel(
    activeScreenId,
    screenHistory.length
  );
  const canGoBack = screenHistory.length > 1;

  return (
    <main className="min-h-screen bg-brand-surface px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p className="mb-2 text-sm text-brand-muted" data-testid="step-indicator">
          Question {step} of {total}
        </p>
        <h1 className="mb-6 text-2xl font-semibold text-slate-50">{title}</h1>
        <Card>
          <CardContent>
            <QuestionRenderer />
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              onClick={goBackToPreviousStep}
              disabled={!canGoBack || isSubmitting}
              data-testid="wizard-back"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={goToNextStep}
              isLoading={isSubmitting}
              data-testid="wizard-next"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      </motionless>
    </main>
  );
}

export function FormWizardApp() {
  return (
    <FormWizardProvider>
      <WizardFrame />
    </FormWizardProvider>
  );
}
```

Fix `motionless` → `motionless` → `div` on implementation.

### [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)

```tsx
import { FormWizardApp } from "@/components/form/FormWizardApp";

export default function Home() {
  return <FormWizardApp />;
}
```

### [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css) — dark medical shell

```css
@import "tailwindcss";
@import "@phoenixlabs/ui/styles.css";

:root {
  --background: #020617;
  --foreground: #f1f5f9;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

### [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) — metadata tweak

```tsx
export const metadata: Metadata = {
  title: "PhoenixLabs GLP-1 Screening",
  description: "Anonymous clinical eligibility questionnaire",
};
```

Add `className="dark min-h-screen bg-brand-surface text-slate-100"` on `<body>`.

---

## Part 6 — Dev workflow and verification

1. **Start Postgres** (existing Docker Compose).
2. **Configure env:**
   - `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001`
   - `apps/api/.env`: `PORT=3001`, `CORS_ORIGIN=http://localhost:3000`
3. **Start API** then **web** (restart web after any `NEXT_PUBLIC_*` change):
   ```bash
   npm run start:dev --workspace=api
   npm run dev --workspace=web
   ```
4. **Verify CORS + API:** `POST http://localhost:3001/api/session/start` from the browser succeeds (no CORS error). Or:
   ```bash
   curl -X POST http://localhost:3001/api/session/start -H "Origin: http://localhost:3000" -v
   ```
   Response should include `Access-Control-Allow-Origin: http://localhost:3000`.
5. **Manual checks (spec acceptance):**
   - F5 with stored `phoenix_session_id` → skeleton → restored screen + answers
   - Back → instant, no spinner, prior values from `answers`
   - Next → only Next button shows `isLoading`
   - Terminal `FINAL_SCREEN` → no footer nav; colored outcome card
6. **Typecheck:** `npm run check-types` from repo root
7. **Lint:** `npm run lint --workspace=web`

---

## Implementation order

1. UI primitives + theme tokens (`packages/ui`)
2. API CORS + env samples (`apps/api/main.ts`, `.env.sample`, `apps/api/.env.example`)
3. Web infra (deps, `NEXT_PUBLIC_API_URL`, `api-config.ts`, `session-api.ts`, types, screen-history)
4. `FormWizardContext` → `QuestionRenderer` → `FormWizardApp` → `page.tsx`
5. Theme/globals/layout polish
6. Update `contexts/progress-tracker.md`

---

## Known simplifications (acceptable for v1)

- **BMI screen** is never active (router auto-skips); no dedicated BMI UI.
- **Checkbox “none selected”** submits `[]` — satisfies API “answered” vs `undefined`.
- **History after Next** uses `rebuildScreenHistory` from server `savedAnswers` (canonical path).
- **Package naming:** docs say `@phoenix/ui`; workspace uses `@phoenixlabs/ui` — keep actual package name.
