import assert from "node:assert/strict";
import {
  applyAttendanceDecision,
  applyLeaveDecision,
  availableToRequest,
  chargeableDays,
  csvEscape,
  directReportIds,
  validateLeaveRequest,
  wouldCreateManagerCycle,
} from "../src/domain/rules.js";

assert.equal(chargeableDays("2026-09-14", "2026-09-15", []), 2);
assert.equal(
  chargeableDays("2026-09-14", "2026-09-16", [{ date: "2026-09-15" }]),
  2,
);
assert.equal(
  availableToRequest({ accrued: 10, carry: 2, used: 3, pending: 1 }),
  8,
);
const data = {
  holidays: [],
  people: [
    { id: "alex", jobId: "designer", managerId: "jamie", status: "active" },
  ],
  leaveTypes: [{ id: "vacation", documentationAfter: 2 }],
  policies: [
    { jobId: "designer", leaveTypeId: "vacation", allowNegative: false },
  ],
  balances: {
    alex: { vacation: { accrued: 10, carry: 0, used: 0, pending: 0 } },
  },
  leave: [],
  audit: [],
};
const request = validateLeaveRequest({
  data,
  employee: data.people[0],
  typeId: "vacation",
  from: "2026-09-14",
  to: "2026-09-16",
  reason: "Family care",
  hasAttachment: false,
});
assert.equal(request.valid, false);
assert.match(request.errors.join(" "), /Documentation/);
assert.deepEqual(
  directReportIds(
    [
      { id: "alex", managerId: "jamie", status: "active" },
      { id: "inactive", managerId: "jamie", status: "inactive" },
    ],
    "jamie",
  ),
  ["alex"],
);
const approved = applyLeaveDecision(
  {
    ...data,
    leave: [
      {
        id: "l1",
        employeeId: "alex",
        type: "vacation",
        from: "2026-09-14",
        to: "2026-09-15",
        days: 2,
        status: "pending",
        history: [],
      },
    ],
  },
  "l1",
  "approved",
  "Coverage confirmed",
);
assert.equal(approved.leave[0].status, "approved");
assert.equal(approved.balances.alex.vacation.used, 2);
const attendance = applyAttendanceDecision(
  {
    ...data,
    attendance: [],
    adjustments: [
      {
        id: "a1",
        employeeId: "alex",
        date: "2026-09-15",
        proposed: "09:00–17:00",
        status: "pending",
      },
    ],
  },
  "a1",
  "approved",
  "Verified",
);
assert.equal(attendance.adjustments[0].status, "approved");
assert.equal(attendance.attendance[0].minutes, 480);
const hierarchy = [
  { id: "a", managerId: "b", status: "active" },
  { id: "b", managerId: "c", status: "active" },
  { id: "c", managerId: null, status: "active" },
];
assert.equal(wouldCreateManagerCycle(hierarchy, "c", "a"), true);
assert.equal(wouldCreateManagerCycle(hierarchy, "c", null), false);
assert.equal(approved.balances.alex.vacation.pending, 0);
const dated = {
  ...data,
  policies: [
    {
      jobId: "designer",
      leaveTypeId: "vacation",
      active: true,
      effectiveFrom: "2027-01-01",
      effectiveTo: null,
    },
  ],
};
assert.equal(
  validateLeaveRequest({
    data: dated,
    employee: { id: "alex", jobId: "designer" },
    typeId: "vacation",
    from: "2026-09-14",
    to: "2026-09-15",
    reason: "test",
  }).errors.includes("This leave type is not eligible for the employee job."),
  true,
);
assert.equal(csvEscape("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
console.log("domain rules: all assertions passed");
