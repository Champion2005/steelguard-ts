import type { ZodIssue, ZodTypeAny } from "zod";

/**
 * Validate parsed data against a Zod schema with LLM-friendly coercion.
 *
 * Before running `schema.safeParse()`, this module applies a lightweight
 * coercion pre-pass that handles the most common LLM type mismatches:
 *
 * | Input | Schema expects | Coerced to |
 * |---|---|---|
 * | `"true"` / `"false"` | `boolean` | `true` / `false` |
 * | `"42"`, `"3.14"` | `number` | `42`, `3.14` |
 * | `"null"` | `null` / `nullable` | `null` |
 *
 * Coercion is applied iteratively using a work queue (not recursion) to
 * comply with the project's security guidelines around stack safety.
 *
 * @module
 */

/** Successful validation result. */
export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

/** Failed validation result. */
export interface ValidationFailure {
  success: false;
  errors: ZodIssue[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validate `data` against a Zod `schema`, applying coercion for common
 * LLM type mismatches before validation.
 *
 * @typeParam T - The Zod schema type.
 * @param data   - The parsed (but untyped) JavaScript value.
 * @param schema - The Zod schema to validate against.
 * @returns A discriminated-union result with either typed data or Zod errors.
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * validateWithSchema({ age: "25", active: "true" }, z.object({ age: z.number(), active: z.boolean() }));
 * // => { success: true, data: { age: 25, active: true } }
 * ```
 */
export function validateWithSchema<T extends ZodTypeAny>(
  data: unknown,
  schema: T,
): ValidationResult<ReturnType<T["parse"]>> {
  // First attempt without coercion (fast path).
  const direct = schema.safeParse(data);
  if (direct.success) {
    return { success: true, data: direct.data };
  }

  // Apply coercion and try again.
  const coerced = coerceForSchema(data, schema);
  const result = schema.safeParse(coerced);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error.issues };
}

// ---------------------------------------------------------------------------
// Coercion Engine — iterative, schema-aware
// ---------------------------------------------------------------------------

/**
 * Attempt to coerce `data` to better match `schema` expectations.
 *
 * Uses a work queue to iteratively walk the data/schema tree without
 * recursion. Only coerces when the schema explicitly expects a different
 * primitive type than what the data contains.
 */
function coerceForSchema(data: unknown, schema: ZodTypeAny): unknown {
  // For primitives at the top level, try direct coercion.
  if (typeof data !== "object" || data === null) {
    return coercePrimitive(data, schema);
  }

  // For objects/arrays, clone & iteratively coerce leaves.
  const root = Array.isArray(data) ? [...data] : { ...data };

  // Work queue: [parentRef, key, subSchema]
  type WorkItem = {
    parent: Record<string, unknown> | unknown[];
    key: string | number;
    subSchema: ZodTypeAny;
  };

  const queue: WorkItem[] = [];
  enqueueChildren(root, schema, queue);

  // Process up to a sane limit to prevent DoS on adversarial inputs.
  const MAX_ITERATIONS = 50_000;
  let iterations = 0;

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const item = queue.shift()!;
    const value = (item.parent as Record<string | number, unknown>)[item.key];

    if (typeof value === "object" && value !== null) {
      // Clone nested objects/arrays so we don't mutate the original.
      const cloned = Array.isArray(value) ? [...value] : { ...value };
      (item.parent as Record<string | number, unknown>)[item.key] = cloned;
      enqueueChildren(cloned, item.subSchema, queue);
    } else {
      // Leaf — try primitive coercion.
      const coerced = coercePrimitive(value, item.subSchema);
      if (coerced !== value) {
        (item.parent as Record<string | number, unknown>)[item.key] = coerced;
      }
    }
  }

  return root;
}

/**
 * Coerce a single primitive value based on what the schema expects.
 * Unwraps ZodOptional, ZodNullable, and ZodDefault wrappers to
 * find the inner type for coercion.
 */
function coercePrimitive(value: unknown, schema: ZodTypeAny): unknown {
  if (typeof value !== "string") return value;

  const typeName = getSchemaTypeName(schema);

  // Unwrap wrapper types to get at the actual target type.
  if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
    const def = (schema as { _def?: Record<string, unknown> })._def;
    const inner = getInnerSchema(def);

    // For nullable, also check "null" string before unwrapping.
    if (typeName === "ZodNullable" && value === "null") return null;

    if (inner) return coercePrimitive(value, inner);
    return value;
  }

  if (typeName === "ZodBoolean") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  if (typeName === "ZodNumber") {
    const n = Number(value);
    if (value.trim() !== "" && !Number.isNaN(n)) return n;
  }

  if (typeName === "ZodNull") {
    if (value === "null") return null;
  }

  return value;
}

/**
 * Enqueue child fields/elements depending on the schema kind.
 */
function enqueueChildren(
  parent: Record<string, unknown> | unknown[],
  schema: ZodTypeAny,
  queue: { parent: Record<string, unknown> | unknown[]; key: string | number; subSchema: ZodTypeAny }[],
): void {
  const typeName = getSchemaTypeName(schema);
  const def = (schema as { _def?: Record<string, unknown> })._def;

  if (typeName === "ZodObject" && def) {
    const shape = typeof (schema as unknown as { shape?: unknown }).shape === "object"
      ? (schema as unknown as { shape: Record<string, ZodTypeAny> }).shape
      : null;
    if (shape) {
      for (const key of Object.keys(shape)) {
        if (key in (parent as Record<string, unknown>)) {
          queue.push({ parent, key, subSchema: shape[key]! });
        }
      }
    }
  } else if (typeName === "ZodArray" && def && Array.isArray(parent)) {
    const elementSchema = (def as { type?: ZodTypeAny }).type;
    if (elementSchema) {
      for (let i = 0; i < parent.length; i++) {
        queue.push({ parent, key: i, subSchema: elementSchema });
      }
    }
  } else if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
    // Unwrap wrapper types and re-process.
    const inner = getInnerSchema(def);
    if (inner) {
      enqueueChildren(parent, inner, queue);
    }
  }
}

// ---------------------------------------------------------------------------
// Schema introspection helpers
// ---------------------------------------------------------------------------

function getSchemaTypeName(schema: ZodTypeAny): string {
  const def = (schema as { _def?: { typeName?: string } })._def;
  return def?.typeName ?? "";
}

function getInnerSchema(def: Record<string, unknown> | undefined): ZodTypeAny | null {
  if (!def) return null;
  // ZodOptional, ZodNullable store inner schema as `innerType`.
  // ZodDefault stores it as `innerType` as well.
  const inner = def.innerType as ZodTypeAny | undefined;
  return inner ?? null;
}
