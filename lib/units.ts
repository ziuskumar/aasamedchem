// src/lib/units.ts

export type BaseUnit = "g" | "mL" | "unit";

const UNIT_MAP: Record<string, number> = {
  // Weight
  g: 1,
  kg: 1000,

  // Volume
  mL: 1,
  L: 1000,

  // Count
  unit: 1,
};

export function toBaseQty(qty: number, unit: string): number {
  const factor = UNIT_MAP[unit];

  if (!factor) {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  return qty * factor;
}

export function calcLinePaise(
  baseQty: number,
  pricePerBasePaise: number
): number {
  return Math.round(baseQty * pricePerBasePaise);
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export function getCompatibleUnits(baseUnit: BaseUnit): string[] {
  switch (baseUnit) {
    case "g":
      return ["g", "kg"];

    case "mL":
      return ["mL", "L"];

    case "unit":
      return ["unit"];

    default:
      return [];
  }
}