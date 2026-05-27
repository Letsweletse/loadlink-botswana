export type TruckSize = "mini" | "medium" | "big";

export const TRUCK_TIERS: Record<
  TruckSize,
  {
    label: string;
    capacity: string;
    baseFare: number;
    perKm: number;
    deposit: number;
    description: string;
    licence: string;
  }
> = {
  mini: {
    label: "Van / Mini Truck",
    capacity: "Under 2 tons",
    baseFare: 250,
    perKm: 8,
    deposit: 50,
    description: "Small loads, furniture, deliveries",
    licence: "Code B driver's licence",
  },
  medium: {
    label: "Medium Truck",
    capacity: "Under 7 tons",
    baseFare: 700,
    perKm: 18,
    deposit: 100,
    description: "Office moves, bulk goods",
    licence: "Code C1 + PrDP",
  },
  big: {
    label: "Big Truck",
    capacity: "Over 7 tons",
    baseFare: 1500,
    perKm: 32,
    deposit: 200,
    description: "Heavy cargo, cross-border (SACU)",
    licence: "Code C + PrDP + BA Permit",
  },
};

export const BASE_RADIUS_KM = 12;
export const COMMISSION = 0.1;

export function estimateFare(size: TruckSize, distanceKm: number) {
  const tier = TRUCK_TIERS[size];
  const extra = Math.max(0, distanceKm - BASE_RADIUS_KM);
  return Math.round(tier.baseFare + extra * tier.perKm);
}