import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { SharePayloadType, TemplateShareData, PersonaShareData, ShareData } from "../types";

export const CURRENT_SHARE_VERSION = 1;
export const MAX_URL_LENGTH = 2000;
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_PROMPT_LENGTH = 10000;

export interface SharePayload {
  type: SharePayloadType;
  version: number;
  data: ShareData;
}

export type ShareValidationResult =
  | { valid: true; payload: SharePayload }
  | { valid: false; error: string };

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json);
}

export function generateShareUrl(
  payload: SharePayload,
): { success: true; url: string } | { success: false; error: string } {
  const encoded = encodeSharePayload(payload);
  const url = `${globalThis.location.origin}/?share=${encoded}`;
  if (url.length > MAX_URL_LENGTH) {
    return {
      success: false,
      error: "Content too large to share via URL. Try shortening the prompt text.",
    };
  }
  return { success: true, url };
}

export function decodeSharePayload(encoded: string): ShareValidationResult {
  // Stage 1 — Decompression
  const decompressed = decompressFromEncodedURIComponent(encoded);
  if (decompressed === null || decompressed === "") {
    return { valid: false, error: "Unable to decompress share data" };
  }

  // Stage 2 — JSON Parsing
  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed);
  } catch {
    return { valid: false, error: "Invalid share data format" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { valid: false, error: "Invalid share data format" };
  }

  const obj = parsed as Record<string, unknown>;

  // Stage 3 — Schema Version Check
  if (typeof obj.version !== "number") {
    return { valid: false, error: "Invalid share data version" };
  }
  if (obj.version > CURRENT_SHARE_VERSION) {
    return {
      valid: false,
      error: "This share link requires a newer version of OpenPrompter",
    };
  }
  if (obj.version < 1 || !Number.isInteger(obj.version)) {
    return { valid: false, error: "Invalid share data version" };
  }

  // Stage 4 — Type Field Validation
  if (obj.type !== "template" && obj.type !== "persona") {
    return { valid: false, error: "Unknown share type" };
  }

  // Stage 5 — Data Field Validation
  if (typeof obj.data !== "object" || obj.data === null) {
    return { valid: false, error: "Share data is missing required fields" };
  }

  const data = obj.data as Record<string, unknown>;

  if (obj.type === "template") {
    const required = ["name", "category", "description", "promptText", "iconName"] as const;
    for (const field of required) {
      if (typeof data[field] !== "string") {
        return { valid: false, error: "Share data is missing required fields" };
      }
    }
  } else {
    const required = ["name", "description", "systemPrompt"] as const;
    for (const field of required) {
      if (typeof data[field] !== "string") {
        return { valid: false, error: "Share data is missing required fields" };
      }
    }
  }

  // Stage 6 — Length Limit Enforcement
  if (
    (data.name as string).length > MAX_NAME_LENGTH ||
    (data.description as string).length > MAX_DESCRIPTION_LENGTH
  ) {
    return { valid: false, error: "Share data exceeds allowed size limits" };
  }

  if (obj.type === "template" && (data.promptText as string).length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: "Share data exceeds allowed size limits" };
  }
  if (obj.type === "persona" && (data.systemPrompt as string).length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: "Share data exceeds allowed size limits" };
  }

  // Stage 7 — Sanitization
  const sanitized: ShareData = {
    ...data,
    name: (data.name as string).trim(),
    description: (data.description as string).trim(),
  } as ShareData;

  if (obj.type === "template") {
    (sanitized as TemplateShareData).category = (data.category as string).trim();
    (sanitized as TemplateShareData).promptText = (data.promptText as string).trim();
    (sanitized as TemplateShareData).iconName = (data.iconName as string).trim();
  } else {
    (sanitized as PersonaShareData).systemPrompt = (data.systemPrompt as string).trim();
  }

  if (!sanitized.name) {
    return { valid: false, error: "Share data has invalid name" };
  }

  const payload: SharePayload = {
    type: obj.type,
    version: obj.version,
    data: sanitized,
  };

  return { valid: true, payload };
}
