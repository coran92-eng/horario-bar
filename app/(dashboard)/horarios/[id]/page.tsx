"use client";

import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, ChevronLeft, Download } from "lucide-react";
import Link from "next/link";
import { MONTH_NAMES, DAY_NAMES, getDaysInMonth, getDayOfWeek, formatDate } from "@/lib/time";
import { ShiftCell } from "@/components/ShiftCell";
import { EditShiftDialog } from "@/components/EditShiftDialog";

type Employee = {
  id: string;
  name: string;
  role: string;
  color: string;
};

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  environment: string;
  employeeId: string | null;
  employee: Employee | null;
  isExtra: boolean;
  hasBreak: boolean;
  notes: string | null;
};

type Schedule = {
  id: string;
  year: number;
  month: number;
  status: string;
  shifts: Shift[];
};

export default function HorarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [activeTab, setActiveTab] = useState<"SALA" | "COCINA" | "ALL">("ALL");

  useEffect(() => {
    Promise.all([
      fetch(`/api/schedules/${id}`).then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ]).then(([sched, emps]) => {
      setSchedule(sched);
      setEmployees(emps);
    });
  }, [id]);

  async function generate() {
    if (!confirm("¿Generar horario automáticamente? Esto reemplazará los turnos actuales.")) return;
    setGenerating(true);
    const res = await fetch(`/api/schedules/${id}/generate`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setSchedule(updated);
      toast.success("Horario generado correctamente");
    } else {
      toast.error("Error al generar el horario");
    }
    setGenerating(false);
  }

  async function togglePublish() {
    if (!schedule) return;
    const newStatus = schedule.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await fetch(`/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setSchedule((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(newStatus === "PUBLISHED" ? "Horario publicado" : "Horario en borrador");
    }
  }

  async function saveShift(shiftId: string, data: Partial<Shift>) {
    const res = await fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setSchedule((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shifts: prev.shifts.map((s) => (s.id === shiftId ? { ...s, ...updated } : s)),
        };
      });
      toast.success("Turno actualizado");
    } else {
      toast.error("Error al actualizar el turno");
    }
    setEditingShift(null);
  }

  async function deleteShift(shiftId: string) {
    await fetch(`/api/shifts/${shiftId}`, { method: "DELETE" });
    setSchedule((prev) => {
      if (!prev) return prev;
      return { ...prev, shifts: prev.shifts.filter((s) => s.id !== shiftId) };
    });
    toast.success("Turno eliminado");
    setEditingShift(null);
  }

  if (!schedule) return <div className="p-8 text-gray-500">Cargando...</div>;

  const { year, month } = schedule;
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredShifts = schedule.shifts.filter(
    (s) => activeTab === "ALL" || s.environment === activeTab
  );

  const shiftsByDate = new Map<string, Shift[]>();
  for (const shift of filteredShifts) {
    if (!shiftsByDate.has(shift.date)) shiftsByDate.set(shift.date, []);
    shiftsByDate.get(shift.date)!.push(shift);
  }

  const extraCount = schedule.shifts.filter((s) => s.isExtra).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/horarios" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={schedule.status === "PUBLISHED" ? "default" : "secondary"}>
              {schedule.status === "PUBLISHED" ? "Publicado" : "Borrador"}
            </Badge>
            {extraCount > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {extraCount} hueco{extraCount > 1 ? "s" : ""} para extras
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? "Generando..." : "Generar"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button size="sm" onClick={togglePublish}>
            {schedule.status === "PUBLISHED" ? "Volver a borrador" : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Environment tabs */}
      <div className="flex gap-2 mb-4">
        {(["ALL", "SALA", "COCINA"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab === "ALL" ? "Todos" : tab === "SALA" ? "Sala" : "Cocina"}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-semibold text-gray-500 text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar rows */}
        <CalendarBody
          year={year}
          month={month}
          days={days}
          shiftsByDate={shiftsByDate}
          employees={employees}
          onShiftClick={setEditingShift}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {employees.map((e) => (
          <div key={e.id} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
            {e.name}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400" />
          Extra
        </div>
      </div>

      {/* Edit dialog */}
      {editingShift && (
        <EditShiftDialog
          shift={editingShift}
          employees={employees}
          onSave={saveShift}
          onDelete={deleteShift}
          onClose={() => setEditingShift(null)}
        />
      )}
    </div>
  );
}

function CalendarBody({
  year,
  month,
  days,
  shiftsByDate,
  employees,
  onShiftClick,
}: {
  year: number;
  month: number;
  days: number[];
  shiftsByDate: Map<string, Shift[]>;
  employees: Employee[];
  onShiftClick: (s: Shift) => void;
}) {
  // Build calendar weeks
  const firstDow = getDayOfWeek(formatDate(year, month, 1));
  const cells: (number | null)[] = Array(firstDow).fill(null);
  days.forEach((d) => cells.push(d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="min-h-[100px] bg-gray-50/50" />;
            const dateStr = formatDate(year, month, day);
            const shifts = shiftsByDate.get(dateStr) ?? [];
            const dow = getDayOfWeek(dateStr);
            const isWeekend = dow === 0 || dow === 6;
            return (
              <div
                key={di}
                className={`min-h-[100px] p-1.5 border-r border-gray-100 last:border-r-0 ${
                  isWeekend ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
                <div className="space-y-1">
                  {shifts.map((s) => (
                    <ShiftCell
                      key={s.id}
                      shift={s}
                      employees={employees}
                      onClick={() => onShiftClick(s)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
