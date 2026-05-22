# Engineering Reasoning & Project Write-Up

## ⚙️ Architectural Trade-Offs

### 1. Unified Library Engine vs. Direct Application State
* **Decision:** Isolated all validation, scoring thresholds, and sequencing rules into a standalone, pure TypeScript package (`packages/form-engine`) rather than embedding them directly inside Next.js hooks or NestJS controllers.
* **Reasoning:** While this required extra initial monorepo configuration overhead and a distinct workspace compilation step, it completely eliminated data drift. Both the client interface and the API ingest layer bind to the exact same types and logic schemas, guaranteeing absolute mathematical parity across network boundaries.

### 2. Single-Route Reactive Architecture vs. Page-by-Page Routing
* **Decision:** Chose to render the 15-screen questionnaire entirely on a single physical route (`/`) by dynamically driving viewports through a localized `QuestionRenderer` state wrapper.
* **Reasoning:** Page-by-page URL routing would have required complex server-side middleware or dynamic query-param synchronization to prevent patients from manually skipping forward to unauthorized questions. The single-route wizard architecture provides sub-millisecond local navigation, flawless back-button behavior, and completely blocks broken intermediate URL states.

### 3. Context-Driven UI Redux Alternative
* **Decision:** Utilized native React Context (`FormWizardContext`) for questionnaire state management over a heavier library like Redux Toolkit or Zustand.
* **Reasoning:** Context triggers a full re-render of consuming nodes on change. However, since our single-route layout guarantees that exactly *one* question card is physically present in the DOM at any given millisecond, the render tree remains microscopic. This achieved zero-latency 60fps view transitions while saving valuable bundle size (0 KB third-party state impact).

---

## 🔍 Form Logic Spec Ambiguities & Resolutions

Healthcare platforms require engineers to actively flag gaps in clinical logic rather than filling in blanks silently. Three major unstated edge cases were identified and resolved:

### 🧩 Ambiguity A: The Comorbidities Empty State
* **The Gap:** The specification lists multiple pre-existing condition checkboxes but does not state whether a user can advance with zero selections.
* **Clinical Resolution:** Choosing nothing is a common, valid clinical baseline (meaning the patient has no comorbidities). The engine was designed to allow an empty array `[]` payload to advance safely, treating it as a non-conflicting path that bypasses the "Requires Clinical Review" threshold.

### 🧩 Ambiguity B: Multi-Select Blood Pressure Collisions
* **The Gap:** The Blood Pressure category allows multi-selection, creating a paradox where a user could simultaneously check "Normal (< 120/80)" and "Hypertensive Crisis (>180/>120)".
* **Clinical Resolution:** These states are pathologically mutually exclusive. Rather than allowing a broken payload to hit the database, an aggressive frontend guard was wired into `QuestionRenderer` to immediate flag a `validation-error` snapshot if an exclusive combination is detected, disabling forward navigation until the contradiction is resolved.

### 🧩 Ambiguity C: Terminal Boundaries vs. Final Evaluation Screen
* **The Gap:** The spec dictates that entering certain values (e.g., Age 16) triggers an immediate "Ineligible" status. It is ambiguous whether an ineligible user is stopped mid-flow or allowed to complete all 14 screens.
* **Clinical Resolution:** Allowing an ineligible user to continue entering data is a poor user experience and introduces unnecessary security risk. The engine treats ineligibility as an immediate short-circuit; the moment a terminal rule fires, forward navigation ceases and the viewports seamlessly swap to display the custom `EvaluationDashboard`.

---

## 🤖 AI Tooling: Honest Reflection & Co-Composition

This project was built utilizing **Cursor (Plan/Agent Modes)** and **Gemini 1.5 Pro/Flash APIs** as active engineering co-pilots. 

### 🎯 Specification-Driven SDLC Loop
Rather than writing unstructured, open-ended prompts or letting the AI generate files blindly, a strict, four-step engineering lifecycle was maintained for every feature:

1. **Write Feature Specifications:** Locked down explicit architectural blueprints, API payloads, and database constraints upfront as clean Markdown files inside the `context/feature-specs/` folder.
2. **Cursor Plan Initialization:** Attached the Markdown specification to the agent context and instructed Cursor to generate a structured, multi-file execution plan outlining *exactly* which types, paths, and components would be created or modified.
3. **Human Review & Plan Refinement:** Evaluated the AI's proposal, caught edge cases (such as catching hoisted package conflicts or missing data attributes), and manually adjusted the plan before granting permission to write code.
4. **Agent Build Execution:** Unleashed Cursor in Agent mode to execute the finalized plan. The AI acted purely as an intent-driven compiler, mapping our signed-off requirements into type-safe implementations.

This methodology ensured that human system architecture dictated the codebase layout, minimizing code sprawl and ensuring our E2E testing coverage directly satisfied the clinical design documentation.

### Where AI Significantly Accelerated Velocity:
* **Playwright Orchestration:** Writing multi-browser automation scripts across Chrome, Firefox, and Safari layouts usually involves a lot of boilerplate syntax. Cursor was incredibly fast at translating our explicit Markdown feature specifications into clean, native `page.getByTestId()` locators.
* **GitHub Actions Boilerplate:** Designing the native PostgreSQL Service Container syntax and healthcheck scripts (`pg_isready`) took seconds, whereas configuring that manually usually involves looking up tedious YAML reference guides.

