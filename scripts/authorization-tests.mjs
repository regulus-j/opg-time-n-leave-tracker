import { launchAuditBrowser, appUrl } from './audit-config.mjs'

const browser = await launchAuditBrowser()
const page = await browser.newPage()
await page.goto(`${appUrl()}#/app/reports`, { waitUntil: 'domcontentloaded', timeout: 15000 })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
await page.getByLabel('Email').fill('employee@tracker.demo')
await page.getByLabel('Password').fill('employee2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const employeeCannotSeeReports = !(await page.getByRole('heading', { name: 'Master Reports' }).count()) && await page.getByRole('heading', { name: 'Your action dashboard' }).count() === 1
const employeeRoles = await page.getByLabel('Current workspace').locator('option').allTextContents()
const employeeCannotEscalate = employeeRoles.length === 1 && employeeRoles[0] === 'Employee'
await page.evaluate(() => {
  const session = JSON.parse(localStorage.getItem('tlt-session-v1'))
  session.role = 'HR Admin'
  localStorage.setItem('tlt-session-v1', JSON.stringify(session))
  location.hash = '#/app/reports'
})
await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
const tamperedSessionRejected = await page.getByLabel('Current workspace').inputValue() === 'Employee' && await page.getByRole('heading', { name: 'Your action dashboard' }).count() === 1
await page.getByTitle('Sign out').click()
await page.getByLabel('Email').fill('hr@tracker.demo')
await page.getByLabel('Password').fill('hr2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const hrSeesPersonalDashboard = await page.getByRole('heading', { name: 'Your action dashboard' }).count() === 1
const hrCanClockSelf = await page.getByRole('button', { name: /Clock In/ }).count() === 1
const hrCanSeeTeamNavigation = await page.getByTitle('Open Team Dashboard').count() === 1
await page.getByTitle('Open Team Dashboard').click()
const hrTeamDashboardWorks = await page.getByRole('heading', { name: 'Team command center' }).count() === 1
const hrCannotClockTeam = await page.getByRole('button', { name: /Clock In|Clock Out/ }).count() === 0
await page.getByTitle('Open Organization Overview').click()
const hrOrganizationOverviewWorks = await page.getByRole('heading', { name: 'Organization overview' }).count() === 1
const hrCanSeeReports = await page.getByTitle('Open Master Reports').count() === 1
await page.getByTitle('Sign out').click()
await page.getByLabel('Email').fill('admin@platform.demo')
await page.getByLabel('Password').fill('platform2026')
await page.getByRole('button', { name: 'Sign in' }).click()
const organizationPickerSkippedForPlatformAdmin = await page.getByLabel('Organization', { exact: true }).count() === 0
const platformLandsGlobal = await page.getByRole('heading', { name: 'Global control plane' }).count() === 1
await page.getByTitle('Open Organizations').click()
await page.getByRole('button', { name: 'Create organization' }).click()
await page.getByLabel('Organization name').fill('Acme Test')
await page.getByLabel('Organization ID').fill('acme-test')
await page.getByRole('button', { name: 'Create organization', exact: true }).last().click()
const organizationCreated = await page.getByText('Acme Test', { exact: true }).count() === 1
const acmeRow = page.locator('div.border-b').filter({ hasText: 'Acme Test' })
await acmeRow.getByRole('button', { name: 'Suspend' }).click()
const organizationSuspended = await acmeRow.getByText('suspended', { exact: true }).count() === 1
await acmeRow.getByRole('button', { name: 'Reactivate' }).click()
const organizationReactivated = await acmeRow.getByText('active', { exact: true }).count() === 1
await acmeRow.getByRole('button', { name: 'Enter organization' }).click()
const enteredTenantContext = await page.getByRole('heading', { name: 'Your action dashboard' }).count() === 1 && await page.getByRole('button', { name: 'Exit organization' }).count() === 1
await page.getByRole('button', { name: 'Exit organization' }).click()
await page.getByTitle('Open Organizations').click()
await page.getByRole('button', { name: 'Enter organization' }).first().click()
const canEnterTenantContext = await page.getByRole('button', { name: 'Exit organization' }).count() === 1
await page.getByTitle('Open Holiday Calendar').click()
await page.getByRole('button', { name: 'Add holiday' }).click()
await page.locator('input[type="date"]').fill('2026-11-23')
await page.getByPlaceholder('Holiday name').fill('Northstar Isolation Day')
await page.getByRole('button', { name: 'Save holiday' }).click()
await page.getByRole('button', { name: 'Exit organization' }).click()
await page.getByTitle('Open Organizations').click()
await page.locator('div.border-b').filter({ hasText: 'Harbor Logistics' }).getByRole('button', { name: 'Enter organization' }).click()
const switchedTenant = await page.getByText('Harbor Logistics', { exact: false }).count() > 0
await page.getByTitle('Open Holiday Calendar').click()
const tenantDataIsIsolated = await page.getByText('Northstar Isolation Day', { exact: true }).count() === 0
await page.getByRole('button', { name: 'Exit organization' }).click()
await page.getByTitle('Open Organizations').click()
await page.getByRole('button', { name: 'Enter organization' }).first().click()
await page.getByTitle('Open Holiday Calendar').click()
const tenantDataPersists = await page.getByText('Northstar Isolation Day', { exact: true }).count() === 1
console.log(JSON.stringify({ employeeCannotSeeReports, employeeCannotEscalate, tamperedSessionRejected, hrSeesPersonalDashboard, hrCanClockSelf, hrCanSeeTeamNavigation, hrTeamDashboardWorks, hrCannotClockTeam, hrOrganizationOverviewWorks, hrCanSeeReports, organizationPickerSkippedForPlatformAdmin, platformLandsGlobal, organizationCreated, organizationSuspended, organizationReactivated, enteredTenantContext, canEnterTenantContext, switchedTenant, tenantDataIsIsolated, tenantDataPersists }))
if (![employeeCannotSeeReports, employeeCannotEscalate, tamperedSessionRejected, hrSeesPersonalDashboard, hrCanClockSelf, hrCanSeeTeamNavigation, hrTeamDashboardWorks, hrCannotClockTeam, hrOrganizationOverviewWorks, hrCanSeeReports, organizationPickerSkippedForPlatformAdmin, platformLandsGlobal, organizationCreated, organizationSuspended, organizationReactivated, enteredTenantContext, canEnterTenantContext, switchedTenant, tenantDataIsIsolated, tenantDataPersists].every(Boolean)) process.exitCode = 1
await browser.close()
