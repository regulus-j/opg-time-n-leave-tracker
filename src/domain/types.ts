export type Role = 'Employee' | 'Reporting Manager' | 'HR Admin'
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled'
export type AttendanceStatus = 'complete' | 'below_standard' | 'missing_punch' | 'absent' | 'leave' | 'holiday' | 'non_working' | 'future' | 'pending_adjustment'

export interface Tenant { tenant_id: string; name: string; timezone: string; week_start: number; locale: string }
export interface User { user_id: string; tenant_id: string; employee_id: string; display_name: string; email: string; capabilities: Role[]; status: 'active' | 'inactive' }
export interface JobProfile { job_id: string; tenant_id: string; title: string; department_id: string; standard_daily_mins: number; standard_weekly_mins: number; is_ot_eligible: boolean; max_daily_mins: number | null; effective_from: string; effective_to?: string | null; status: 'active' | 'inactive' }
export interface Employee { employee_id: string; tenant_id: string; employee_number: string; name: string; job_id: string; manager_id: string | null; department_id: string; status: 'active' | 'inactive' }
export interface AttendanceSession { session_id: string; tenant_id: string; employee_id: string; clock_in_at: string; clock_out_at: string | null; status: 'open' | 'closed' | 'voided' }
export interface AttendanceSummary { summary_id: string; tenant_id: string; employee_id: string; local_date: string; worked_mins: number; scheduled_mins: number; overtime_mins: number; status: AttendanceStatus; exception_codes: string[] }
export interface AttendanceAdjustment { adjustment_id: string; tenant_id: string; employee_id: string; local_date: string; proposed: { start: string; end: string }; reason: string; status: RequestStatus; decision_note?: string }
export interface LeaveType { leave_type_id: string; tenant_id: string; name: string; code: string; unit: 'days' | 'hours'; is_paid: boolean; status: 'active' | 'inactive' }
export interface JobLeavePolicy { policy_id: string; tenant_id: string; job_id: string; leave_type_id: string; annual_allotment: number; carry_over_limit: number; allow_negative: boolean; allow_partial_day: boolean; documentation_after?: number; effective_from: string; effective_to?: string | null; status: 'active' | 'inactive' }
export interface LeaveBalance { balance_id: string; tenant_id: string; employee_id: string; leave_type_id: string; accrued: number; carried_over: number; manual_adjustments: number; used: number; pending: number; remaining: number; as_of: string }
export interface LeaveRequest { request_id: string; tenant_id: string; employee_id: string; leave_type_id: string; start_date: string; end_date: string; chargeable_amount: number; reason: string; attachment_ids: string[]; status: RequestStatus; decision_note?: string }
export interface Holiday { holiday_id: string; tenant_id: string; holiday_calendar_id: string; name: string; local_date: string; observance_type: 'public' | 'company' | 'optional'; status: 'active' | 'inactive' }
export interface Alert { alert_id: string; tenant_id: string; employee_id: string; type: string; severity: 'info' | 'warning' | 'critical'; status: 'open' | 'acknowledged' | 'resolved' }
export interface AuditEvent { event_id: string; tenant_id: string; actor_user_id: string; actor_role: Role; action: string; target_type: string; target_id: string; occurred_at: string; reason?: string }

export const remainingBalance = (balance: Pick<LeaveBalance, 'accrued' | 'carried_over' | 'manual_adjustments' | 'used'>) => balance.accrued + balance.carried_over + balance.manual_adjustments - balance.used
export const availableToRequest = (balance: Pick<LeaveBalance, 'accrued' | 'carried_over' | 'manual_adjustments' | 'used' | 'pending'>) => remainingBalance(balance) - balance.pending
