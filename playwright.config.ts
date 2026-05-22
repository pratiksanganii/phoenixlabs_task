import { defineConfig, devices } from "@playwright/test";

/** Normalize `localhost` to IPv4 for Prisma against Docker Desktop on Windows. */
function resolveApiDatabaseUrl(): string {
  const raw =
    process.env.DATABASE_URL ??
    "postgresql://phoenix_user:phoenix_password@127.0.0.1:5432/phoenix_eligibility_db?schema=public";
  return raw.replace(/@localhost(?=[:/])/g, "@127.0.0.1");
}

/**
 * API and web inherit secrets from the parent process env when present.
 * Ensure Postgres is reachable before running E2E (e.g. `docker compose up -d`).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "npm run start:dev",
      cwd: "apps/api",
      url: "http://localhost:3001",
      reuseExistingServer: true,
      timeout: 120_000, // 2 minutes
      env: {
        ...process.env,
        PORT: "3001",
        CORS_ORIGIN: "http://localhost:3000",
        DATABASE_URL: resolveApiDatabaseUrl(),
      },
    },
    {
      command: "npm run dev",
      cwd: "apps/web",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000, // 2 minutes
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:3001",
      },
    },
  ],
});
