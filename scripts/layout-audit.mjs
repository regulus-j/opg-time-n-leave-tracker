import { chromium } from 'playwright-core'
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const page = await browser.newPage()
for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  await page.setViewportSize(viewport)
  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.getByLabel('Email').fill('employee@tracker.demo')
  await page.getByLabel('Password').fill('employee2026')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  console.log(JSON.stringify({ viewport: viewport.name, overflow }))
}
await browser.close()
