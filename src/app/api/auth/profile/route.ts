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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
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
    const { fullName, age, gender, place, job, xp, level } = body;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        fullName: fullName ?? undefined,
        age: age !== undefined ? Number(age) : undefined,
        gender: gender ?? undefined,
        place: place ?? undefined,
        job: job ?? undefined,
        profileCompleted: true,
        xp: xp !== undefined ? { increment: Number(xp) } : undefined,
        level: level !== undefined ? Number(level) : undefined,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        age: true,
        gender: true,
        place: true,
        job: true,
        profileCompleted: true,
        xp: true,
        level: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
