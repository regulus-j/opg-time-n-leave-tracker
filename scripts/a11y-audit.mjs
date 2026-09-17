import axe from 'axe-core'
import { launchAuditBrowser, resetPage, VIEWPORTS } from './audit-config.mjs'

const browser = await launchAuditBrowser()
const page = await browser.newPage()
const routes = ['Dashboard', 'My Attendance', 'Leave', 'Holiday Calendar', 'Profile']
const routeHashes = { Dashboard: 'dashboard', 'My Attendance': 'attendance', Leave: 'leave', 'Holiday Calendar': 'holidays', Profile: 'profile' }
const results = []
for (const viewport of VIEWPORTS) {
  await resetPage(page, viewport)
  await page.getByLabel('Email').fill('employee@tracker.demo')
  await page.getByLabel('Password').fill('employee2026')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.addScriptTag({ content: axe.source })
  for (const route of routes) {
    let button = page.locator(`[title="Open ${route}"]:visible`).first()
    let navigationUnavailable = false
    if (!(await button.count())) {
      const menu = page.locator('[title="Open navigation"]:visible').first()
      if (await menu.count()) await menu.click()
      button = page.locator(`[title="Open ${route}"]:visible`).first()
    }
    if (await button.count() && await button.first().isVisible()) {
      await button.first().click()
    } else if (route !== 'Dashboard') {
      await page.evaluate((hash) => { window.location.hash = `#/app/${hash}` }, routeHashes[route])
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.addScriptTag({ content: axe.source })
      navigationUnavailable = true
    }
    const report = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }))
    const unlabeledControls = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,button')].filter(element => !element.getAttribute('aria-label') && !element.getAttribute('title') && !element.textContent?.trim() && !element.labels?.length).length)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    results.push({ viewport: viewport.name, route, violations: report.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length, targets: nodes.slice(0, 3).map((node) => node.target), examples: nodes.slice(0, 3).map((node) => ({ html: node.html, failureSummary: node.failureSummary })) })), unlabeledControls, overflow, navigationUnavailable })
  }
}
console.log(JSON.stringify({ results }, null, 2))
if (results.some(result => result.violations.length || result.unlabeledControls || result.overflow)) process.exitCode = 1
await browser.close()
