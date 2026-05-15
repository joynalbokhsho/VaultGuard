/**
 * INPUT SANITIZATION
 * ===================
 * Server-side sanitization for all user inputs.
 * DOMPurify is used client-side; this module handles server-side.
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sanitize a plain string — remove HTML/script injection attempts.
 * Used for non-encrypted fields stored in DB (type, tags, etc.)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/javascript:/gi, "") // Strip javascript: URIs
    .replace(/on\w+\s*=/gi, "") // Strip event handlers
    .trim()
    .substring(0, 1000); // Enforce max length
}

/**
 * Sanitize an array of tags.
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => sanitizeString(tag).substring(0, 50))
    .filter((tag) => tag.length > 0)
    .slice(0, 20); // Max 20 tags
}

/**
 * Parse and validate request body with Zod schema.
 * Returns parsed data or throws a 400 response.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T | NextResponse> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    return result.data;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

/**
 * Check if a response is an error response.
 */
export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * Sanitize URL — ensure it's a valid http/https URL.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}