### Where AI Introduced Friction / Slowed Down Progress:
* **The Cross-Platform Native Binary Trap:** Because the project was developed on a Windows host machine but deployed to an Ubuntu-based GitHub Actions runner, the AI repeatedly struggled with native compiler bindings (`rolldown`, `lightningcss`, and `@tailwindcss/oxide`). 
* **The Friction Loop:** The AI repeatedly attempted to run quick console fixes like `npm install --no-save` on the runner, failing to realize that the local `package-lock.json` was aggressively stubbing out the Linux modules as `npm:null@*`. Human intervention was required to break the loop by stepping back, diagnosing the lockfile metadata, and explicitly declaring the native cross-platform modules inside the root `optionalDependencies` manifest.

---

## 🔮 Future Roadmap (What I'd do with another week)

Given an additional week of engineering bandwidth, I would implement the following critical architectural and pipeline enhancements:

1. **Dynamic, Database-Driven Form Engine:** Transition the static configurations inside `packages/form-engine` into a relational or document-based database schema (e.g., a `Questions` and `ValidationRules` table). This decoupled approach separates medical questionnaire layout changes from core code deployments, allowing clinical teams to adjust screening rules via an admin portal without forcing a software release cycle.
2. **Path-Aware, Target-Specific CI Optimizations:** Implement precise change-detection pipeline routing using GitHub Actions path-filters or monorepo tools like Nx/Turborepo. If a Pull Request only touches code inside `apps/api`, the pipeline should bypass testing the isolated `packages/form-engine` suite. This path isolation slashes build times, saves runner computation credits, and speeds up team deployment velocity.
3. **Strict Branch Protection & Automated Gates:** Establish strict branch protection rules on the primary production branch (`main`/`master`). This includes completely blocking direct git pushes, forcing code reviews, and mandating that a Pull Request can only be merged if the entire automated CI quality gate—including cross-browser Playwright matrices and backend Vitest suites—returns a 100% green passing mark.
4. **Incremental Server-Side Draft Saves (Debounced Auto-Save):** Introduce a debounced client-side hook that auto-saves textual input changes (like Weight, Height, or HbA1c) directly to the PostgreSQL database every 2 seconds. This ensures a patient who drops offline mid-sentence recovers 100% of their data upon reconnection.
5. **Audit Log History Trails:** Implement a secondary tracking schema (`SessionHistory`). In compliance-driven clinical environments, auditing *how* and *when* a patient altered their medical answers provides critical tracking safety trails for medical review boards.
6. **Application-Layer Payload Encryption (HIPAA/GDPR Data Privacy):** Implement end-to-end request and response payload encryption (e.g., using AES-256-GCM or JSON Web Encryption (JWE) standards) at the application tier. While standard HTTPS secures transport-layer channels, application-tier encryption ensures that clinical answers and evaluation results remain completely encrypted until processed by active session keys. This guarantees absolute data confidentiality, mitigating risk from man-in-the-middle attacks or logging leaks.

---

## ♿ Accessibility Compliance & Conformance Track

### 1. Semantic fieldset & legend Groupings for Composite Selections
* **The Trajectory:** Many modern UI libraries render Radio Groups and Checkbox Checklist wrappers as a collection of styled `<div>` elements. While visually custom, this practice strips away semantic groupings, leaving screen readers unable to announce the parent question/legend context when navigating options.
* **Resolution:** In our `@phoenixlabs/ui` package, both `RadioGroup` and `CheckboxGroup` were built utilizing native, semantic `<fieldset>` and `<legend>` blocks. Option rows expose standard interactive `<input type="radio">` and `<input type="checkbox">` elements. This provides perfect native screen-reader layout context out of the box.

### 2. Native Keyboard Focus & Auto-Focus Shifts
* **The Trajectory:** Dynamic, single-route forms can confuse assistive devices when a screen changes but focus remains lost or stuck on the "Next" button.
* **Resolution:** 
  1. We wrapped our dynamic question viewport in a semantic HTML `<form>` element, converting the Next button to a standard `type="submit"`. This allows patients to complete text/numeric entries and advance simply by pressing **Enter**—preserving default browser keyboard behavior.
  2. We wired a dynamic focus lifecycle effect inside `QuestionRenderer`. Upon advancing or navigating back, the system automatically redirects focus to the first interactive input or group option, ensuring seamless screen-reader continuity.

### 3. Persistent Live Alert Regions & E2E Alignment
* **The Trajectory:** Dynamic validation elements (errors) that mount and unmount instantly can cause screen readers to miss announcements due to race conditions.
* **Resolution:** We persistently mount our `<p role="alert">` validation message element in the DOM using `aria-live="assertive"` and `aria-atomic="true"`, toggling its visual height/opacity using CSS transitions. To prevent this persistent DOM node from throwing off Playwright E2E assertions (which verify `toHaveCount(0)` on error elements when a form is valid), we dynamically strip the `data-testid="validation-error"` selector when no error is present. This achieves perfect, high-confidence E2E test assertions without degrading core accessibility conformance.