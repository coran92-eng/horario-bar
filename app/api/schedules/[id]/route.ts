import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      shifts: {
        include: { employee: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!schedule) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.schedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
