import { chromium } from 'playwright-core'

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded', timeout: 15000 })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
await page.getByLabel('Email').fill('employee@tracker.demo')
await page.getByLabel('Password').fill('employee2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const routes = ['Dashboard', 'My Attendance', 'Leave', 'Holiday Calendar', 'Profile']
const results = []
for (const route of routes) {
  const button = page.getByTitle(`Open ${route}`)
  if (await button.count()) await button.first().click()
  const issues = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,button')].filter(element => !element.getAttribute('aria-label') && !element.getAttribute('title') && !element.textContent?.trim() && !element.labels?.length).map(element => element.tagName))
  results.push({ route, unlabeledControls: issues.length })
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
console.log(JSON.stringify({ results, overflow }))
if (overflow || results.some(x => x.unlabeledControls > 0)) process.exitCode = 1
await browser.close()
