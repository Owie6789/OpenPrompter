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

// --- decodeSharePayload helpers ---

function parseDecompressed(encoded: string): { ok: true; raw: string } | { ok: false; error: string } {
  const raw = decompressFromEncodedURIComponent(encoded);
  if (!raw) return { ok: false, error: "Unable to decompress share data" };
  return { ok: true, raw };
}

function parseJson(raw: string): { ok: true; obj: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "Invalid share data format" };
    }
    return { ok: true, obj: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid share data format" };
  }
}

function validateVersion(obj: Record<string, unknown>): string | null {
  if (typeof obj.version !== "number" || obj.version < 1 || !Number.isInteger(obj.version)) {
    return "Invalid share data version";
  }
  if (obj.version > CURRENT_SHARE_VERSION) {
    return "This share link requires a newer version of OpenPrompter";
  }
  return null;
}

function validateType(obj: Record<string, unknown>): SharePayloadType | null {
  if (obj.type === "template") return "template";
  if (obj.type === "persona") return "persona";
  return null;
}

function validateDataFields(type: SharePayloadType, dataObj: unknown): string | null {
  if (typeof dataObj !== "object" || dataObj === null) {
    return "Share data is missing required fields";
  }
  const data = dataObj as Record<string, unknown>;
  const required = type === "template"
    ? ["name", "category", "description", "promptText", "iconName"]
    : ["name", "description", "systemPrompt"];
  for (const field of required) {
    if (typeof data[field] !== "string") {
      return "Share data is missing required fields";
    }
  }
  return null;
}

function validateLengths(type: SharePayloadType, data: Record<string, unknown>): string | null {
  if (
    (data.name as string).length > MAX_NAME_LENGTH ||
    (data.description as string).length > MAX_DESCRIPTION_LENGTH
  ) {
    return "Share data exceeds allowed size limits";
  }
  const promptField = type === "template" ? "promptText" : "systemPrompt";
  if ((data[promptField] as string).length > MAX_PROMPT_LENGTH) {
    return "Share data exceeds allowed size limits";
  }
  return null;
}

function sanitizeData(type: SharePayloadType, raw: Record<string, unknown>): ShareData | null {
  const trimmed = { name: (raw.name as string).trim(), description: (raw.description as string).trim() };
  if (!trimmed.name) return null;

  if (type === "template") {
    return {
      ...trimmed,
      category: (raw.category as string).trim(),
      promptText: (raw.promptText as string).trim(),
      iconName: (raw.iconName as string).trim(),
    } as TemplateShareData;
  }
  return {
    ...trimmed,
    systemPrompt: (raw.systemPrompt as string).trim(),
  } as PersonaShareData;
}

export function decodeSharePayload(encoded: string): ShareValidationResult {
  const decomp = parseDecompressed(encoded);
  if (!decomp.ok) {
    const err: string = (decomp as { ok: false; error: string }).error;
    return { valid: false, error: err };
  }

  const parsed = parseJson(decomp.raw);
  if (!parsed.ok) {
    const err: string = (parsed as { ok: false; error: string }).error;
    return { valid: false, error: err };
  }

  const versionError = validateVersion(parsed.obj);
  if (versionError) return { valid: false, error: versionError };

  const shareType = validateType(parsed.obj);
  if (!shareType) return { valid: false, error: "Unknown share type" };

  const fieldError = validateDataFields(shareType, parsed.obj.data);
  if (fieldError) return { valid: false, error: fieldError };

  const lengthError = validateLengths(shareType, parsed.obj.data as Record<string, unknown>);
  if (lengthError) return { valid: false, error: lengthError };

  const sanitized = sanitizeData(shareType, parsed.obj.data as Record<string, unknown>);
  if (!sanitized) return { valid: false, error: "Share data has invalid name" };

  return {
    valid: true,
    payload: {
      type: shareType,
      version: parsed.obj.version as number,
      data: sanitized,
    },
  };
}
