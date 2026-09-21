import test from "node:test";
import assert from "node:assert/strict";
import { approvedLeaveTotals, pageMetadata, safeCsvCell } from "../../src/server/services/report-utils.js";

test("CSV cells neutralize formulas and preserve delimiters", () => {
  assert.equal(safeCsvCell("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(safeCsvCell("Mendoza, Arielle\nOperations"), '"Mendoza, Arielle\nOperations"');
  assert.equal(safeCsvCell("正常"), "正常");
});

test("report pagination is bounded and deterministic", () => {
  assert.deepEqual(pageMetadata(51, 2, 25), { total: 51, page: 2, page_size: 25, page_count: 3 });
  assert.equal(pageMetadata(0, 0, 500).page_size, 100);
});

test("only approved leave contributes to paid and unpaid totals", () => {
  assert.deepEqual(approvedLeaveTotals([
    { status: "approved", is_paid: true, chargeable_amount: 2 },
    { status: "approved", is_paid: false, chargeable_amount: 1.5 },
    { status: "pending", is_paid: true, chargeable_amount: 4 },
  ]), { paid: 2, unpaid: 1.5 });
});
