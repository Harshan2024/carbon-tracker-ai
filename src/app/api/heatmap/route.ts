import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // ── Fetch all users who have a place set and their activities ──
    const usersWithPlace = await prisma.user.findMany({
      where: {
        place: { not: null },
      },
      select: {
        id: true,
        place: true,
        activities: {
          select: {
            co2Emission: true,
            timestamp: true,
          },
        },
      },
    });

    // ── Aggregate by city ──
    const cityMap = new Map<
      string,
      { totalCo2: number; userIds: Set<string>; activityCount: number; earliestDate: Date | null }
    >();

    for (const user of usersWithPlace) {
      const city = user.place!;
      if (!cityMap.has(city)) {
        cityMap.set(city, {
          totalCo2: 0,
          userIds: new Set(),
          activityCount: 0,
          earliestDate: null,
        });
      }

      const cityData = cityMap.get(city)!;
      cityData.userIds.add(user.id);

      for (const activity of user.activities) {
        cityData.totalCo2 += activity.co2Emission;
        cityData.activityCount += 1;

        if (
          !cityData.earliestDate ||
          activity.timestamp < cityData.earliestDate
        ) {
          cityData.earliestDate = activity.timestamp;
        }
      }
    }

    // ── Filter to cities with 2+ users and compute averages ──
    const heatmapData = [];

    for (const [city, data] of cityMap.entries()) {
      if (data.userIds.size < 2) continue;

      // Calculate days span for daily average
      let daySpan = 1;
      if (data.earliestDate) {
        const diffMs = Date.now() - data.earliestDate.getTime();
        daySpan = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      const avgDailyCo2 =
        Math.round((data.totalCo2 / data.userIds.size / daySpan) * 1000) / 1000;

      heatmapData.push({
        city,
        totalCo2: Math.round(data.totalCo2 * 1000) / 1000,
        userCount: data.userIds.size,
        avgDailyCo2,
        activityCount: data.activityCount,
      });
    }

    // ── Sort by totalCo2 descending ──
    heatmapData.sort((a, b) => b.totalCo2 - a.totalCo2);

    return NextResponse.json({ heatmap: heatmapData });
  } catch (error) {
    console.error("Heatmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
