import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const schedules = await prisma.schedule.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { shifts: true } } },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { year, month } = body;

  if (!year || !month) {
    return NextResponse.json({ error: "Faltan year/month" }, { status: 400 });
  }

  const existing = await prisma.schedule.findUnique({
    where: { year_month: { year: Number(year), month: Number(month) } },
  });

  if (existing) {
    return NextResponse.json({ error: "Ya existe un horario para ese mes" }, { status: 409 });
  }

  const schedule = await prisma.schedule.create({
    data: { year: Number(year), month: Number(month) },
  });

  return NextResponse.json(schedule, { status: 201 });
}
