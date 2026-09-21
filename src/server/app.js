import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { notFound, problem } from "./views/problem-view.js";
import {
  requireAuth,
  requireCsrf,
  tenantContext,
  requestId,
  ifMatchVersion,
  requireCapability,
} from "./middleware/index.js";
import * as repository from "./models/resource-model.js";
import * as service from "./services/resource-service.js";
import { withTransaction } from "./config/database.js";
import { send, sendNoContent } from "./controllers/resource-controller.js";
import { workflowController } from "./controllers/workflow-controller.js";
import { authRoutes } from "./routes/auth-routes.js";
import { resourceRoutes } from "./routes/resource-routes.js";
import { workflowRoutes } from "./routes/workflow-routes.js";
import { registerRoutes } from "./routes/index.js";
import { validateRuntimeEnvironment } from "./config/environment.js";
import { requireResourceRead } from "./middleware/authorization.js";
import { platformRoutes } from "./routes/platform-routes.js";
import { reportRoutes } from "./routes/report-routes.js";
import { hrRoutes } from "./routes/hr-routes.js";
import { organizationReportRoutes } from "./routes/organization-report-routes.js";
import { auditRoutes } from "./routes/audit-routes.js";

const transitionHandler = (resource, expected, nextStatus, action) =>
  workflowController(
    send,
    withTransaction,
    service,
    repository,
    repository.resources[resource][0],
    resource,
    expected,
    nextStatus,
    action,
  );

export const createApp = () => {
  validateRuntimeEnvironment();
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "no-referrer");
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      res.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
    }
    next();
  });
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(
    cookieParser(
      process.env.COOKIE_SECRET ||
        process.env.JWT_SECRET ||
        "development-cookie-secret",
    ),
  );
  app.use(requestId);
  app.use("/api/v1/auth", authRoutes());
  app.use("/api/v1", requireAuth, requireCsrf, tenantContext, ifMatchVersion);

  hrRoutes(app, requireCapability);
  organizationReportRoutes(app, requireCapability);
  auditRoutes(app, requireCapability);

  registerRoutes(
    app,
    (target) =>
      resourceRoutes(
        target,
        repository.resources,
        service,
        send,
        sendNoContent,
        requireCapability,
        requireResourceRead,
      ),
    (target) =>
      workflowRoutes(
        target,
        send,
        requireCapability,
        transitionHandler,
        service,
      ),
  );
  platformRoutes(app, requireCapability);
  reportRoutes(app, requireCapability);

  // Vercel serves the Vite output itself. Keep static serving only for the
  // conventional local production process started with `npm start`.
  if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") {
    app.use(
      express.static(
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "../../dist",
        ),
      ),
    );
  }
  app.use(notFound);
  app.use(problem);
  return app;
};
