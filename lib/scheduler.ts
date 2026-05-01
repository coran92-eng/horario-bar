import type { Employee, BarDayConfig, StaffingRule, Request, Vacation } from "@prisma/client";
import {
  timeToMinutes,
  shiftDurationHours,
  hoursBetweenShifts,
  getDaysInMonth,
  formatDate,
  getDayOfWeek,
} from "./time";
import { isHoliday, type HolidayEntry } from "./holidays";

export type ShiftProposal = {
  date: string;
  startTime: string;
  endTime: string;
  environment: "SALA" | "COCINA";
  employeeId: string | null; // null = slot para extra
  isExtra: boolean;
  hasBreak: boolean;
};

type EmployeeWithMeta = Employee & {
  assignedHours: number; // hours assigned so far this month
  lastShiftDate: string | null;
  lastShiftEndTime: string | null;
  daysOff: Set<string>; // ISO date strings when this employee cannot work
  consecutiveDaysOff: string[][]; // pairs of consecutive days off already assigned
};

export function generateSchedule(params: {
  year: number;
  month: number;
  employees: Employee[];
  barDayConfigs: BarDayConfig[];
  staffingRules: StaffingRule[];
  requests: Request[];
  vacations: Vacation[];
  holidays: HolidayEntry[];
}): ShiftProposal[] {
  const { year, month, employees, barDayConfigs, staffingRules, requests, vacations, holidays } = params;

  const daysInMonth = getDaysInMonth(year, month);
  const shifts: ShiftProposal[] = [];

  // Build employee meta
  const empMeta: Map<string, EmployeeWithMeta> = new Map(
    employees
      .filter((e) => e.active)
      .map((e) => [
        e.id,
        {
          ...e,
          assignedHours: 0,
          lastShiftDate: null,
          lastShiftEndTime: null,
          daysOff: new Set<string>(),
          consecutiveDaysOff: [],
        },
      ])
  );

  // Mark vacation days as unavailable
  for (const v of vacations) {
    if (v.status !== "APPROVED") continue;
    const meta = empMeta.get(v.employeeId);
    if (!meta) continue;
    const start = new Date(v.startDate + "T12:00:00");
    const end = new Date(v.endDate + "T12:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      meta.daysOff.add(d.toISOString().slice(0, 10));
    }
  }

  // Parse day-off requests (approved or pending)
  const dayOffRequests: Map<string, string[]> = new Map(); // employeeId -> list of requested date strings
  for (const r of requests) {
    if (r.type !== "DAY_OFF" || r.year !== year || r.month !== month) continue;
    if (r.status === "REJECTED") continue;
    if (!dayOffRequests.has(r.employeeId)) dayOffRequests.set(r.employeeId, []);
    // details should be a date string or comma-separated dates
    const dates = r.details.split(",").map((s) => s.trim());
    dayOffRequests.get(r.employeeId)!.push(...dates);
  }

  // Build bar day config map (dayOfWeek -> config)
  const barConfigMap: Map<number, BarDayConfig> = new Map(
    barDayConfigs.map((c) => [c.dayOfWeek, c])
  );

  // Build staffing rules grouped by dayOfWeek
  const staffingByDay: Map<number, StaffingRule[]> = new Map();
  for (const rule of staffingRules) {
    const key = rule.dayOfWeek; // -1 means all days
    if (!staffingByDay.has(key)) staffingByDay.set(key, []);
    staffingByDay.get(key)!.push(rule);
  }

  // Weekly hours target: spread evenly across ~4.33 weeks
  const targetHoursPerWeek: Map<string, number> = new Map(
    employees.filter((e) => e.active).map((e) => [e.id, e.weeklyHours])
  );

  // Assign days off first (2 consecutive per week)
  assignDaysOff(empMeta, year, month, daysInMonth, dayOffRequests);

  // For each day, determine needed shifts and assign employees
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const dow = getDayOfWeek(dateStr);
    const holiday = isHoliday(dateStr, holidays);

    const barConfig = barConfigMap.get(dow);
    if (!barConfig || !barConfig.isOpen) continue;

    const openTime = barConfig.openTime;
    const closeTime = barConfig.closeTime;

    // Get staffing rules for this day
    const rules = [
      ...(staffingByDay.get(-1) ?? []),
      ...(staffingByDay.get(dow) ?? []),
    ];

    if (rules.length === 0) {
      // Default: 1 sala all day, cocina from 10:00
      rules.push(
        { id: "", dayOfWeek: dow, startTime: openTime, endTime: "10:00", salaCount: 1, cocinaCount: 0 },
        { id: "", dayOfWeek: dow, startTime: "10:00", endTime: closeTime, salaCount: 1, cocinaCount: 1 }
      );
    }

    // For each staffing slot, find the full day shift
    // Simplification: create one shift per employee per day covering full open hours
    // We determine how many sala and cocina we need and pick best candidates

    const salaNeeded = Math.max(...rules.map((r) => r.salaCount));
    const cocinaNeeded = Math.max(...rules.map((r) => r.cocinaCount));

    // Assign sala staff
    const salaAssigned = assignStaff({
      dateStr,
      environment: "SALA",
      needed: salaNeeded,
      startTime: openTime,
      endTime: closeTime,
      empMeta,
      targetHoursPerWeek,
      holiday,
    });
    shifts.push(...salaAssigned);

    // Assign cocina staff (starts at 10:00)
    const cocinaStart = rules.find((r) => r.cocinaCount > 0)?.startTime ?? "10:00";
    if (cocinaNeeded > 0) {
      const cocinaAssigned = assignStaff({
        dateStr,
        environment: "COCINA",
        needed: cocinaNeeded,
        startTime: cocinaStart,
        endTime: closeTime,
        empMeta,
        targetHoursPerWeek,
        holiday,
      });
      shifts.push(...cocinaAssigned);
    }
  }

  return shifts;
}

