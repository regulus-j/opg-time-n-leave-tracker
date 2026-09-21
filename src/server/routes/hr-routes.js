import express from "express";
import { send } from "../controllers/resource-controller.js";
import * as service from "../services/hr-service.js";

export const hrRoutes = (app, requireCapability) => {
  const router = express.Router();
  router.post("/directory", requireCapability("users:write"), send(service.createDirectoryEntry, 201));
  router.put("/directory/:employee_id", requireCapability("users:write"), send(service.updateDirectoryEntry));
  router.post("/directory/:employee_id/reset-password", requireCapability("users:write"), send(service.resetPassword));
  app.use("/api/v1/hr", router);
};
