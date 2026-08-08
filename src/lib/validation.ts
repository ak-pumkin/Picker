import { z } from "zod";

// Mirrors the frontend's item shape: { id, text, weight, color }.
export const itemSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().min(1, "Item text can't be empty").max(500),
  weight: z.number().positive().max(1000).optional().default(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a hex string like #8B6CFF")
    .nullable()
    .optional(),
});

export const listCreateSchema = z.object({
  name: z.string().min(1, "List name can't be empty").max(200),
  items: z.array(itemSchema).max(5000, "That's a lot of items — max 5000 per list"),
});

export const listUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  items: z.array(itemSchema).max(5000).optional(),
});

export const historyCreateSchema = z.object({
  type: z.string().min(1).max(100),
  result: z.string().min(1).max(2000),
  meta: z.string().max(200).optional().nullable(),
});

export const syncListSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  items: z.array(itemSchema).max(5000),
});

export const syncHistorySchema = z.object({
  id: z.string().min(1).max(100),
  type: z.string().min(1).max(100),
  result: z.string().min(1).max(2000),
  meta: z.string().max(200).optional().nullable(),
});

export const syncPayloadSchema = z.object({
  lists: z.array(syncListSchema).max(500, "Too many lists in one sync payload"),
  history: z.array(syncHistorySchema).max(1000, "Too many history entries in one sync payload"),
});

/**
 * Parses `body` against `schema`, returning either the typed data or a
 * ready-to-send 400 response — so route handlers can do:
 *
 *   const parsed = validate(schema, body);
 *   if (parsed.error) return parsed.error;
 *   const data = parsed.data;
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T>; error?: undefined } | { data?: undefined; error: Response } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: result.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { data: result.data };
}
