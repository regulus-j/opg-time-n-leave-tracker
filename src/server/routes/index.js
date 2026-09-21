export const registerRoutes = (
  app,
  registerResourceRoutes,
  registerWorkflowRoutes,
) => {
  registerResourceRoutes(app);
  registerWorkflowRoutes(app);
  return app;
};
