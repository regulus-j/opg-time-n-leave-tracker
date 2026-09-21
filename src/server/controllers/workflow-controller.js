import { HttpError } from "../views/problem-view.js";

export const workflowController = (
  send,
  withTransaction,
  service,
  repository,
  entity,
  resource,
  expected,
  nextStatus,
  action,
) =>
  send(async (req) =>
    withTransaction(async (client) => {
      if (
        action === "leave_force_approve" &&
        (typeof req.body?.reason !== "string" || !req.body.reason.trim())
      )
        throw new HttpError(
          422,
          "Reason Required",
          "A meaningful reason is required for force approval.",
        );
      const row = await service.transition(
        client,
        resource,
        repository.resources[resource][2],
        req.tenantId,
        req.params.id,
        expected,
        nextStatus,
        {
          expectedVersion: req.expectedVersion,
          userId: req.actor.user_id,
          employeeId: req.actor.employee_id,
          capabilities: req.actor.capabilities,
        },
      );
      await service.audit(
        client,
        req,
        action,
        entity,
        req.params.id,
        req.body?.reason || null,
      );
      return row;
    }),
  );
