import type { BaseUnit } from "@/lib/units";

const BASE_UNITS = new Set<BaseUnit>(["g", "mL", "unit"]);

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function parseIdParam(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Invalid resource id.");
  }

  return parsed;
}

export function parseRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

export function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid text field.");
  }

  return value.trim();
}

export function parseBaseUnit(value: unknown): BaseUnit {
  const baseUnit = parseRequiredString(value, "base_unit");

  if (!BASE_UNITS.has(baseUnit as BaseUnit)) {
    throw new ApiError(400, "base_unit must be one of g, mL, or unit.");
  }

  return baseUnit as BaseUnit;
}

export function parseNonNegativeNumber(
  value: unknown,
  fieldName: string,
  options?: { integer?: boolean }
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number.`);
  }

  if (options?.integer && !Number.isInteger(parsed)) {
    throw new ApiError(400, `${fieldName} must be an integer.`);
  }

  return parsed;
}

export function parsePricePaise(body: Record<string, unknown>): number {
  const rawPrice =
    body.price_per_base_paise !== undefined
      ? body.price_per_base_paise
      : body.price_per_base;

  if (rawPrice === undefined) {
    throw new ApiError(400, "price_per_base_paise is required.");
  }

  return parseNonNegativeNumber(rawPrice, "price_per_base_paise", {
    integer: true,
  });
}
