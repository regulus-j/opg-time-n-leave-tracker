import { chromium } from 'playwright-core'

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const page = await browser.newPage()
await page.goto('http://127.0.0.1:8000/#/app/reports', { waitUntil: 'domcontentloaded', timeout: 15000 })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
await page.getByLabel('Email').fill('employee@tracker.demo')
await page.getByLabel('Password').fill('employee2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const employeeCannotSeeReports = !(await page.getByRole('heading', { name: 'Master Reports' }).count()) && await page.getByRole('heading', { name: 'Your action dashboard' }).count() === 1
await page.getByTitle('Sign out').click()
await page.getByLabel('Email').fill('hr@tracker.demo')
await page.getByLabel('Password').fill('hr2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const hrCanSeeReports = await page.getByTitle('Open Master Reports').count() === 1
console.log(JSON.stringify({ employeeCannotSeeReports, hrCanSeeReports }))
if (!employeeCannotSeeReports || !hrCanSeeReports) process.exitCode = 1
await browser.close()
