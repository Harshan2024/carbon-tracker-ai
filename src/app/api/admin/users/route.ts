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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        sustainabilityScore: true,
        totalCarbonFootprint: true,
        streakCount: true,
        level: true,
        xp: true,
        defaultRegion: true,
        fullName: true,
        age: true,
        gender: true,
        place: true,
        job: true,
        profileCompleted: true,
        baselineCo2: true,
        lastActivityDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            activities: true,
            achievements: true,
            userQuests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      totalCount: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
