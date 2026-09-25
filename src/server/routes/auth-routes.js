import express from "express";
import { send } from "../controllers/resource-controller.js";
import { acceptInvitation, context, login, logout, me } from "../controllers/auth-controller.js";
import { requireAuth, requireCsrf } from "../middleware/authentication.js";
import { loginRateLimit } from "../middleware/login-rate-limit.js";

export const authRoutes = () => {
  const router = express.Router();
  router.post("/login", loginRateLimit, send(login));
  router.post("/invitations/accept", send(acceptInvitation));
  router.get("/me", requireAuth, send(me));
  router.post("/context", requireAuth, requireCsrf, send(context));
  router.post("/logout", requireAuth, requireCsrf, async (req, res, next) => {
    try {
      await logout(req, res);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  return router;
};
