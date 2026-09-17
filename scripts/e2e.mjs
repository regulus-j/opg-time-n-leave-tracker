import { launchAuditBrowser, appUrl } from './audit-config.mjs'

const browser = await launchAuditBrowser()
const results = []
async function test(name, fn) {
  console.log(`START | ${name}`)
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.setDefaultTimeout(4000)
  try {
    await page.goto(appUrl(), { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
    await Promise.race([fn(page), new Promise((_, reject) => setTimeout(() => reject(new Error('test timeout')), 12000))])
    results.push(['PASS', name])
  } catch (error) {
    results.push(['FAIL', name, error.message.split('\n')[0]])
  } finally { await page.close() }
}
const signIn = async (page, email, password) => { await page.getByLabel('Email').fill(email); await page.getByLabel('Password').fill(password); await page.getByRole('button', { name: 'Sign in' }).click() }
const nav = (page, name) => page.getByRole('button', { name, exact: true }).click()

await test('Login rejects invalid credentials', async page => { await signIn(page, 'wrong@example.com', 'wrong'); await page.getByRole('alert').waitFor() })
await test('Employee authentication and sign out', async page => { await signIn(page, 'employee@tracker.demo', 'employee2026'); await page.getByRole('heading', { name: 'Your action dashboard' }).waitFor(); await page.getByTitle('Sign out').click(); await page.getByRole('heading', { name: 'Welcome back' }).waitFor() })
await test('Employee attendance adjustment form', async page => { await signIn(page, 'employee@tracker.demo', 'employee2026'); await page.getByRole('button', { name: 'View attendance' }).click(); await page.getByRole('button', { name: 'Attendance Adjustment' }).click(); await page.getByRole('heading', { name: 'Submit attendance adjustment' }).waitFor() })
await test('Employee leave request with policy preview', async page => { await signIn(page, 'employee@tracker.demo', 'employee2026'); await nav(page, 'Leave'); await page.getByRole('button', { name: 'Request Leave' }).click(); await page.getByRole('heading', { name: 'Request leave' }).waitFor(); await page.getByText('Projected charge:').waitFor() })
await test('Manager team scope and approvals', async page => { await signIn(page, 'manager@tracker.demo', 'manager2026'); await page.getByRole('button', { name: 'Team' }).click(); await page.getByRole('heading', { name: 'Team command center' }).waitFor(); await nav(page, 'Approvals'); await page.getByRole('heading', { name: 'Approvals Inbox' }).waitFor(); await page.getByRole('button', { name: 'Approve' }).first().click() })
await test('Manager presence, calendar, and alerts', async page => { await signIn(page, 'manager@tracker.demo', 'manager2026'); await page.getByRole('button', { name: 'Team' }).click(); await page.getByRole('button', { name: "Who's In", exact: true }).first().click(); await page.getByRole('heading', { name: "Who's In" }).waitFor(); await nav(page, 'Team Leave Calendar'); await page.getByRole('heading', { name: 'Team Leave Calendar' }).waitFor(); await nav(page, 'Overtime & Alerts'); await page.getByRole('heading', { name: 'Overtime & Limit Alerts' }).waitFor() })
await test('HR policies, directory, overrides, and reports', async page => { await signIn(page, 'hr@tracker.demo', 'hr2026'); await nav(page, 'Job Profiles'); await page.getByRole('heading', { name: 'Jobs & Policies' }).waitFor(); await nav(page, 'Leave Policy Mapping'); await page.getByRole('button', { name: 'New mapping' }).click(); await page.getByRole('heading', { name: 'Create leave policy mapping' }).waitFor(); await page.getByRole('button', { name: 'Close dialog' }).click(); await nav(page, 'Directory'); await page.getByRole('heading', { name: 'Global Directory' }).waitFor(); await nav(page, 'Overrides'); await page.getByRole('heading', { name: 'Override Controls' }).waitFor(); await nav(page, 'Master Reports'); await page.getByRole('heading', { name: 'Master Reports' }).waitFor() })
await test('Collection search and filters', async page => {
  await signIn(page, 'employee@tracker.demo', 'employee2026');
  await nav(page, 'Leave');
  await page.getByLabel('Search leave history').fill('does-not-exist');
  await page.getByText('No leave requests match the selected filters.').waitFor();
  await nav(page, 'My Attendance');
  await page.getByLabel('Attendance status').selectOption('absent');
  await page.getByText('No attendance records match the selected status.').waitFor();
  await page.getByTitle('Sign out').click();
  await signIn(page, 'hr@tracker.demo', 'hr2026');
  await nav(page, 'Master Reports');
  await page.getByLabel('Search employees').fill('Alex');
  await page.getByRole('cell', { name: 'Alex Morgan' }).waitFor();
  await page.getByLabel('Search employees').fill('does-not-exist');
  await page.getByText('No employees match the selected filters.').waitFor();
})
await test('Responsive mobile shell', async page => { await page.setViewportSize({ width: 390, height: 844 }); await signIn(page, 'employee@tracker.demo', 'employee2026'); await page.getByRole('heading', { name: 'Your action dashboard' }).waitFor(); const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); if (overflow) throw new Error('unexpected horizontal overflow') })

for (const row of results) console.log(row.join(' | '))
console.log(`TOTAL ${results.length} | PASSED ${results.filter(x => x[0] === 'PASS').length} | FAILED ${results.filter(x => x[0] === 'FAIL').length}`)
await browser.close()
