import { chromium } from 'playwright-core'

const configuredBaseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173'
export const BASE_URL = configuredBaseUrl.replace(/\/+$/, '')
export const CHROME_EXECUTABLE = process.env.CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

export const VIEWPORTS = Object.freeze([
  { name: 'mobile-small', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'desktop-wide', width: 1440, height: 900 },
])

export function appUrl(path = '/') {
  return `${BASE_URL}/${String(path).replace(/^\/+/, '')}`
}

export async function launchAuditBrowser(options = {}) {
  return chromium.launch({
    headless: true,
    executablePath: CHROME_EXECUTABLE,
    timeout: 10000,
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
    ...options,
  })
}

export async function resetPage(page, viewport) {
  if (viewport) await page.setViewportSize(viewport)
  await page.goto(appUrl(), { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
}
