import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { parseActivity } from "@/lib/nlpParser";
import { calculateEmission } from "@/lib/carbonEngine";

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
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    // ── Parse natural language ──
    const parsed = parseActivity(text);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not understand the activity. Try something like: 'drove 10 km in a car' or 'ate 1 plate of chicken biryani'",
          suggestions: [
            "drove 10 km in a petrol car",
            "used AC for 3 hours",
            "ate 1 plate of chicken biryani",
            "took the bus for 15 km",
            "used 5 kWh of electricity",
          ],
        },
        { status: 200 }
      );
    }

    // ── Also compute emission preview ──
    const emission = calculateEmission(
      parsed.category,
      parsed.subcategory,
      parsed.quantity,
      "GLOBAL"
    );

    return NextResponse.json({
      success: true,
      parsed,
      emissionPreview: {
        co2: emission.co2,
        formula: emission.formula,
        source: emission.source,
      },
    });
  } catch (error) {
    console.error("AI parse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
