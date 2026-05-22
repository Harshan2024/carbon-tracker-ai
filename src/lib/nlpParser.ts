/**
 * CarbonTracker AI - NLP Activity Parser
 * 
 * Parses natural language input like:
 *   "I ate 1 plate of chicken biryani"
 *   "drove 3 km in a Honda Creta petrol car"
 *   "used AC for 5 hours"
 * 
 * Returns structured { category, subcategory, quantity, unit, name }
 */

export interface ParsedActivity {
  name: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  confidence: number; // 0-1
}

interface PatternRule {
  patterns: RegExp[];
  category: string;
  subcategory: string;
  unit: string;
  defaultQuantity?: number;
  nameTemplate: string;
}

const RULES: PatternRule[] = [
  // ── Transportation ──
  {
    patterns: [
      /(?:drove|drive|driving|car|commut|sedan|suv|hatchback|creta|swift|i20|fortuner|innova|civic|corolla).*?(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer|kilometres)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer|kilometres).*?(?:drove|drive|car|petrol|diesel|suv|sedan)/i,
    ],
    category: "transportation",
    subcategory: "petrol-car",
    unit: "km",
    nameTemplate: "Car travel ({q} km)",
  },
  {
    patterns: [
      /(?:electric\s*car|ev|tesla|bev|electric\s*vehicle).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:electric\s*car|ev|tesla)/i,
    ],
    category: "transportation",
    subcategory: "electric-car",
    unit: "km",
    nameTemplate: "Electric car travel ({q} km)",
  },
  {
    patterns: [
      /(?:bus|bus\s*ride|public\s*bus).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:bus)/i,
    ],
    category: "transportation",
    subcategory: "bus-travel",
    unit: "km",
    nameTemplate: "Bus travel ({q} km)",
  },
  {
    patterns: [
      /(?:train|rail|metro|subway).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:train|rail|metro)/i,
    ],
    category: "transportation",
    subcategory: "train-travel",
    unit: "km",
    nameTemplate: "Train travel ({q} km)",
  },
  {
    patterns: [
      /(?:bike|bicycle|cycling|cycled|pedal).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:bike|bicycle|cycling)/i,
    ],
    category: "transportation",
    subcategory: "bike-travel",
    unit: "km",
    nameTemplate: "Bike travel ({q} km)",
  },
  {
    patterns: [
      /(?:flight|flew|fly|plane|air\s*travel).*?(\d+(?:\.\d+)?)\s*(?:km|kms|hours?|hrs?)/i,
    ],
    category: "transportation",
    subcategory: "flight-short-haul",
    unit: "km",
    nameTemplate: "Flight ({q} km)",
  },
  {
    patterns: [
      /(?:motorcycle|motorbike|scooter|scooty|two\s*wheeler|2\s*wheeler).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:motorcycle|motorbike|scooter|scooty)/i,
    ],
    category: "transportation",
    subcategory: "motorcycle",
    unit: "km",
    nameTemplate: "Motorcycle ride ({q} km)",
  },
  {
    patterns: [
      /(?:auto|auto\s*rickshaw|autorickshaw|tuk\s*tuk).*?(\d+(?:\.\d+)?)\s*(?:km|kms)/i,
      /(\d+(?:\.\d+)?)\s*(?:km|kms).*?(?:auto|rickshaw)/i,
    ],
    category: "transportation",
    subcategory: "auto-rickshaw",
    unit: "km",
    nameTemplate: "Auto-rickshaw ride ({q} km)",
  },

  // ── Electricity ──
  {
    patterns: [
      /(?:ac|air\s*condition|air\s*conditioning).*?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
    ],
    category: "electricity",
    subcategory: "grid-power",
    unit: "kWh",
    nameTemplate: "AC usage ({q} hours → {kWh} kWh)",
  },
  {
    patterns: [
      /(?:electricity|power|kwh|units?\s*of\s*power).*?(\d+(?:\.\d+)?)\s*(?:kwh|units?)/i,
      /(\d+(?:\.\d+)?)\s*(?:kwh|units?).*?(?:electricity|power|consumed)/i,
    ],
    category: "electricity",
    subcategory: "grid-power",
    unit: "kWh",
    nameTemplate: "Electricity consumption ({q} kWh)",
  },

  // ── Food ──
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:plate|plates|serving|servings)?\s*(?:of\s*)?(?:chicken\s*biryani|biryani\s*chicken)/i,
      /(?:chicken\s*biryani|biryani).*?(\d+(?:\.\d+)?)\s*(?:plate|plates|serving)/i,
      /(?:ate|eat|had)\s*(?:a\s*)?(?:(\d+)\s*)?(?:plate|plates|serving|servings)?\s*(?:of\s*)?(?:chicken\s*)?biryani/i,
    ],
    category: "food",
    subcategory: "biryani-chicken",
    unit: "plate",
    defaultQuantity: 1,
    nameTemplate: "Chicken biryani ({q} plate)",
  },
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:plate|plates|serving)?\s*(?:of\s*)?(?:mutton|lamb)\s*biryani/i,
    ],
    category: "food",
    subcategory: "biryani-mutton",
    unit: "plate",
    defaultQuantity: 1,
    nameTemplate: "Mutton biryani ({q} plate)",
  },
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:plate|plates|serving)?\s*(?:of\s*)?veg\s*biryani/i,
    ],
    category: "food",
    subcategory: "biryani-veg",
    unit: "plate",
    defaultQuantity: 1,
    nameTemplate: "Veg biryani ({q} plate)",
  },
  {
    patterns: [
      /(?:ate|eat|had|consumed).*?(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram)?\s*(?:of\s*)?(?:beef|steak)/i,
      /(\d+(?:\.\d+)?)\s*(?:kg|kgs)?\s*(?:of\s*)?(?:beef|steak)/i,
    ],
    category: "food",
    subcategory: "beef-diet",
    unit: "kg",
    defaultQuantity: 0.3,
    nameTemplate: "Beef consumption ({q} kg)",
  },
  {
    patterns: [
      /(?:ate|eat|had|consumed).*?(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|piece|pieces)?\s*(?:of\s*)?chicken/i,
      /(\d+(?:\.\d+)?)\s*(?:kg|kgs|piece|pieces)?\s*(?:of\s*)?chicken/i,
    ],
    category: "food",
    subcategory: "chicken-diet",
    unit: "kg",
    defaultQuantity: 0.25,
    nameTemplate: "Chicken consumption ({q} kg)",
  },
  {
    patterns: [
      /(?:vegan|plant\s*based)\s*(?:meal|food|lunch|dinner|breakfast)/i,
    ],
    category: "food",
    subcategory: "vegan-meal",
    unit: "meal",
    defaultQuantity: 1,
    nameTemplate: "Vegan meal ({q} meal)",
  },
  {
    patterns: [
      /(?:vegetarian|veg)\s*(?:meal|food|lunch|dinner|breakfast)/i,
    ],
    category: "food",
    subcategory: "vegetarian-meal",
    unit: "meal",
    defaultQuantity: 1,
    nameTemplate: "Vegetarian meal ({q} meal)",
  },

  // ── Fuel ──
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l)\s*(?:of\s*)?petrol/i,
      /petrol.*?(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l)/i,
    ],
    category: "fuel",
    subcategory: "petrol-fuel",
    unit: "litre",
    nameTemplate: "Petrol fuel ({q} litres)",
  },
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l)\s*(?:of\s*)?diesel/i,
      /diesel.*?(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l)/i,
    ],
    category: "fuel",
    subcategory: "diesel-fuel",
    unit: "litre",
    nameTemplate: "Diesel fuel ({q} litres)",
  },
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:litres?|liters?|l|kg)\s*(?:of\s*)?(?:lpg|gas\s*cylinder)/i,
    ],
    category: "fuel",
    subcategory: "lpg-fuel",
    unit: "litre",
    nameTemplate: "LPG fuel ({q} litres)",
  },

  // ── Plastic / Waste ──
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:plastic\s*)?(?:bottle|bottles)/i,
    ],
    category: "plastic",
    subcategory: "single-use-bottle",
    unit: "item",
    defaultQuantity: 1,
    nameTemplate: "Plastic bottles ({q} items)",
  },
  {
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:plastic\s*)?(?:bag|bags)/i,
    ],
    category: "plastic",
    subcategory: "plastic-bag",
    unit: "item",
    defaultQuantity: 1,
    nameTemplate: "Plastic bags ({q} items)",
  },

  // ── Delivery ──
  {
    patterns: [
      /(?:ordered|order|delivery|delivered|package|parcel).*?(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:order|delivery|package|parcel)/i,
    ],
    category: "delivery",
    subcategory: "delivery-package",
    unit: "order",
    defaultQuantity: 1,
    nameTemplate: "Delivery order ({q} orders)",
  },
];

/**
 * Parse natural language into structured activity data.
 */
export function parseActivity(input: string): ParsedActivity | null {
  const trimmed = input.trim().toLowerCase();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let quantity = parseFloat(match[1]) || rule.defaultQuantity || 1;

        // Special handling: AC hours → kWh (avg AC = 1.5 kW)
        if (rule.subcategory === "grid-power" && rule.nameTemplate.includes("AC")) {
          const hours = quantity;
          quantity = Math.round(hours * 1.5 * 10) / 10; // 1.5 kW avg
        }

        const name = rule.nameTemplate
          .replace("{q}", String(quantity))
          .replace("{kWh}", String(Math.round(quantity * 10) / 10));

        return {
          name,
          category: rule.category,
          subcategory: rule.subcategory,
          quantity,
          unit: rule.unit,
          confidence: 0.85,
        };
      }
    }
  }

  return null;
}
