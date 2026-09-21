import crypto from "node:crypto";
import { HttpError } from "../views/problem-view.js";
export { requireAuth, requireCsrf } from "./authentication.js";

export const requestId = (req, res, next) => {
  const id = req.get("x-request-id") || crypto.randomUUID();
  req.requestId = id;
  res.set("x-request-id", id);
  next();
};

export const requireCapability =
  (...capabilities) =>
  (req, _res, next) => {
    if (
      !capabilities.length ||
      capabilities.some((capability) =>
        req.actor?.capabilities?.includes(capability),
      )
    )
      return next();
    next(
      new HttpError(
        403,
        "Forbidden",
        "The actor does not have the required capability.",
      ),
    );
  };

export const tenantContext = (req, _res, next) => {
  const requested = req.params.tenant_id || req.get("x-tenant-id");
  if (requested && requested !== req.actor.tenant_id)
    return next(
      new HttpError(403, "Forbidden", "Cross-tenant access is denied."),
    );
  req.tenantId = req.actor.tenant_id;
  next();
};

export const ifMatchVersion = (req, _res, next) => {
  if (req.headers["if-match"]) {
    const version = Number(req.headers["if-match"].replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 0)
      return next(
        new HttpError(
          400,
          "Invalid Request",
          "If-Match must contain a non-negative version.",
        ),
      );
    req.expectedVersion = version;
  }
  next();
};
