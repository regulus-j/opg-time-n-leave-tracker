import { HttpError } from "../views/problem-view.js";
export { requireCapability } from "./index.js";

const administratorResources = new Set([
  "users",
  "departments",
  "locations",
  "work-schedules",
  "job-profiles",
  "job-leave-policies",
  "attachments",
  "holiday-calendars",
  "audit-events",
]);
const managerReferenceResources = new Set([
  "departments",
  "locations",
  "job-profiles",
  "leave-types",
  "holiday-calendars",
  "work-schedules",
]);

export const requireResourceRead = (resource) => (req, _res, next) => {
  if (
    !administratorResources.has(resource) ||
    req.actor?.capabilities?.includes("users:write") ||
    (managerReferenceResources.has(resource) && req.actor?.capabilities?.includes("leave:approve"))
  )
    return next();
  next(
    new HttpError(
      403,
      "Forbidden",
      "The actor cannot read this administrative resource.",
    ),
  );
};
