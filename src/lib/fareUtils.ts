export const CATEGORIES: Record<string, { label: string; baseFare: number; perKm: number; special?: boolean }> = {
  under_2ton: { label: "Van / Mini (Under 2t)", baseFare: 250, perKm: 8, special: true },
  medium_7ton: { label: "Medium Truck (Under 7t)", baseFare: 450, perKm: 14 },
  big_over_7ton: { label: "Big Truck (Over 7t)", baseFare: 750, perKm: 24 },
  plant_machinery: { label: "Plant & Machinery", baseFare: 500, perKm: 18, special: true },
};

export const BASE_RADIUS_KM = 12;
export const COMMISSION = 0.10;

export function calculateFare(category: string, km: number) {
  const cat = CATEGORIES[category];
  if (!cat) return 0;
  const extra = Math.max(0, km - BASE_RADIUS_KM);
  return Math.round(cat.baseFare + extra * cat.perKm);
}

export function calculateFuelSurcharge(km: number) {
  return Math.round(km * 0.5);
}

export function calculateCommission(amount: number) {
  return Math.round(amount * COMMISSION);
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    Broadcasting: "#2563EB",
    Accepted: "#D97706",
    Collected: "#7C3AED",
    "In transit": "#7C3AED",
    Delivered: "#16A34A",
    Completed: "#16A34A",
  };
  return map[status] ?? "#6B7280";
}

export function getStatusLabel(status: string) {
  return status ?? "Unknown";
}
