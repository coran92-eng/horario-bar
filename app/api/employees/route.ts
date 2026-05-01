import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, role, weeklyHours, color } = body;

  if (!name || !role || weeklyHours == null) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: { name, role, weeklyHours: Number(weeklyHours), color: color ?? "#6366f1" },
  });

  return NextResponse.json(employee, { status: 201 });
}
