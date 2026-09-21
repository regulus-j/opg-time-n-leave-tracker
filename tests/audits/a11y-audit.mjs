import axe from "axe-core";
import {
  launchAuditBrowser,
  resetPage,
  VIEWPORTS,
} from "../support/audit-config.mjs";

const browser = await launchAuditBrowser();
const page = await browser.newPage();
const routes = ["Dashboard", "Attendance", "Leave", "Holidays", "Profile"];
const results = [];
for (const viewport of VIEWPORTS) {
  await resetPage(page, viewport);
  await page.getByLabel("Email").fill("user@dev.local");
  await page
    .getByLabel("Password")
    .fill(process.env.SEED_USER_PASSWORD || "User-dev-password-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Make your time count." }).waitFor();
  await page.addScriptTag({ content: axe.source });
  for (const route of routes) {
    if (viewport.width < 1024) await page.getByLabel("Open navigation").click();
    await page.getByRole("button", { name: route, exact: true }).click();
    const report = await page.evaluate(async () =>
      window.axe.run(document, { resultTypes: ["violations"] }),
    );
    const unlabeledControls = await page.evaluate(
      () =>
        [...document.querySelectorAll("input,select,textarea,button")].filter(
          (element) =>
            !element.getAttribute("aria-label") &&
            !element.getAttribute("title") &&
            !element.textContent?.trim() &&
            !element.labels?.length,
        ).length,
    );
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    results.push({
      viewport: viewport.name,
      route,
      violations: report.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        nodes: nodes.length,
        targets: nodes.slice(0, 3).map((node) => node.target),
        examples: nodes.slice(0, 3).map((node) => ({
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
      unlabeledControls,
      overflow,
    });
  }
}
for (const scenario of [
  {
    persona: "manager",
    email: "manager@dev.local",
    password: process.env.SEED_USER_PASSWORD || "User-dev-password-2026!",
    routes: [
      "Team dashboard",
      "Approvals",
      "Who’s in",
      "Team leave calendar",
      "Reports & alerts",
    ],
  },
  {
    persona: "hr",
    email: "hr@dev.local",
    password: process.env.SEED_HR_PASSWORD || "Hr-dev-password-2026!",
    routes: ["Jobs & policies", "Directory", "Leave policies", "Overrides", "Reports", "Audit"],
  },
]) {
  await resetPage(page, { width: 1280, height: 900 });
  await page.getByLabel("Email").fill(scenario.email);
  await page.getByLabel("Password").fill(scenario.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (scenario.persona === "administrator") {
    await page.getByRole("heading", { name: "Platform overview" }).waitFor();
    await page.getByRole("button", { name: "Enter organization" }).first().click();
  }
  await page.getByRole("heading", { name: "Make your time count." }).waitFor();
  if (scenario.persona === "manager")
    await page.getByRole("button", { name: "Team", exact: true }).last().click();
  await page.addScriptTag({ content: axe.source });
  for (const route of scenario.routes) {
    await page.getByRole("button", { name: route, exact: true }).click();
    const report = await page.evaluate(async () =>
      window.axe.run(document, { resultTypes: ["violations"] }),
    );
    const unlabeledControls = await page.evaluate(
      () =>
        [...document.querySelectorAll("input,select,textarea,button")].filter(
          (element) =>
            !element.getAttribute("aria-label") &&
            !element.getAttribute("title") &&
            !element.textContent?.trim() &&
            !element.labels?.length,
        ).length,
    );
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    results.push({
      viewport: "desktop-role-audit",
      route: `${scenario.persona}:${route}`,
      violations: report.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        nodes: nodes.length,
        targets: nodes.slice(0, 3).map((node) => node.target),
      })),
      unlabeledControls,
      overflow,
    });
  }
}
console.log(JSON.stringify({ results }, null, 2));
if (
  results.some(
    (result) =>
      result.violations.length || result.unlabeledControls || result.overflow,
  )
)
  process.exitCode = 1;
await browser.close();
