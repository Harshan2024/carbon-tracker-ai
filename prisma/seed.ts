import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clear existing database
  await prisma.activity.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.userQuest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.emissionFactor.deleteMany({});

  console.log("Database cleared.");

  // 2. Seed Verified Carbon Emission Factors
  const factors = [
    // Transportation
    { id: "transport-car-petrol", category: "transportation", subcategory: "petrol-car", factor: 0.170, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "transport-car-diesel", category: "transportation", subcategory: "diesel-car", factor: 0.165, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "transport-car-electric", category: "transportation", subcategory: "electric-car", factor: 0.050, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "transport-bus", category: "transportation", subcategory: "bus-travel", factor: 0.080, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "transport-train", category: "transportation", subcategory: "train-travel", factor: 0.035, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "transport-flight-short", category: "transportation", subcategory: "flight-short-haul", factor: 0.150, unit: "km", region: "GLOBAL", sourceOrg: "IPCC 2006 / DESNZ", sourceUrl: "https://www.ipcc.ch" },
    { id: "transport-flight-long", category: "transportation", subcategory: "flight-long-haul", factor: 0.190, unit: "km", region: "GLOBAL", sourceOrg: "IPCC 2006 / DESNZ", sourceUrl: "https://www.ipcc.ch" },
    { id: "transport-bike", category: "transportation", subcategory: "bike-travel", factor: 0.000, unit: "km", region: "GLOBAL", sourceOrg: "Zero Emission", sourceUrl: "https://www.ipcc.ch" },
    { id: "transport-motorcycle", category: "transportation", subcategory: "motorcycle", factor: 0.100, unit: "km", region: "GLOBAL", sourceOrg: "UK Govt DESNZ 2024", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    
    // Electricity
    { id: "electricity-in", category: "electricity", subcategory: "grid-power", factor: 0.710, unit: "kWh", region: "IN", sourceOrg: "India CEA / IEA 2025", sourceUrl: "https://www.iea.org" },
    { id: "electricity-us", category: "electricity", subcategory: "grid-power", factor: 0.370, unit: "kWh", region: "US", sourceOrg: "US EPA eGRID 2025", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" },
    { id: "electricity-uk", category: "electricity", subcategory: "grid-power", factor: 0.210, unit: "kWh", region: "UK", sourceOrg: "UK Govt DESNZ 2025", sourceUrl: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting" },
    { id: "electricity-global", category: "electricity", subcategory: "grid-power", factor: 0.440, unit: "kWh", region: "GLOBAL", sourceOrg: "IEA Global Average 2025", sourceUrl: "https://www.iea.org" },
    
    // Fuels
    { id: "fuel-petrol", category: "fuel", subcategory: "petrol-fuel", factor: 2.310, unit: "litre", region: "GLOBAL", sourceOrg: "US EPA 2025", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" },
    { id: "fuel-diesel", category: "fuel", subcategory: "diesel-fuel", factor: 2.680, unit: "litre", region: "GLOBAL", sourceOrg: "US EPA 2025", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" },
    { id: "fuel-lpg", category: "fuel", subcategory: "lpg-fuel", factor: 1.510, unit: "litre", region: "GLOBAL", sourceOrg: "US EPA 2025", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" },
    
    // Food
    { id: "food-beef", category: "food", subcategory: "beef-diet", factor: 27.000, unit: "kg", region: "GLOBAL", sourceOrg: "Our World in Data", sourceUrl: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" },
    { id: "food-chicken", category: "food", subcategory: "chicken-diet", factor: 6.900, unit: "kg", region: "GLOBAL", sourceOrg: "Our World in Data", sourceUrl: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" },
    { id: "food-vegetarian", category: "food", subcategory: "vegetarian-meal", factor: 0.800, unit: "meal", region: "GLOBAL", sourceOrg: "Our World in Data", sourceUrl: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" },
    { id: "food-vegan", category: "food", subcategory: "vegan-meal", factor: 0.400, unit: "meal", region: "GLOBAL", sourceOrg: "Our World in Data", sourceUrl: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" },
    { id: "food-biryani-chicken", category: "food", subcategory: "biryani-chicken", factor: 1.800, unit: "plate", region: "GLOBAL", sourceOrg: "Composite (chicken+rice+spices)", sourceUrl: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" },
    
    // Delivery & Plastic
    { id: "delivery-order", category: "delivery", subcategory: "delivery-package", factor: 0.800, unit: "order", region: "GLOBAL", sourceOrg: "US EPA 2025", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" },
    { id: "plastic-bottle", category: "plastic", subcategory: "single-use-bottle", factor: 0.080, unit: "item", region: "GLOBAL", sourceOrg: "IPCC 2006", sourceUrl: "https://www.ipcc.ch" },
    { id: "plastic-bag", category: "plastic", subcategory: "plastic-bag", factor: 0.040, unit: "item", region: "GLOBAL", sourceOrg: "IPCC 2006", sourceUrl: "https://www.ipcc.ch" },
    { id: "plastic-mixed", category: "plastic", subcategory: "mixed-plastic", factor: 1.800, unit: "kg", region: "GLOBAL", sourceOrg: "IPCC 2006", sourceUrl: "https://www.ipcc.ch" },
  ];

  for (const factor of factors) {
    await prisma.emissionFactor.create({ data: { ...factor, lastUpdated: new Date() } });
  }
  console.log(`Seeded ${factors.length} verified emission factors.`);

  // 3. Seed Users
  const salt = await bcrypt.genSalt(10);

  const adminUser = await prisma.user.create({
    data: {
      username: "admin", fullName: "Super Administrator", email: "admin@carbontracker.ai",
      passwordHash: await bcrypt.hash("admin123", salt), role: "ADMIN", defaultRegion: "GLOBAL",
      age: 35, gender: "Male", place: "San Francisco", job: "Sustainability Director",
      profileCompleted: true, baselineCo2: 15.0, xp: 1500, level: 4, sustainabilityScore: 85,
    },
  });

  const userSara = await prisma.user.create({
    data: {
      username: "sara_eco", fullName: "Sara Jenkins", email: "sara@greenmail.org",
      passwordHash: await bcrypt.hash("sara123", salt), role: "USER", defaultRegion: "UK",
      age: 28, gender: "Female", place: "London", job: "Environmental Researcher",
      profileCompleted: true, baselineCo2: 3.2, xp: 2400, level: 5, sustainabilityScore: 98, streakCount: 7,
    },
  });

  const userJohn = await prisma.user.create({
    data: {
      username: "john_driver", fullName: "John Doe", email: "john@corporate.com",
      passwordHash: await bcrypt.hash("john123", salt), role: "USER", defaultRegion: "US",
      age: 42, gender: "Male", place: "New York", job: "Corporate Consultant",
      profileCompleted: true, baselineCo2: 28.5, xp: 320, level: 1, sustainabilityScore: 42, streakCount: 1,
    },
  });

  const userPriya = await prisma.user.create({
    data: {
      username: "priya_nature", fullName: "Priya Sharma", email: "priya@techcorp.in",
      passwordHash: await bcrypt.hash("priya123", salt), role: "USER", defaultRegion: "IN",
      age: 24, gender: "Female", place: "Mumbai", job: "Software Engineer",
      profileCompleted: true, baselineCo2: 6.8, xp: 850, level: 2, sustainabilityScore: 78, streakCount: 3,
    },
  });
  console.log("Users seeded.");

  // 4. Seed 7-day activity history
  const now = new Date();
  const users = [
    { id: userSara.id, region: "UK", baseCar: 0, baseElec: 4, baseBeef: 0, baseVegan: 2 },
    { id: userJohn.id, region: "US", baseCar: 45, baseElec: 35, baseBeef: 0.8, baseVegan: 0 },
    { id: userPriya.id, region: "IN", baseCar: 10, baseElec: 8, baseBeef: 0, baseVegan: 0.5 },
  ];

  for (const u of users) {
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const activityDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      if (u.baseCar > 0) {
        const f = 0.170; const d = u.baseCar + (Math.random() * 10 - 5);
        await prisma.activity.create({ data: { userId: u.id, name: `Car commute (${d.toFixed(1)} km)`, category: "transportation", quantity: d, unit: "km", co2Emission: d * f, formulaUsed: `${d.toFixed(1)} km × 0.170 kg/km`, sourceDetails: "DESNZ 2024", timestamp: activityDate } });
      }
      const elecF = u.region === "UK" ? 0.210 : u.region === "US" ? 0.370 : 0.710;
      const kwh = u.baseElec + (Math.random() * 4 - 2);
      await prisma.activity.create({ data: { userId: u.id, name: `Power consumption (${kwh.toFixed(1)} kWh)`, category: "electricity", quantity: kwh, unit: "kWh", co2Emission: kwh * elecF, formulaUsed: `${kwh.toFixed(1)} kWh × ${elecF} kg/kWh`, sourceDetails: u.region === "US" ? "EPA eGRID" : u.region === "UK" ? "DESNZ 2025" : "IEA 2025", timestamp: activityDate } });
      if (u.baseBeef > 0) {
        const w = u.baseBeef + (Math.random() * 0.2 - 0.1);
        await prisma.activity.create({ data: { userId: u.id, name: `Beef meal (${w.toFixed(2)} kg)`, category: "food", quantity: w, unit: "kg", co2Emission: w * 27.0, formulaUsed: `${w.toFixed(2)} kg × 27.0 kg/kg`, sourceDetails: "Our World in Data", timestamp: activityDate } });
      } else if (u.baseVegan > 0) {
        await prisma.activity.create({ data: { userId: u.id, name: `Vegan meals (${u.baseVegan})`, category: "food", quantity: u.baseVegan, unit: "meal", co2Emission: u.baseVegan * 0.4, formulaUsed: `${u.baseVegan} meal × 0.4 kg/meal`, sourceDetails: "Our World in Data", timestamp: activityDate } });
      }
    }
  }

  // 5. Seed Achievements
  await prisma.achievement.createMany({
    data: [
      { userId: userSara.id, badgeId: "eco-novice", name: "Eco Novice", description: "Log your first activity" },
      { userId: userSara.id, badgeId: "streak-7", name: "Eco Guardian", description: "7-day sustainability streak" },
      { userId: userPriya.id, badgeId: "eco-novice", name: "Eco Novice", description: "Log your first activity" },
    ],
  });

  // 6. Seed Quests for John (high emitter)
  await prisma.userQuest.createMany({
    data: [
      { userId: userJohn.id, questId: "velocity-shift", title: "🚲 The Velocity Shift", description: "Swap 15 km of driving for train travel or cycling.", xpReward: 200, co2Reduction: 2.5 },
      { userId: userJohn.id, questId: "phantom-load", title: "🔌 Phantom Load Hunt", description: "Turn off AC for 3 hours and unplug idle chargers.", xpReward: 120, co2Reduction: 1.8 },
      { userId: userJohn.id, questId: "green-feast", title: "🥗 The Green Feast", description: "Replace beef with a vegan meal today.", xpReward: 150, co2Reduction: 8.0, completed: true },
    ],
  });

  console.log("Database seeded successfully! ✅");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
