import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [barDayConfigs, staffingRules] = await Promise.all([
    prisma.barDayConfig.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.staffingRule.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
  ]);
  return NextResponse.json({ barDayConfigs, staffingRules });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { barDayConfigs, staffingRules } = body;

  if (barDayConfigs) {
    for (const cfg of barDayConfigs) {
      await prisma.barDayConfig.upsert({
        where: { id: cfg.id ?? "" },
        update: { openTime: cfg.openTime, closeTime: cfg.closeTime, isOpen: cfg.isOpen },
        create: { dayOfWeek: cfg.dayOfWeek, openTime: cfg.openTime, closeTime: cfg.closeTime, isOpen: cfg.isOpen },
      });
    }
  }

  if (staffingRules) {
    // Replace all staffing rules
    await prisma.staffingRule.deleteMany();
    await prisma.staffingRule.createMany({ data: staffingRules });
  }

  return NextResponse.json({ ok: true });
}
