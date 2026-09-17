import { launchAuditBrowser, resetPage, VIEWPORTS } from './audit-config.mjs'
const browser = await launchAuditBrowser()
const page = await browser.newPage()
for (const viewport of VIEWPORTS) {
  await resetPage(page, viewport)
  await page.getByLabel('Email').fill('employee@tracker.demo')
  await page.getByLabel('Password').fill('employee2026')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  console.log(JSON.stringify({ viewport: viewport.name, overflow }))
}
await browser.close()
