"use client";

type Employee = { id: string; name: string; color: string };
type Shift = {
  id: string;
  startTime: string;
  endTime: string;
  environment: string;
  employee: Employee | null;
  isExtra: boolean;
  hasBreak: boolean;
};

export function ShiftCell({
  shift,
  employees,
  onClick,
}: {
  shift: Shift;
  employees: Employee[];
  onClick: () => void;
}) {
  const emp = shift.employee;
  const isExtra = shift.isExtra || !emp;

  const bg = isExtra
    ? "bg-amber-50 border border-amber-300 text-amber-700"
    : "border text-white";

  const style = isExtra ? {} : { backgroundColor: emp?.color ?? "#6366f1", borderColor: emp?.color ?? "#6366f1" };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded px-1.5 py-1 text-[10px] leading-tight ${bg} hover:opacity-80 transition-opacity`}
      style={style}
    >
      <div className="font-medium truncate">
        {isExtra ? "EXTRA" : emp?.name ?? "—"}
      </div>
      <div className="opacity-80">
        {shift.startTime}–{shift.endTime}
      </div>
      <div className="opacity-70 text-[9px]">
        {shift.environment === "SALA" ? "Sala" : "Cocina"}
        {shift.hasBreak ? " · 20'" : ""}
      </div>
    </button>
  );
}
