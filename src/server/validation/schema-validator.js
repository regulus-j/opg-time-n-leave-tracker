import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { HttpError } from "../views/problem-view.js";

const schemaPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.agent/instructions/schema.json",
);
const rawSchema = JSON.parse(await readFile(schemaPath, "utf8"));
if (!rawSchema.$defs || typeof rawSchema.$defs !== "object")
  throw new Error(`Canonical schema is invalid: ${schemaPath}`);
export const schema = rawSchema;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const typeMatches = (value, type) => {
  if (type === "null") return value === null;
  if (type === "string") return typeof value === "string";
  if (type === "integer") return Number.isInteger(value);
  if (type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "object") return isObject(value);
  if (type === "array") return Array.isArray(value);
  return true;
};

const validateValue = (value, rule, field) => {
  const types = Array.isArray(rule.type) ? rule.type : [rule.type];
  if (!types.some((type) => typeMatches(value, type)))
    throw new HttpError(
      400,
      "Invalid Request",
      `${field} has an invalid type.`,
    );
  if (value === null) return;
  if (rule.minLength !== undefined && value.length < rule.minLength)
    throw new HttpError(400, "Invalid Request", `${field} must not be empty.`);
  if (rule.minimum !== undefined && value < rule.minimum)
    throw new HttpError(
      400,
      "Invalid Request",
      `${field} is below the minimum.`,
    );
  if (rule.enum && !rule.enum.includes(value))
    throw new HttpError(
      400,
      "Invalid Request",
      `${field} is not an allowed value.`,
    );
  if (rule.format === "email" && !/^\S+@\S+\.\S+$/.test(value))
    throw new HttpError(
      400,
      "Invalid Request",
      `${field} must be an email address.`,
    );
  if (rule.type === "array") {
    for (const [index, item] of value.entries())
      validateValue(item, rule.items, `${field}[${index}]`);
  }
};

export const validateEntity = (
  entityName,
  value,
  { allowUnknown = false } = {},
) => {
  const definition = schema.$defs[entityName];
  if (!definition || !isObject(value))
    throw new HttpError(
      400,
      "Invalid Request",
      `Expected a ${entityName} object.`,
    );
  const allowed = new Set(Object.keys(definition.properties));
  if (!allowUnknown) {
    for (const key of Object.keys(value))
      if (!allowed.has(key))
        throw new HttpError(
          400,
          "Invalid Request",
          `${key} is not part of ${entityName}.`,
        );
  }
  for (const field of definition.required) {
    if (!(field in value))
      throw new HttpError(400, "Invalid Request", `${field} is required.`);
    validateValue(value[field], definition.properties[field], field);
  }
  return value;
};

export const validateOutput = (entityName, value) =>
  validateEntity(entityName, value);
