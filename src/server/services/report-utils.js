export const safeCsvCell = (value) => {
  const text = String(value ?? "");
  const safe = /^[-=+@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

export const pageMetadata = (total, page = 1, pageSize = 25) => {
  const normalizedSize = Math.max(1, Math.min(100, Number(pageSize) || 25));
  const normalizedPage = Math.max(1, Number(page) || 1);
  return { total, page: normalizedPage, page_size: normalizedSize, page_count: Math.max(1, Math.ceil(total / normalizedSize)) };
};

export const approvedLeaveTotals = (rows = []) => rows.filter((row) => row.status === "approved").reduce((totals, row) => {
  const amount = Number(row.chargeable_amount || 0);
  if (row.is_paid) totals.paid += amount;
  else totals.unpaid += amount;
  return totals;
}, { paid: 0, unpaid: 0 });
