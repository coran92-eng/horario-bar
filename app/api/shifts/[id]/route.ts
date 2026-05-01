import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      ...(body.startTime !== undefined && { startTime: body.startTime }),
      ...(body.endTime !== undefined && { endTime: body.endTime }),
      ...(body.employeeId !== undefined && { employeeId: body.employeeId }),
      ...(body.environment !== undefined && { environment: body.environment }),
      ...(body.isExtra !== undefined && { isExtra: body.isExtra }),
      ...(body.hasBreak !== undefined && { hasBreak: body.hasBreak }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { employee: true },
  });

  return NextResponse.json(shift);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
