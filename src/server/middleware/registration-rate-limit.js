import { HttpError } from "../views/problem-view.js";

const attempts = new Map();
const windowMs = () => Number(process.env.REGISTRATION_RATE_WINDOW_MS || 60 * 60 * 1000);
const maximum = () => Number(process.env.REGISTRATION_RATE_MAX || 5);

export const registrationRateLimit = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const email = typeof req.body?.admin?.email === "string" ? req.body.admin.email.trim().toLowerCase() : "unknown";
  const key = `${ip}:${email}`;
  const currentTime = Date.now();
  const current = attempts.get(key);
  const record = !current || current.resetAt <= currentTime
    ? { count: 0, resetAt: currentTime + windowMs() }
    : current;
  record.count += 1;
  attempts.set(key, record);
  res.set("RateLimit-Limit", String(maximum()));
  res.set("RateLimit-Remaining", String(Math.max(0, maximum() - record.count)));
  res.set("RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));
  if (record.count > maximum()) {
    res.set("Retry-After", String(Math.max(1, Math.ceil((record.resetAt - currentTime) / 1000))));
    return next(new HttpError(429, "Too Many Requests", "Too many registration attempts. Try again later."));
  }
  next();
};
