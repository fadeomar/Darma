// src/shared/http/validation.ts
import { z } from "zod";

export type ValidationErrorPayload = {
  message: "Validation failed";
  issues: Array<{
    path: string;
    code: string;
    message: string;
  }>;
};

export function parseJsonBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
):
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; error: ValidationErrorPayload } {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };

  return {
    ok: false,
    error: {
      message: "Validation failed",
      issues: result.error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      })),
    },
  };
}
