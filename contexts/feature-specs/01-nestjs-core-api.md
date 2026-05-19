Read `AGENTS.md` before starting.

We are building the NestJS 11 Core API Layer and database persistence wrappers inside `apps/api` to interface with our recursive form-engine package.

### 📐 Unified Response Contract (SessionStateResponse)
All three endpoints listed below MUST return an identical, unified response schema envelope matching this structural signature:
{
  "sessionId": "string (UUID)",
  "currentScreenId": "ScreenId Enum (e.g. 'AGE', 'WEIGHT', 'FINAL_SCREEN')",
  "savedAnswers": "Record<ScreenId, any> (Current compiled answers map)",
  "evaluationResult": "EvaluationResult | null (Only populated when currentScreenId is 'FINAL_SCREEN')"
}

---

### 🚀 Endpoint Specifications

1. **`POST /api/session/start`**
   - Initialize an anonymous patient session tracking record.
   - Generate a secure UUID primary key entry in the `Session` table.
   - Commit a blank, initial baseline tracking payload `{}`.
   - Run the recursive engine router starting from Screen 1.
   - Return a `SessionStateResponse` pointing to `ScreenId.AGE`.

2. **`POST /api/session/answer`**
   - Payload Validation Schema requirement: 
     - `sessionId`: string (Valid UUID format)
     - `screenId`: ScreenId (Must be a valid ScreenId enum variant)
     - `answer`: Strict type validation corresponding to the values specified in the form-engine `FormResponse` definition (No loose 'any' parameters).
   - **Execution Order Optimization Loop:**
     - Query and extract the existing state from the `Session` table matching the `sessionId`. If missing, return a `404 Not Found`.
     - **De-duplication Check:** Evaluate if `savedAnswers[screenId]` already exists and matches the incoming payload exactly. If it is identical, skip all database modifications and transaction writes completely; immediately run the recursive engine router on the existing state and return the `SessionStateResponse`.
     - **Atomic Transaction (`$transaction`):** If the answer is fresh or updated, merge the parameter into the `savedAnswers` JSON cluster, save back to the `Session` row, and append a record to the `SessionHistory` trail.
   - Pass the updated answers mapping to the recursive engine router to compute the true position.
   - Return the calculated destination inside the unified response container.

3. **`GET /api/session/:id`**
   - Hydrate a patient's context securely following browser tab refreshes (F5 events).
   - Fetch the session tracking model row matching the client-supplied UUID path tracking token.
   - If the token is unknown or unmapped, return a clean `404 Not Found` REST exception.
   - Pass the verified history object to the recursive engine router to compute the current true position.
   - Compile and return the complete state map inside the unified `SessionStateResponse` template.

---

### 🧪 Automated Integration Testing Spec (Vitest)

Alongside the controller and service implementations, create an automated integration test suite (`apps/api/src/session/session.controller.spec.ts`) utilizing NestJS's `TestingModule` and Vitest:

- **Prisma Service Mocking:** Use Vitest's `vi.fn()` utilities to completely mock out database responses. Tests must run instantly without requiring an active PostgreSQL Docker container connection.
- **Endpoint Target Assertions:**
  - Verify `POST /api/session/start` correctly calls `prisma.session.create`.
  - Verify `POST /api/session/answer` returns identical targets without hitting the database transaction path when a duplicated payload option is passed.
  - Verify `POST /api/session/answer` correctly triggers a `$transaction` write when an option shifts or is updated.
  - Verify `GET /api/session/:id` accurately triggers a `404 HttpException` if an invalid, unmapped session token is passed through the path parameter.

### Implementation Constraints & Code Cleanliness

- Restrict all routing operations to data-driven execution—never duplicate validation branches, scoring equations, or traversal maps inside the API modules. Delegate all logical state routing completely to the pure `@phoenix/form-engine` exports.
- Use NestJS 11 standard built-in pipes or exception filters to handle invalid input payloads gracefully.

---

###  Check when done
- `POST /api/session/start` creates a fresh database row and yields a valid UUID token wrapped in the unified `SessionStateResponse`.
- `POST /api/session/answer` accurately flags duplicate answers and short-circuits to avoid redundant database transaction writes.
- Fresh answers correctly fire a consolidated `$transaction` block that updates `Session` and inserts into `SessionHistory` using the `Int` autoincrement primary key.
- Mid-flow refresh handler `GET /api/session/:id` recovers historical state maps flawlessly and maps back the exact same `SessionStateResponse` envelope.
- Running `npm run test` inside `apps/api` executes all mock controller test blocks cleanly with zero dangling handles or active database requirements.