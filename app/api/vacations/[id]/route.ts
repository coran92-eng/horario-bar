import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const vacation = await prisma.vacation.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.startDate !== undefined && { startDate: body.startDate }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { employee: true },
  });

  return NextResponse.json(vacation);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
