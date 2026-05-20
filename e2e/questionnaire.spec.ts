import { test, expect, type Page } from "@playwright/test";

const SESSION_STORAGE_KEY = "phoenix_session_id";

const gotoHome = async (page: Page) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
};

async function beginScreening(page: Page) {
  const sessionStart = page.waitForResponse(
    (res) =>
      res.url().includes("/api/session/start") &&
      res.request().method() === "POST" &&
      res.ok(),
    { timeout: 30_000 }
  );
  await page.getByTestId("start-session").click();
  await sessionStart;
  await expect(page.getByTestId("question-AGE")).toBeVisible({
    timeout: 15_000,
  });
}

test.beforeEach(async ({ page }) => {
  await gotoHome(page);
  await page.evaluate((k) => localStorage.removeItem(k), SESSION_STORAGE_KEY);
  await gotoHome(page);
});

test.describe("Questionnaire E2E", () => {
  test("happy path: full clearance through terminal eligibility", async ({
    page,
  }) => {
    await beginScreening(page);

    await page.getByTestId("question-AGE").fill("35");
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("question-WEIGHT").fill("90");
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("question-HEIGHT").fill("175");
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("wizard-next").click();

    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("checkbox-Normal (< 120/80)").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("wizard-next").click();

    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("radio-Never").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("radio-Moderate (3-4x/week)").click();
    await page.getByTestId("wizard-next").click();

    await page.getByTestId("checkbox-Balanced diet").click();
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId("status-eligible")).toBeVisible();
    await expect(page.getByTestId("wizard-next")).toHaveCount(0);
  });

  test("mid-flow refresh: hydrates screen 7 (HbA1c) with restored value", async ({
    page,
  }) => {
    await beginScreening(page);

    await page.getByTestId("question-AGE").fill("35");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("question-WEIGHT").fill("90");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("question-HEIGHT").fill("175");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("radio-Yes").click();
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId("step-indicator")).toHaveText(
      /Question 7 of 13/,
    );

    await page.getByTestId("question-MOST_RECENT_HbA1c").fill("6.4");
    await page.reload({ waitUntil: "domcontentloaded" });

    const skeleton = page.getByTestId("wizard-skeleton");
    try {
      await expect(skeleton).toBeVisible({ timeout: 5000 });
      await expect(skeleton).toBeHidden({ timeout: 30_000 });
    } catch {
      // Fast hydration may skip painting the skeleton between frames.
    }

    await expect(page.getByTestId("step-indicator")).toHaveText(
      /Question 7 of 13/,
    );
    await expect(page.getByTestId("question-MOST_RECENT_HbA1c")).toHaveValue(
      "6.4",
    );
  });

  test("terminal: underage on screen 1 routes to ineligible dashboard", async ({
    page,
  }) => {
    await beginScreening(page);
    await page.getByTestId("question-AGE").fill("16");
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId("status-ineligible")).toBeVisible();
    await expect(page.getByTestId("evaluation-dashboard")).toBeVisible();
  });

  test("blood pressure: conflicting selections block next until resolved", async ({
    page,
  }) => {
    await beginScreening(page);

    await page.getByTestId("question-AGE").fill("35");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("question-WEIGHT").fill("90");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("question-HEIGHT").fill("175");
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("wizard-next").click();
    await page.getByTestId("radio-No").click();
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId("step-indicator")).toHaveText(
      /Question 8 of 13/,
    );

    await page.getByTestId("checkbox-Normal (< 120/80)").click();
    await page.getByTestId("checkbox-Hypertensive Crisis (>180/>120)").click();

    await expect(page.getByTestId("validation-error")).toBeVisible();

    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("step-indicator")).toHaveText(
      /Question 8 of 13/,
    );

    await page.getByTestId("checkbox-Normal (< 120/80)").click();
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId("step-indicator")).toHaveText(
      /Question 9 of 13/,
    );
    await expect(page.getByTestId("validation-error")).toHaveCount(0);
  });
});
