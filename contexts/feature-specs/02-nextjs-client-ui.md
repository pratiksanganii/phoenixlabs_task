Read `AGENTS.md` before starting.

We are building the Next.js 15 Client Frontend Layer inside `apps/web` alongside the shared presentation design system components inside `packages/ui`. The entire questionnaire lifecycle must execute on a single physical route (`/`) by dynamically updating layout layers rather than triggering browser route transitions.

### 🌐 State Machine & Network Optimization Rules
- **Contract Boundary:** Consume the unified backend `SessionStateResponse` signature for all states.
- **Hydration Sync:** On initial mount, look for a `phoenix_session_id` in `localStorage`. If found, trigger a loading skeleton and fetch `GET /api/session/:id` to fully restore the user's progress. If missing, render the initial landing/welcome layer.
- **The Navigation Flow:** - **Back Button:** Handled 100% locally on the client. Pop the last `ScreenId` off a frontend tracking array stack (`screenHistory`) and shift the active viewport immediately (0ms network delay). Input fields must auto-populate with the cached values found in the `answers` state map.
  - **Next Button:** Always issue a `POST /api/session/answer` block to clear boundary validation on the server. The backend will automatically short-circuit database writes for un-modified inputs, ensuring network speed while keeping state strictly synchronized.

---

### 🎨 Part 1: Shared Primitives Audit & Creation (`packages/ui`)

Before building frontend presentation screens, verify that `packages/ui` exports these cohesive, headless/styled design system primitives built with Tailwind and Lucide icons. If they are missing, generate them matching a premium, accessible medical dark-mode design system:

- **`Card` / `CardContent` / `CardFooter`:** Structural containers featuring soft borders, dark slate backgrounds, and smooth layout padding.
- **`Input`:** Tailored for numeric screen entry (Age, Weight, Height) with support for typography prefix/suffix labels (e.g., "years", "kg", "cm"), clean focused rings, and native error highlights.
- **`RadioGroup` / `RadioOption`:** Single-selection input wrappers for options like Boolean questions ("Yes", "No"). Must highlight the active selected option box with distinct border transitions.
- **`CheckboxGroup` / `CheckboxOption`:** Multi-selection lists for medical symptoms and tracking options, managing simple arrays natively under the hood.
- **`Button`:** Standardized layout actions supporting a primary solid style (Next), an outlined clean style (Back), and explicit loading states (spinners) during network requests.

---

### 🏗️ Part 2: Monorepo Client Viewport Topology (`apps/web`)

Implement the multi-step questionnaire layout strictly across these designated architectural boundaries under `apps/web/src/`:

1. **`context/FormWizardContext.tsx`**
   - The master state engine wrapper. Manages the active `sessionId`, the current `activeScreenId`, a client-side duplicate of the `answers` payload object, and the chronological navigation path array (`screenHistory: ScreenId[]`).
   - Exposes clear operational state hooks: `goToNextStep(nextScreenId, updatedAnswers)` and `goBackToPreviousStep()`.

2. **`components/form/QuestionRenderer.tsx`**
   - A centralized, configuration-driven layout manager component. It maps the active `ScreenId` string enum cleanly to the matching design primitives from `@phoenix/ui` (e.g., mapping `ScreenId.AGE` to an `<Input type="number" suffix="years" />`).
   - Keeps the core route clean and small, completely eliminating the need for 15 separate file wrappers.

3. **`app/page.tsx`**
   - The single-route application frame. Wraps the screen view inside the global state context provider.
   - Layout Framework: Contains a single clean wizard wrapper featuring a dynamic medical-card layout, header step indicators (e.g., "Question 3 of 12"), fluid loading animations, and the main button navigation footer bar.
   - **Terminal State Layout:** If `activeScreenId === 'FINAL_SCREEN'`, completely strip the standard navigation bars and display a gorgeous clinical diagnosis dashboard block parsing the backend `evaluationResult` (Green card for Eligible, Red for Ineligible, and Soft Yellow for Manual Clinical Review).

---

###  Check when done
- Local storage hydration restores user screen boundaries perfectly during page refreshes (F5 events).
- Back buttons execute with zero loading states, restoring previous input selection values instantly from client memory.
- Forward progress buttons trigger loading state transitions cleanly on individual button instances while calculating downstream steps.
- `packages/ui` exports all necessary components natively, ensuring unified dark-mode medical styling elements are shared cleanly across the workspace.
- Running the workspace application compiles with zero cross-package TypeScript layout linting warnings.