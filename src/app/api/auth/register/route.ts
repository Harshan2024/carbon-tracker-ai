import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, defaultRegion } = body;

    // ── Validation ──
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const checkUsername = username.trim();
    const checkEmail = email ? email.trim() : undefined;

    // ── Check for existing user (case-insensitive) ──
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: checkUsername, mode: "insensitive" as const } },
          ...(checkEmail ? [{ email: { equals: checkEmail, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // ── Hash password & create user ──
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        passwordHash,
        defaultRegion: defaultRegion || "GLOBAL",
      },
    });

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

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          defaultRegion: user.defaultRegion,
          level: user.level,
          xp: user.xp,
          sustainabilityScore: user.sustainabilityScore,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
