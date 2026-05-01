import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  const vacations = await prisma.vacation.findMany({
    where: {
      ...(employeeId && { employeeId }),
      ...(status && { status }),
    },
    include: { employee: true },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(vacations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, startDate, endDate, notes } = body;

  if (!employeeId || !startDate || !endDate) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const vacation = await prisma.vacation.create({
    data: { employeeId, startDate, endDate, notes },
    include: { employee: true },
  });

  return NextResponse.json(vacation, { status: 201 });
}
