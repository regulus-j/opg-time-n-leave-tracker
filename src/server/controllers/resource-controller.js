// Controllers are intentionally thin: HTTP concerns stay here, domain rules stay in services.
export const send =
  (handler, status = 200) =>
  async (req, res, next) => {
    try {
      const result = await handler(req, res);
      if (Array.isArray(result) && result.pagination) {
        res.set("X-Total-Count", String(result.pagination.total));
        res.set("X-Limit", String(result.pagination.limit));
        res.set("X-Offset", String(result.pagination.offset));
      }
      res.status(status).json(result);
    } catch (error) {
      next(error);
    }
  };

export const sendNoContent = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
