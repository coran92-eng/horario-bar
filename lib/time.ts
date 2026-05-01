// Utility functions for time manipulation

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function shiftDurationHours(startTime: string, endTime: string): number {
  return (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
}

// Returns number of hours between end of one shift and start of next
export function hoursBetweenShifts(
  prevDate: string,
  prevEndTime: string,
  nextDate: string,
  nextStartTime: string
): number {
  const prevEnd = new Date(`${prevDate}T${prevEndTime}:00`);
  const nextStart = new Date(`${nextDate}T${nextStartTime}:00`);
  return (nextStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Returns ISO date string "YYYY-MM-DD"
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// day of week: 0=Sunday, 1=Monday...6=Saturday
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDay();
}

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
