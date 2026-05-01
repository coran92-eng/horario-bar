// Festivos de Cataluña + Barcelona 2025 y 2026
// Fuente: calendario oficial Generalitat de Catalunya + Ajuntament de Barcelona

export type HolidayEntry = {
  date: string; // "YYYY-MM-DD"
  name: string;
  type: "NATIONAL" | "AUTONOMY" | "PROVINCE" | "LOCAL";
};

const HOLIDAYS_2025: HolidayEntry[] = [
  { date: "2025-01-01", name: "Año Nuevo", type: "NATIONAL" },
  { date: "2025-01-06", name: "Reyes Magos", type: "NATIONAL" },
  { date: "2025-04-18", name: "Viernes Santo", type: "NATIONAL" },
  { date: "2025-04-21", name: "Lunes de Pascua", type: "AUTONOMY" },
  { date: "2025-05-01", name: "Día del Trabajo", type: "NATIONAL" },
  { date: "2025-06-09", name: "Día de la región (Pasqua Granada)", type: "AUTONOMY" },
  { date: "2025-06-24", name: "San Juan", type: "AUTONOMY" },
  { date: "2025-08-15", name: "Asunción de la Virgen", type: "NATIONAL" },
  { date: "2025-09-11", name: "Diada Nacional de Catalunya", type: "AUTONOMY" },
  { date: "2025-09-24", name: "La Mercè (Barcelona)", type: "LOCAL" },
  { date: "2025-10-12", name: "Fiesta Nacional de España", type: "NATIONAL" },
  { date: "2025-11-01", name: "Todos los Santos", type: "NATIONAL" },
  { date: "2025-12-06", name: "Día de la Constitución", type: "NATIONAL" },
  { date: "2025-12-08", name: "Inmaculada Concepción", type: "NATIONAL" },
  { date: "2025-12-25", name: "Navidad", type: "NATIONAL" },
  { date: "2025-12-26", name: "San Esteban", type: "AUTONOMY" },
];

const HOLIDAYS_2026: HolidayEntry[] = [
  { date: "2026-01-01", name: "Año Nuevo", type: "NATIONAL" },
  { date: "2026-01-06", name: "Reyes Magos", type: "NATIONAL" },
  { date: "2026-04-03", name: "Viernes Santo", type: "NATIONAL" },
  { date: "2026-04-06", name: "Lunes de Pascua", type: "AUTONOMY" },
  { date: "2026-05-01", name: "Día del Trabajo", type: "NATIONAL" },
  { date: "2026-06-24", name: "San Juan", type: "AUTONOMY" },
  { date: "2026-08-15", name: "Asunción de la Virgen", type: "NATIONAL" },
  { date: "2026-09-11", name: "Diada Nacional de Catalunya", type: "AUTONOMY" },
  { date: "2026-09-24", name: "La Mercè (Barcelona)", type: "LOCAL" },
  { date: "2026-10-12", name: "Fiesta Nacional de España", type: "NATIONAL" },
  { date: "2026-11-01", name: "Todos los Santos", type: "NATIONAL" },
  { date: "2026-12-06", name: "Día de la Constitución", type: "NATIONAL" },
  { date: "2026-12-08", name: "Inmaculada Concepción", type: "NATIONAL" },
  { date: "2026-12-25", name: "Navidad", type: "NATIONAL" },
  { date: "2026-12-26", name: "San Esteban", type: "AUTONOMY" },
];

export function getHolidaysForYear(year: number): HolidayEntry[] {
  if (year === 2025) return HOLIDAYS_2025;
  if (year === 2026) return HOLIDAYS_2026;
  return [];
}

export function isHoliday(date: string, holidays: HolidayEntry[]): boolean {
  return holidays.some((h) => h.date === date);
}

export function getHoliday(date: string, holidays: HolidayEntry[]): HolidayEntry | undefined {
  return holidays.find((h) => h.date === date);
}
