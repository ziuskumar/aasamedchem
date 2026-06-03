const conversionMap: Record<string, number> = {
  g: 1,
  kg: 1000,

  mL: 1,
  L: 1000,

  unit: 1,
};

export function toBaseQty(qty: number, unit: string): number {
  const factor = conversionMap[unit];

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

export function getCompatibleUnits(baseUnit: string): string[] {
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