function assignDaysOff(
  empMeta: Map<string, EmployeeWithMeta>,
  year: number,
  month: number,
  daysInMonth: number,
  requests: Map<string, string[]>
) {
  const weeks = getWeeksInMonth(year, month, daysInMonth);

  for (const [empId, meta] of empMeta) {
    const requested = requests.get(empId) ?? [];

    for (const week of weeks) {
      // Check if employee already has 2 consecutive days off from vacations
      const vacDays = week.filter((d) => meta.daysOff.has(d));
      if (hasConsecutivePair(vacDays)) continue;

      // Try to honor requested days
      const reqInWeek = week.filter((d) => requested.includes(d));
      let assigned = false;

      if (reqInWeek.length >= 2) {
        // Find a consecutive pair among requested
        for (let i = 0; i < reqInWeek.length - 1; i++) {
          if (isConsecutive(reqInWeek[i], reqInWeek[i + 1])) {
            meta.daysOff.add(reqInWeek[i]);
            meta.daysOff.add(reqInWeek[i + 1]);
            assigned = true;
            break;
          }
        }
      }

      if (!assigned && reqInWeek.length === 1) {
        // Try to add an adjacent day
        const req = reqInWeek[0];
        const idx = week.indexOf(req);
        const prev = week[idx - 1];
        const next = week[idx + 1];
        if (next && !meta.daysOff.has(next)) {
          meta.daysOff.add(req);
          meta.daysOff.add(next);
          assigned = true;
        } else if (prev && !meta.daysOff.has(prev)) {
          meta.daysOff.add(prev);
          meta.daysOff.add(req);
          assigned = true;
        }
      }

      if (!assigned) {
        // Pick any 2 consecutive days in the week not already blocked
        for (let i = 0; i < week.length - 1; i++) {
          if (!meta.daysOff.has(week[i]) && !meta.daysOff.has(week[i + 1])) {
            meta.daysOff.add(week[i]);
            meta.daysOff.add(week[i + 1]);
            break;
          }
        }
      }
    }
  }
}

function assignStaff(params: {
  dateStr: string;
  environment: "SALA" | "COCINA";
  needed: number;
  startTime: string;
  endTime: string;
  empMeta: Map<string, EmployeeWithMeta>;
  targetHoursPerWeek: Map<string, number>;
  holiday: boolean;
}): ShiftProposal[] {
  const { dateStr, environment, needed, startTime, endTime, empMeta, targetHoursPerWeek } = params;
  const result: ShiftProposal[] = [];
  const shiftHours = shiftDurationHours(startTime, endTime);
  const hasBreak = shiftHours > 5;

  const eligible = Array.from(empMeta.values()).filter((e) => {
    if (e.daysOff.has(dateStr)) return false;
    if (e.role === "SALA" && environment === "COCINA") return false;
    if (e.role === "COCINA" && environment === "SALA") return false;

    // Check 12h rest
    if (e.lastShiftDate && e.lastShiftEndTime) {
      const hours = hoursBetweenShifts(e.lastShiftDate, e.lastShiftEndTime, dateStr, startTime);
      if (hours < 12) return false;
    }

    // Check if already assigned today
    if (e.lastShiftDate === dateStr) return false;

    return true;
  });

  // Sort by: least hours assigned relative to target (most under-utilized first)
  eligible.sort((a, b) => {
    const aTarget = targetHoursPerWeek.get(a.id) ?? 40;
    const bTarget = targetHoursPerWeek.get(b.id) ?? 40;
    const aRatio = a.assignedHours / (aTarget * 4.33);
    const bRatio = b.assignedHours / (bTarget * 4.33);
    return aRatio - bRatio;
  });

  const assigned = eligible.slice(0, needed);

  for (const emp of assigned) {
    emp.assignedHours += shiftHours + (hasBreak ? 1 / 3 : 0); // 20min break
    emp.lastShiftDate = dateStr;
    emp.lastShiftEndTime = endTime;

    result.push({
      date: dateStr,
      startTime,
      endTime,
      environment,
      employeeId: emp.id,
      isExtra: false,
      hasBreak,
    });
  }

  // Fill remaining with extra slots
  for (let i = assigned.length; i < needed; i++) {
    result.push({
      date: dateStr,
      startTime,
      endTime,
      environment,
      employeeId: null,
      isExtra: true,
      hasBreak,
    });
  }

  return result;
}

function getWeeksInMonth(year: number, month: number, daysInMonth: number): string[][] {
  const weeks: string[][] = [];
  let week: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const dow = getDayOfWeek(dateStr);
    week.push(dateStr);

    // End of week on Saturday (6) or last day of month
    if (dow === 6 || day === daysInMonth) {
      if (week.length >= 2) weeks.push(week);
      week = [];
    }
  }

  if (week.length >= 2) weeks.push(week);
  return weeks;
}

function hasConsecutivePair(dates: string[]): boolean {
  if (dates.length < 2) return false;
  const sorted = [...dates].sort();
  for (let i = 0; i < sorted.length - 1; i++) {
    if (isConsecutive(sorted[i], sorted[i + 1])) return true;
  }
  return false;
}

function isConsecutive(d1: string, d2: string): boolean {
  const date1 = new Date(d1 + "T12:00:00");
  const date2 = new Date(d2 + "T12:00:00");
  const diff = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}
