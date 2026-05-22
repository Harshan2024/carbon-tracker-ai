/**
 * CarbonTracker AI - Carbon Emission Calculation Engine
 * 
 * All emission factors are sourced from:
 * - US EPA GHG Emission Factors Hub (2025)
 * - UK Govt DESNZ Conversion Factors (2024)
 * - IEA Electricity Grid Intensity (2025)
 * - IPCC Guidelines (2006/2019)
 * - Our World in Data CO2 Dataset
 */

// ──── Safety Level Thresholds (kg CO₂/day) ────
export const SAFETY_LEVELS = [
  { level: 1, name: "Eco-Champion",  label: "Safe - Ultra Low",     max: 2.0,   color: "#00ff87", emoji: "🟢" },
  { level: 2, name: "Eco-Friendly",  label: "Safe - Low",           max: 5.0,   color: "#00e0ff", emoji: "🌐" },
  { level: 3, name: "Moderate",      label: "Warning - Average",    max: 15.0,  color: "#ffdd00", emoji: "🟡" },
  { level: 4, name: "Elevated",      label: "Risk - High",          max: 30.0,  color: "#ff8800", emoji: "🟠" },
  { level: 5, name: "Critical",      label: "Danger - Ultra High",  max: Infinity, color: "#ff0044", emoji: "🔴" },
];

export function getSafetyLevel(dailyCo2: number) {
  for (const lvl of SAFETY_LEVELS) {
    if (dailyCo2 <= lvl.max) return lvl;
  }
  return SAFETY_LEVELS[4];
}

// ──── "If Everyone Lived Like You" Planet Count ────
// Global per-capita target: ~6.5 kg CO₂/day (Paris Agreement 2050 target ~2.3 tonnes/year)
const PARIS_DAILY_TARGET = 6.3; // kg CO₂/day (2300 / 365)

export function getPlanetCount(dailyCo2: number): number {
  if (dailyCo2 <= 0) return 0;
  return Math.round((dailyCo2 / PARIS_DAILY_TARGET) * 10) / 10;
}

// ──── Fallback Emission Factor Lookup (used when DB is unavailable) ────
export const EMISSION_FACTORS: Record<string, Record<string, { factor: number; unit: string; source: string }>> = {
  transportation: {
    "petrol-car":       { factor: 0.170, unit: "km", source: "UK Govt DESNZ 2024" },
    "diesel-car":       { factor: 0.165, unit: "km", source: "UK Govt DESNZ 2024" },
    "electric-car":     { factor: 0.050, unit: "km", source: "UK Govt DESNZ 2024" },
    "bus-travel":       { factor: 0.080, unit: "km", source: "UK Govt DESNZ 2024" },
    "train-travel":     { factor: 0.035, unit: "km", source: "UK Govt DESNZ 2024" },
    "flight-short-haul":{ factor: 0.150, unit: "km", source: "IPCC / DESNZ" },
    "flight-long-haul": { factor: 0.190, unit: "km", source: "IPCC / DESNZ" },
    "bike-travel":      { factor: 0.000, unit: "km", source: "Zero Emission" },
    "auto-rickshaw":    { factor: 0.060, unit: "km", source: "India CPCB Estimate" },
    "motorcycle":       { factor: 0.100, unit: "km", source: "UK Govt DESNZ 2024" },
  },
  electricity: {
    "grid-power-IN":     { factor: 0.710, unit: "kWh", source: "India CEA / IEA 2025" },
    "grid-power-US":     { factor: 0.370, unit: "kWh", source: "US EPA eGRID 2025" },
    "grid-power-UK":     { factor: 0.210, unit: "kWh", source: "UK Govt DESNZ 2025" },
    "grid-power-GLOBAL": { factor: 0.440, unit: "kWh", source: "IEA Global Average 2025" },
  },
  fuel: {
    "petrol-fuel":  { factor: 2.310, unit: "litre", source: "US EPA 2025" },
    "diesel-fuel":  { factor: 2.680, unit: "litre", source: "US EPA 2025" },
    "lpg-fuel":     { factor: 1.510, unit: "litre", source: "US EPA 2025" },
    "natural-gas":  { factor: 2.020, unit: "m3", source: "US EPA 2025" },
  },
  food: {
    "beef-diet":        { factor: 27.000, unit: "kg", source: "Our World in Data" },
    "lamb-diet":        { factor: 24.000, unit: "kg", source: "Our World in Data" },
    "chicken-diet":     { factor: 6.900,  unit: "kg", source: "Our World in Data" },
    "fish-diet":        { factor: 5.400,  unit: "kg", source: "Our World in Data" },
    "egg-diet":         { factor: 4.500,  unit: "kg", source: "Our World in Data" },
    "rice-diet":        { factor: 1.200,  unit: "kg", source: "Our World in Data" },
    "vegetarian-meal":  { factor: 0.800,  unit: "meal", source: "Our World in Data" },
    "vegan-meal":       { factor: 0.400,  unit: "meal", source: "Our World in Data" },
    "biryani-chicken":  { factor: 1.800,  unit: "plate", source: "Composite (chicken+rice+spices)" },
    "biryani-mutton":   { factor: 3.200,  unit: "plate", source: "Composite (mutton+rice+spices)" },
    "biryani-veg":      { factor: 0.600,  unit: "plate", source: "Composite (veg+rice+spices)" },
  },
  delivery: {
    "delivery-package": { factor: 0.800, unit: "order", source: "US EPA 2025" },
    "food-delivery":    { factor: 0.500, unit: "order", source: "EPA / Transport Estimate" },
  },
  plastic: {
    "single-use-bottle": { factor: 0.080, unit: "item", source: "IPCC 2006" },
    "plastic-bag":       { factor: 0.040, unit: "item", source: "IPCC 2006" },
    "mixed-plastic":     { factor: 1.800, unit: "kg",   source: "IPCC 2006" },
  },
  offset: {
    "plant-tree":        { factor: -21.800, unit: "tree", source: "EPA / Arbor Day Foundation" },
    "solar-funding":     { factor: -50.000, unit: "block", source: "Gold Standard offsets" },
    "wind-funding":      { factor: -100.000, unit: "block", source: "Gold Standard offsets" },
  },
};

