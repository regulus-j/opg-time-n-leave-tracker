import express from "express";
import * as service from "../services/platform-service.js";
import { send } from "../controllers/resource-controller.js";

export const platformRoutes = (app, requireCapability) => {
  const router = express.Router();
  router.get("/tenants", requireCapability("platform:read"), send(service.listTenants));
  router.get("/access", requireCapability("platform:read"), send(service.listAccess));
  router.get("/audit-events", requireCapability("platform-audit:read"), send(service.listAudit));
  router.get("/settings", requireCapability("platform:read"), send(service.listSettings));
  router.put("/settings", requireCapability("organizations:write"), send(service.updateSettings));
  router.put("/tenants/:tenant_id/status", requireCapability("organizations:write"), send(service.updateTenantStatus));
  app.use("/api/v1/platform", router);
};
