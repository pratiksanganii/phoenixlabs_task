Read `AGENTS.md` before starting.

We are setting up Playwright E2E automation tests at the monorepo root to validate the execution loop across `apps/web` (Next.js), `apps/api` (NestJS), and the persistence layer.

### ⚙️ Environment & Configuration Requirements
- **Root Setup:** Install and configure `@playwright/test` at the monorepo root level.
- **Global Web Server Hooks:** Configure `playwright.config.ts` to automatically spin up both development workspace servers concurrently using `webServer` blocks:
  - Frontend target: `http://localhost:3000`
  - Backend API target: `http://localhost:3001`
- **Isolation Boundaries:** Tests must run against a live local test database environment. Use data-testid selectors (`data-testid="input-age"`, `data-testid="btn-next"`, etc.) exclusively to ensure test runs are entirely independent of copy updates or visible UI strings.

---

### 🧪 Test Suite Specifications (`e2e/questionnaire.spec.ts`)

Implement exactly four fully automated end-to-end test blocks using strict async/await configurations:

1. **🏆 Happy-Path Spec (Full Clearance)**
   - Boot up the page at `/`. Click the landing action trigger to generate a clean tracking record.
   - Chronologically step through fields from Screen 1 directly to Screen 15 using default inputs designed to pass validation (e.g., Age 35, Weight 90kg, Height 175cm, No contraindicated health indicators).
   - Advance through each step by typing inputs or selecting choices and clicking the next action button.
   - Assert that upon hitting Screen 15, the standard form interface disappears, and a positive clinical verdict card (`data-testid="status-eligible"`) is successfully displayed on the screen view.

2. **🔄 Mid-Flow Refresh Spec (State Hydration)**
   - Begin a fresh form questionnaire lifecycle and step cleanly until arriving at Screen 7.
   - Select a distinct response option on Screen 7.
   - Trigger a hard browser reload operation via Playwright: `await page.reload();`.
   - Assert that the application triggers a loading skeleton state, fetches the hydration payload, and gracefully leaves the viewport locked on Screen 7 with the previously chosen selection input completely restored and pre-selected.

3. **🛑 Terminal-State Spec (Ineligibility Boundary)**
   - Launch a session lifecycle block. On Screen 1 (Age Input), enter an ineligible age value (e.g., `16`).
   - Click the next action element.
   - Assert that the dynamic router short-circuits forward progression entirely, skips the remaining screens, and drops the viewport onto a terminal ineligibility card dashboard view displaying `data-testid="status-ineligible"`.

4. **⚡ Edge-Case Spec (Conflicting Multi-Select Logic)**
   - Run a session lifecycle block up to the Comorbidities/Symptoms multiselect option group layout.
   - Simulate an aggressive user edge-case by checking both contradictory options concurrently (e.g., Blood Pressure options "Normal" and "Hypertensive Crisis" both toggled to active).
   - **Documented System Decision Rule:** The frontend UI code must immediately throw a visible local validation warning notice (`data-testid="validation-error"`) or automatically clear out the conflicting checkbox choice dynamically.
   - Test Flow: Try to click the next button while both flags are checked, verify that forward execution is actively blocked by the validation container, then uncheck "Normal" and verify that progress resumes normally.

---

###  Check when done
- Executing `npx playwright test` cleanly boots up the dev servers automatically under the hood.
- All 4 integration test scenarios pass completely green across multiple target viewports (Chromium, Firefox, WebKit).
- Zero brittle visible-text selectors (`page.getByText`) are used in the codebase scripts; selectors match explicit `data-testid` properties natively.