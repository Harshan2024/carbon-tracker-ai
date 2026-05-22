import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(tokenCookie.value);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // ── Admin check ──
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // ── Total users ──
    const totalUsers = await prisma.user.count();

    // ── Total emissions ──
    const allActivities = await prisma.activity.findMany({
      select: { co2Emission: true, category: true, timestamp: true },
    });

    const totalEmissions =
      Math.round(
        allActivities.reduce((sum, a) => sum + a.co2Emission, 0) * 1000
      ) / 1000;

    // ── Category breakdown ──
    const categoryMap = new Map<string, { totalCo2: number; count: number }>();
    for (const a of allActivities) {
      const existing = categoryMap.get(a.category) || {
        totalCo2: 0,
        count: 0,
      };
      existing.totalCo2 += a.co2Emission;
      existing.count += 1;
      categoryMap.set(a.category, existing);
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        totalCo2: Math.round(data.totalCo2 * 1000) / 1000,
        activityCount: data.count,
        percentage:
          totalEmissions > 0
            ? Math.round((data.totalCo2 / totalEmissions) * 10000) / 100
            : 0,
      })
    );

    categoryBreakdown.sort((a, b) => b.totalCo2 - a.totalCo2);

    // ── Recent activity (last 24h) ──
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = allActivities.filter(
      (a) => a.timestamp >= oneDayAgo
    ).length;

    // ── Average sustainability score ──
    const users = await prisma.user.findMany({
      select: { sustainabilityScore: true },
    });
    const avgScore =
      users.length > 0
        ? Math.round(
            (users.reduce((sum, u) => sum + u.sustainabilityScore, 0) /
              users.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalEmissions,
        recentActivityCount,
        avgSustainabilityScore: avgScore,
        totalActivities: allActivities.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
