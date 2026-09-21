import { writeFile } from "node:fs/promises";
import { schema } from "../src/server/validation/schema-validator.js";
const integers = new Set([
  "week_start",
  "standard_daily_mins",
  "standard_weekly_mins",
  "max_daily_mins",
  "worked_mins",
  "scheduled_mins",
  "overtime_mins",
  "version",
  "size_bytes",
  "current_mins",
  "threshold_mins",
]);
const numeric = new Set([
  "annual_allotment",
  "carry_over_limit",
  "accrued",
  "carried_over",
  "manual_adjustments",
  "used",
  "pending",
  "remaining",
  "amount",
  "chargeable_amount",
]);
const booleans = new Set([
  "is_ot_eligible",
  "is_paid",
  "allow_negative",
  "allow_partial_day",
]);
const arrays = new Set([
  "capabilities",
  "location_ids",
  "exception_codes",
  "attachment_ids",
]);
const objects = new Set([
  "settings",
  "weekday_rules",
  "work_schedule",
  "original",
  "proposed",
  "accrual_rule",
  "counting_rule",
  "request_window",
  "documentation_rule",
  "metadata",
]);
const nullable = new Set([
  "manager_id",
  "effective_to",
  "clock_out_at",
  "decided_by",
  "decided_at",
  "decision_note",
  "approver_id",
  "submitted_at",
  "reason",
  "description",
]);
for (const definition of Object.values(schema.$defs))
  for (const [field, rule] of Object.entries(definition.properties)) {
    const baseType = integers.has(field)
      ? "integer"
      : numeric.has(field)
        ? "number"
        : booleans.has(field)
          ? "boolean"
          : arrays.has(field)
            ? "array"
            : objects.has(field)
              ? "object"
              : "string";
    rule.type = nullable.has(field) ? [baseType, "null"] : baseType;
    if (baseType === "array") rule.items = { type: "string" };
  }
await writeFile(
  ".agent/instructions/schema.json",
  `${JSON.stringify(schema, null, 2)}\n`,
);
