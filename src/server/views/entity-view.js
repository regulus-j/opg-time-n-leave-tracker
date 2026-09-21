import { validateOutput } from "../validation/schema-validator.js";

export const serializeEntity = (entityName, entity) =>
  validateOutput(entityName, entity);
