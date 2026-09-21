export class HttpError extends Error {
  constructor(status, title, detail, type = "about:blank") {
    super(detail);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
  }
}

export const problem = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const databaseStatus =
    error?.code === "23505"
      ? 409
      : ["23503", "23514", "22P02"].includes(error?.code)
        ? 422
        : null;
  const status = Number.isInteger(error?.status)
    ? error.status
    : databaseStatus || 500;
  const title =
    error?.title ||
    (status === 400
      ? "Invalid Request"
      : status === 409
        ? "Conflict"
        : status === 422
          ? "Unprocessable Entity"
          : "Internal Server Error");
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: error?.type || "about:blank",
      title,
      status,
      detail:
        status >= 500
          ? "The server could not complete the request."
          : error.detail ||
            error.message ||
            "The request could not be processed.",
      instance: req.originalUrl,
      request_id: req.requestId,
    });
};

export const notFound = (req, _res, next) =>
  next(
    new HttpError(
      404,
      "Not Found",
      `No route matches ${req.method} ${req.originalUrl}`,
    ),
  );
