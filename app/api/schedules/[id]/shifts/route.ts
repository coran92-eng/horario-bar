import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { date, startTime, endTime, environment, employeeId, isExtra, hasBreak, notes } = body;

  const shift = await prisma.shift.create({
    data: {
      scheduleId: id,
      date,
      startTime,
      endTime,
      environment,
      employeeId: employeeId ?? null,
      isExtra: isExtra ?? !employeeId,
      hasBreak: hasBreak ?? false,
      notes,
    },
    include: { employee: true },
  });

  return NextResponse.json(shift, { status: 201 });
}
