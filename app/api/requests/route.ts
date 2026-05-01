import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const employeeId = searchParams.get("employeeId");

  const requests = await prisma.request.findMany({
    where: {
      ...(year && { year: Number(year) }),
      ...(month && { month: Number(month) }),
      ...(employeeId && { employeeId }),
    },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, year, month, type, details } = body;

  if (!employeeId || !year || !month || !type || !details) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const request = await prisma.request.create({
    data: { employeeId, year: Number(year), month: Number(month), type, details },
    include: { employee: true },
  });

  return NextResponse.json(request, { status: 201 });
}
