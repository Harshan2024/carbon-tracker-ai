import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Number(searchParams.get("limit")) || 25,
      100
    );

    const topUsers = await prisma.user.findMany({
      orderBy: { sustainabilityScore: "desc" },
      take: limit,
      select: {
        username: true,
        sustainabilityScore: true,
        level: true,
        streakCount: true,
      },
    });

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      sustainabilityScore: user.sustainabilityScore,
      level: user.level,
      streakCount: user.streakCount,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
