import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHolidaysForYear } from "@/lib/holidays";

export async function POST() {
  // Seed default bar day config (Mon-Sun)
  const existing = await prisma.barDayConfig.count();
  if (existing === 0) {
    const closeTimes: Record<number, string> = {
      0: "22:00", // Dom
      1: "23:00", // Lun
      2: "23:00", // Mar
      3: "23:00", // Mié
      4: "00:00", // Jue (midnight)
      5: "01:00", // Vie
      6: "01:00", // Sáb
    };

    for (let dow = 0; dow <= 6; dow++) {
      await prisma.barDayConfig.create({
        data: { dayOfWeek: dow, openTime: "08:00", closeTime: closeTimes[dow], isOpen: true },
      });
    }
  }

  // Seed default staffing rules
  const existingRules = await prisma.staffingRule.count();
  if (existingRules === 0) {
    await prisma.staffingRule.createMany({
      data: [
        { dayOfWeek: -1, startTime: "08:00", endTime: "10:00", salaCount: 1, cocinaCount: 0 },
        { dayOfWeek: -1, startTime: "10:00", endTime: "16:00", salaCount: 2, cocinaCount: 1 },
        { dayOfWeek: -1, startTime: "16:00", endTime: "23:00", salaCount: 2, cocinaCount: 1 },
        // Fri & Sat need more staff
        { dayOfWeek: 5, startTime: "20:00", endTime: "01:00", salaCount: 3, cocinaCount: 2 },
        { dayOfWeek: 6, startTime: "20:00", endTime: "01:00", salaCount: 3, cocinaCount: 2 },
      ],
    });
  }

  // Seed holidays for 2025 and 2026
  const existingHolidays = await prisma.holiday.count();
  if (existingHolidays === 0) {
    const holidays2025 = getHolidaysForYear(2025);
    const holidays2026 = getHolidaysForYear(2026);
    await prisma.holiday.createMany({
      data: [...holidays2025, ...holidays2026],
    });
  }

  return NextResponse.json({ ok: true, message: "Seed completado" });
}