/**
 * Calculate CO₂ emission for a given activity
 */
export function calculateEmission(
  category: string,
  subcategory: string,
  quantity: number,
  region: string = "GLOBAL"
): { co2: number; formula: string; source: string; unit: string } {
  let sub = subcategory;

  // Handle region-specific electricity
  if (category === "electricity") {
    sub = `grid-power-${region}`;
    if (!EMISSION_FACTORS.electricity[sub]) {
      sub = "grid-power-GLOBAL";
    }
  }

  const categoryFactors = EMISSION_FACTORS[category];
  if (!categoryFactors || !categoryFactors[sub]) {
    return {
      co2: 0,
      formula: "Unknown activity",
      source: "N/A",
      unit: "unknown",
    };
  }

  const ef = categoryFactors[sub];
  const co2 = Math.round(quantity * ef.factor * 1000) / 1000;

  return {
    co2,
    formula: `${quantity} ${ef.unit} × ${ef.factor} kg CO₂/${ef.unit} = ${co2} kg CO₂`,
    source: ef.source,
    unit: ef.unit,
  };
}

// ──── Quest Templates ────
export const QUEST_TEMPLATES = [
  {
    questId: "velocity-shift",
    title: "🚲 The Velocity Shift",
    description: "Swap 5 km of driving for cycling or walking today.",
    xpReward: 150,
    co2Reduction: 0.85,
    targetCategory: "transportation",
  },
  {
    questId: "phantom-load",
    title: "🔌 Phantom Load Hunt",
    description: "Unplug 3 idle appliances and switch off AC for 2 hours.",
    xpReward: 120,
    co2Reduction: 1.2,
    targetCategory: "electricity",
  },
  {
    questId: "green-feast",
    title: "🥗 The Green Feast",
    description: "Replace a meat meal with a vegetarian or vegan meal today.",
    xpReward: 100,
    co2Reduction: 2.5,
    targetCategory: "food",
  },
  {
    questId: "zero-plastic",
    title: "♻️ Zero Plastic Hero",
    description: "Avoid all single-use plastics today. Carry a reusable bottle.",
    xpReward: 80,
    co2Reduction: 0.3,
    targetCategory: "plastic",
  },
  {
    questId: "local-harvest",
    title: "🌾 The Local Harvest",
    description: "Buy locally-sourced produce instead of imported goods.",
    xpReward: 90,
    co2Reduction: 0.6,
    targetCategory: "food",
  },
  {
    questId: "transit-switch",
    title: "🚌 Transit Switch",
    description: "Use public transport instead of personal vehicle for one trip.",
    xpReward: 130,
    co2Reduction: 1.0,
    targetCategory: "transportation",
  },
];
