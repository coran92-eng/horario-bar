import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSchedule } from "@/lib/scheduler";
import { getHolidaysForYear } from "@/lib/holidays";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [employees, barDayConfigs, staffingRules, requests, vacations] = await Promise.all([
    prisma.employee.findMany({ where: { active: true } }),
    prisma.barDayConfig.findMany(),
    prisma.staffingRule.findMany(),
    prisma.request.findMany({ where: { year: schedule.year, month: schedule.month } }),
    prisma.vacation.findMany({ where: { status: "APPROVED" } }),
  ]);

  const holidays = getHolidaysForYear(schedule.year);

  const proposals = generateSchedule({
    year: schedule.year,
    month: schedule.month,
    employees,
    barDayConfigs,
    staffingRules,
    requests,
    vacations,
    holidays,
  });

  // Clear existing shifts and insert proposals
  await prisma.shift.deleteMany({ where: { scheduleId: id } });

  await prisma.shift.createMany({
    data: proposals.map((p) => ({
      scheduleId: id,
      employeeId: p.employeeId,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      environment: p.environment,
      hasBreak: p.hasBreak,
      isExtra: p.isExtra,
    })),
  });

  const updated = await prisma.schedule.findUnique({
    where: { id },
    include: {
      shifts: {
        include: { employee: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return NextResponse.json(updated);
}
