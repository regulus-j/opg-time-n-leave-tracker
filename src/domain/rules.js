export function remainingBalance(balance) {
  return (balance?.accrued || 0) + (balance?.carry || balance?.carried_over || 0) + (balance?.manualAdjustments || balance?.manual_adjustments || 0) - (balance?.used || 0)
}

export function availableToRequest(balance) {
  return remainingBalance(balance) - (balance?.pending || 0)
}

export function isWorkingDay(date, workdays = [1, 2, 3, 4, 5]) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return workdays.includes(day === 0 ? 7 : day)
}

export function chargeableDays(from, to, holidays = [], workdays = [1, 2, 3, 4, 5]) {
  if (!from || !to || to < from) return 0
  const holidayDates = new Set(holidays.map(x => x.date || x.local_date))
  let count = 0
  for (let cursor = new Date(`${from}T00:00:00Z`); cursor <= new Date(`${to}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const value = cursor.toISOString().slice(0, 10)
    if (isWorkingDay(value, workdays) && !holidayDates.has(value)) count += 1
  }
  return count
}

export function eligibleLeaveTypes(data, employee) {
  const policies = data.policies.filter(policy => policy.jobId === employee.jobId && policy.active !== false && (!policy.effectiveFrom || policy.effectiveFrom <= '2026-09-15') && (!policy.effectiveTo || policy.effectiveTo >= '2026-09-15'))
  return data.leaveTypes.filter(type => policies.some(policy => policy.leaveTypeId === type.id))
}

export function applyAttendanceDecision(data, adjustmentId, status, note = '') {
  const adjustment = data.adjustments.find(x => x.id === adjustmentId)
  if (!adjustment || adjustment.status !== 'pending') return { ...data, conflict: true }
  const next = { ...data, adjustments: data.adjustments.map(x => x.id === adjustmentId ? { ...x, status, decisionNote: note } : x), audit: [...data.audit, { action: status, target: adjustmentId, actor: 'manager', reason: note, at: new Date().toISOString() }] }
  if (status !== 'approved') return next
  const parts = adjustment.proposed.split(/[–-]/).map(x => x.trim())
  const minutes = parts.length === 2 ? Math.max(0, (Number(parts[1].slice(0, 2)) * 60 + Number(parts[1].slice(3, 5))) - (Number(parts[0].slice(0, 2)) * 60 + Number(parts[0].slice(3, 5)))) : 0
  const existing = next.attendance.find(x => x.employeeId === adjustment.employeeId && x.date === adjustment.date)
  const corrected = { id: existing?.id || `attendance-${Date.now()}`, employeeId: adjustment.employeeId, date: adjustment.date, start: parts[0] || null, end: parts[1] || null, minutes, status: 'complete' }
  return { ...next, attendance: existing ? next.attendance.map(x => x.id === existing.id ? corrected : x) : [...next.attendance, corrected] }
}

export function validateLeaveRequest({ data, employee, typeId, from, to, reason, hasAttachment = false }) {
  const policy = data.policies.find(x => x.jobId === employee.jobId && x.leaveTypeId === typeId && x.active !== false && (!x.effectiveFrom || x.effectiveFrom <= '2026-09-15') && (!x.effectiveTo || x.effectiveTo >= '2026-09-15'))
  const type = data.leaveTypes.find(x => x.id === typeId)
  const days = chargeableDays(from, to, data.holidays)
  const balance = data.balances[employee.id]?.[typeId]
  const available = availableToRequest(balance)
  const requiresDocumentation = Boolean(type?.documentationAfter && days > type.documentationAfter)
  const overlap = data.leave.some(item => item.employeeId === employee.id && item.status !== 'rejected' && from <= item.to && to >= item.from)
  const errors = []
  if (!policy || !type) errors.push('This leave type is not eligible for the employee job.')
  if (!from || !to || days <= 0) errors.push('Choose a valid working-day range.')
  if (!reason?.trim()) errors.push('A reason is required.')
  if (overlap) errors.push('This request overlaps another request.')
  if (!policy?.allowNegative && days > available) errors.push(`Only ${available} day(s) are available.`)
  if (requiresDocumentation && !hasAttachment) errors.push('Documentation is required for this duration.')
  return { valid: errors.length === 0, errors, days, available, requiresDocumentation }
}

export function applyLeaveDecision(data, requestId, status, note = '') {
  const request = data.leave.find(x => x.id === requestId)
  if (!request || request.status !== 'pending') return { ...data, conflict: true }
  const next = { ...data, leave: data.leave.map(x => x.id === requestId ? { ...x, status, history: [...x.history, `${status} by manager${note ? `: ${note}` : ''}`] } : x), audit: [...data.audit, { action: status, target: requestId, actor: 'manager', reason: note, at: new Date().toISOString() }] }
  if (status !== 'approved') return next
  const balance = next.balances[request.employeeId]?.[request.type]
  if (!balance) return next
  return { ...next, balances: { ...next.balances, [request.employeeId]: { ...next.balances[request.employeeId], [request.type]: { ...balance, pending: Math.max(0, balance.pending - request.days), used: balance.used + request.days } } } }
}

export function directReportIds(people, managerId) {
  return people.filter(person => person.status === 'active' && person.managerId === managerId).map(person => person.id)
}

export function wouldCreateManagerCycle(people, employeeId, managerId) {
  if (!managerId || employeeId === managerId) return employeeId === managerId
  const byId = new Map(people.map(person => [person.id, person]))
  const seen = new Set([employeeId])
  let cursor = managerId
  while (cursor) {
    if (seen.has(cursor)) return true
    seen.add(cursor)
    cursor = byId.get(cursor)?.managerId || null
  }
  return false
}

export function csvEscape(value) {
  const raw = String(value ?? '')
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}
