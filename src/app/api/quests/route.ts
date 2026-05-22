import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { QUEST_TEMPLATES } from "@/lib/carbonEngine";

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

    // ── Fetch existing quests ──
    let quests = await prisma.userQuest.findMany({
      where: { userId: payload.userId },
      orderBy: { assignedAt: "desc" },
    });

    // ── Auto-assign quests from templates if user has none ──
    if (quests.length === 0) {
      const questData = QUEST_TEMPLATES.map((qt) => ({
        userId: payload.userId,
        questId: qt.questId,
        title: qt.title,
        description: qt.description,
        xpReward: qt.xpReward,
        co2Reduction: qt.co2Reduction,
      }));

      await prisma.userQuest.createMany({ data: questData });

      quests = await prisma.userQuest.findMany({
        where: { userId: payload.userId },
        orderBy: { assignedAt: "desc" },
      });
    }

    const completedCount = quests.filter((q) => q.completed).length;
    const totalCo2Saved = quests
      .filter((q) => q.completed)
      .reduce((sum, q) => sum + q.co2Reduction, 0);

    return NextResponse.json({
      quests,
      summary: {
        total: quests.length,
        completed: completedCount,
        pending: quests.length - completedCount,
        totalCo2Saved: Math.round(totalCo2Saved * 1000) / 1000,
      },
    });
  } catch (error) {
    console.error("Quests GET error:", error);
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
    const { questId } = body;

    if (!questId) {
      return NextResponse.json(
        { error: "questId is required" },
        { status: 400 }
      );
    }

    // ── Find the quest ──
    const quest = await prisma.userQuest.findFirst({
      where: {
        userId: payload.userId,
        OR: [
          { id: questId },
          { questId }
        ]
      },
    });

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    if (quest.completed) {
      return NextResponse.json(
        { error: "Quest already completed" },
        { status: 400 }
      );
    }

    // ── Mark quest completed ──
    await prisma.userQuest.update({
      where: { id: quest.id },
      data: { completed: true },
    });

    // ── Update user XP and CO₂ ──
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 1. Create a negative offset activity to reduce today's emissions
    await prisma.activity.create({
      data: {
        userId: user.id,
        name: `Quest: ${quest.title}`,
        category: "offset",
        quantity: 1,
        unit: "quest",
        co2Emission: -quest.co2Reduction,
        formulaUsed: `Quest reward: -${quest.co2Reduction} kg CO₂`,
        sourceDetails: "CarbonTracker AI Quests",
      },
    });

    // 2. Fetch today's activities to recalculate sustainability score
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActivities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart },
      },
    });

    const todayCo2 = todayActivities.reduce((sum, a) => sum + a.co2Emission, 0);
    const ratio = Math.max(0, todayCo2) / user.baselineCo2;
    const newScore = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));

    const newXp = user.xp + quest.xpReward;
    const newLevel = Math.floor(newXp / 500) + 1; // Level up every 500 XP
    const newFootprint = Math.max(
      0,
      user.totalCarbonFootprint - quest.co2Reduction
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: newLevel,
        totalCarbonFootprint: newFootprint,
        sustainabilityScore: newScore,
      },
    });

    return NextResponse.json({
      message: "Quest completed! 🎉",
      quest: {
        questId: quest.questId,
        title: quest.title,
        xpReward: quest.xpReward,
        co2Reduction: quest.co2Reduction,
      },
      userUpdate: {
        xp: newXp,
        level: newLevel,
        totalCarbonFootprint: Math.round(newFootprint * 1000) / 1000,
        sustainabilityScore: newScore,
      },
    });
  } catch (error) {
    console.error("Quests POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
