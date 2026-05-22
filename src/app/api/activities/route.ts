export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { calculateEmission, getSafetyLevel, getPlanetCount } from "@/lib/carbonEngine";

export async function GET(request: NextRequest) {
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

    // ── Optional date filters ──
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { userId: payload.userId };

    if (from || to) {
      const timestampFilter: Record<string, Date> = {};
      if (from) timestampFilter.gte = new Date(from);
      if (to) timestampFilter.lte = new Date(to);
      where.timestamp = timestampFilter;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    // ── Compute today's total for safety level context ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActivities = await prisma.activity.findMany({
      where: {
        userId: payload.userId,
        timestamp: { gte: todayStart },
      },
    });

    const todayCo2 = todayActivities.reduce((sum, a) => sum + a.co2Emission, 0);
    const safetyLevel = getSafetyLevel(todayCo2);
    const planetCount = getPlanetCount(todayCo2);

    return NextResponse.json({
      activities,
      todaySummary: {
        totalCo2: Math.round(todayCo2 * 1000) / 1000,
        activityCount: todayActivities.length,
        safetyLevel,
        planetCount,
      },
    });
  } catch (error) {
    console.error("Activities GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, category, subcategory, quantity, unit } = body;

    if (!category || !subcategory || !quantity) {
      return NextResponse.json(
        { error: "category, subcategory, and quantity are required" },
        { status: 400 }
      );
    }

    // ── Fetch user region for electricity calculations ──
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ── Calculate emission ──
    const emission = calculateEmission(
      category,
      subcategory,
      Number(quantity),
      user.defaultRegion
    );

    // ── Record activity ──
    const activity = await prisma.activity.create({
      data: {
        userId: user.id,
        name: name || `${category} - ${subcategory}`,
        category,
        quantity: Number(quantity),
        unit: unit || emission.unit,
        co2Emission: emission.co2,
        formulaUsed: emission.formula,
        sourceDetails: emission.source,
      },
    });

    // ── Update user totals ──
    const newTotalFootprint = user.totalCarbonFootprint + emission.co2;

    // Sustainability score: starts at 100, decreases as daily CO2 increases
    // Recalculate based on today's emissions vs baseline
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActivities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart },
      },
    });

    const todayCo2 = todayActivities.reduce((sum, a) => sum + a.co2Emission, 0);
    const ratio = todayCo2 / user.baselineCo2;
    const newScore = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));

    // ── Update streak ──
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    let newStreak = user.streakCount;
    if (
      user.lastActivityDate &&
      user.lastActivityDate >= yesterday &&
      user.lastActivityDate < todayStart
    ) {
      newStreak += 1;
    } else if (!user.lastActivityDate || user.lastActivityDate < yesterday) {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalCarbonFootprint: newTotalFootprint,
        sustainabilityScore: newScore,
        streakCount: newStreak,
        lastActivityDate: new Date(),
      },
    });

    const safetyLevel = getSafetyLevel(todayCo2);
    const planetCount = getPlanetCount(todayCo2);

    return NextResponse.json(
      {
        message: "Activity recorded",
        activity,
        emission: {
          co2: emission.co2,
          formula: emission.formula,
          source: emission.source,
        },
        todaySummary: {
          totalCo2: Math.round(todayCo2 * 1000) / 1000,
          safetyLevel,
          planetCount,
        },
        userUpdate: {
          totalCarbonFootprint: Math.round(newTotalFootprint * 1000) / 1000,
          sustainabilityScore: newScore,
          streakCount: newStreak,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Activities POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
