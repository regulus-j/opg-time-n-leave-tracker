import { spawnSync } from 'node:child_process'

const commands = [
  ['build', 'npm run build'],
  ['domain', 'npm run test:domain'],
  ['requirements', 'npm run audit:requirements'],
  ['authorization', 'npm run audit:authorization'],
  ['e2e', 'npm run test:e2e'],
  ['layout', 'npm run audit:layout'],
  ['accessibility', 'npm run audit:a11y'],
]

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const results = []
for (const [name, command] of commands) {
  const result = spawnSync(npmCommand, command.split(' ').slice(1), {
    stdio: 'inherit',
    env: process.env,
  })
  results.push({ name, status: result.status === 0 ? 'pass' : 'fail', exitCode: result.status })
}

console.log(JSON.stringify({ baseUrl: process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173', results }, null, 2))
if (results.some((result) => result.status === 'fail')) process.exitCode = 1
