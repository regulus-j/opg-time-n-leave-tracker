const required = (name) => {
  if (!process.env[name]) throw new Error(`${name} is required in production.`);
};

export const validateRuntimeEnvironment = () => {
  if (process.env.NODE_ENV !== "production") return;
  for (const name of [
    "DATABASE_URL",
    "JWT_SECRET",
    "CSRF_SECRET",
    "COOKIE_SECRET",
  ])
    required(name);
  if (process.env.DB_SSL !== "true")
    throw new Error("DB_SSL=true is required in production.");
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED === "false")
    throw new Error("Production database TLS certificates must be verified.");
  if (process.env.COOKIE_SECURE !== "true")
    throw new Error("COOKIE_SECURE=true is required in production.");
  for (const name of ["JWT_SECRET", "CSRF_SECRET", "COOKIE_SECRET"]) {
    if (process.env[name].length < 32)
      throw new Error(
        `${name} must contain at least 32 characters in production.`,
      );
  }
};
