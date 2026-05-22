import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const factors = await prisma.emissionFactor.findMany({
      orderBy: [{ category: "asc" }, { subcategory: "asc" }],
    });

    // ── Group by category for easier consumption ──
    const grouped = new Map<
      string,
      Array<{
        id: string;
        subcategory: string;
        factor: number;
        unit: string;
        region: string;
        sourceOrg: string;
        sourceUrl: string;
        lastUpdated: Date;
      }>
    >();

    for (const f of factors) {
      if (!grouped.has(f.category)) {
        grouped.set(f.category, []);
      }
      grouped.get(f.category)!.push({
        id: f.id,
        subcategory: f.subcategory,
        factor: f.factor,
        unit: f.unit,
        region: f.region,
        sourceOrg: f.sourceOrg,
        sourceUrl: f.sourceUrl,
        lastUpdated: f.lastUpdated,
      });
    }

    const categorized = Object.fromEntries(grouped);

    return NextResponse.json({
      totalCount: factors.length,
      factors,
      categorized,
    });
  } catch (error) {
    console.error("Factors GET error:", error);
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

    // ── Admin check for writes ──
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, category, subcategory, factor, unit, region, sourceOrg, sourceUrl } = body;

    if (!id || !category || !subcategory || factor === undefined || !unit || !region) {
      return NextResponse.json(
        {
          error:
            "id, category, subcategory, factor, unit, and region are required",
        },
        { status: 400 }
      );
    }

    // ── Upsert: create if not exists, update if exists ──
    const emissionFactor = await prisma.emissionFactor.upsert({
      where: { id },
      update: {
        category,
        subcategory,
        factor: Number(factor),
        unit,
        region,
        sourceOrg: sourceOrg || "",
        sourceUrl: sourceUrl || "",
        lastUpdated: new Date(),
      },
      create: {
        id,
        category,
        subcategory,
        factor: Number(factor),
        unit,
        region,
        sourceOrg: sourceOrg || "",
        sourceUrl: sourceUrl || "",
      },
    });

    return NextResponse.json(
      {
        message: "Emission factor saved",
        emissionFactor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Factors POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
