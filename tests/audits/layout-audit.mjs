import {
  launchAuditBrowser,
  resetPage,
  VIEWPORTS,
} from "../support/audit-config.mjs";
const browser = await launchAuditBrowser();
const page = await browser.newPage();
for (const viewport of VIEWPORTS) {
  await resetPage(page, viewport);
  await page.getByLabel("Email").fill("user@dev.local");
  await page
    .getByLabel("Password")
    .fill(process.env.SEED_USER_PASSWORD || "User-dev-password-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Make your time count." }).waitFor();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  console.log(JSON.stringify({ viewport: viewport.name, overflow }));
}
await browser.close();
