import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log("Login payload:", { username, passwordLength: password?.length });

    // ── Validation ──
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const searchVal = username.trim();

    // ── Find user by username OR email (case-insensitive) ──
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: searchVal, mode: "insensitive" as const } },
          { email: { equals: searchVal, mode: "insensitive" as const } },
        ],
      },
    });

    console.log("User lookup result:", user ? { id: user.id, username: user.username, email: user.email } : "User not found");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // ── Verify password ──
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password comparison result:", isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // ── Issue JWT cookie ──
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        defaultRegion: user.defaultRegion,
        level: user.level,
        xp: user.xp,
        sustainabilityScore: user.sustainabilityScore,
        totalCarbonFootprint: user.totalCarbonFootprint,
        streakCount: user.streakCount,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
