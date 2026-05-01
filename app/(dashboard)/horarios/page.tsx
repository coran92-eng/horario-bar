"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { MONTH_NAMES } from "@/lib/time";

type Schedule = {
  id: string;
  year: number;
  month: number;
  status: string;
  createdAt: string;
  _count: { shifts: number };
};

export default function HorariosPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  useEffect(() => {
    fetch("/api/seed", { method: "POST" }).then(() => {
      fetch("/api/schedules")
        .then((r) => r.json())
        .then(setSchedules)
        .finally(() => setLoading(false));
    });
  }, []);

  async function createSchedule() {
    const year = Number(prompt("Año:", String(defaultYear)));
    const month = Number(prompt("Mes (1-12):", String(defaultMonth)));
    if (!year || !month || month < 1 || month > 12) return;

    setCreating(true);
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });

    if (res.ok) {
      const schedule = await res.json();
      toast.success(`Horario ${MONTH_NAMES[month - 1]} ${year} creado`);
      router.push(`/horarios/${schedule.id}`);
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al crear el horario");
    }
    setCreating(false);
  }

  async function deleteSchedule(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("¿Eliminar este horario?")) return;
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Horario eliminado");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Horarios</h2>
          <p className="text-sm text-gray-500 mt-1">Planificación mensual de turnos</p>
        </div>
        <Button onClick={createSchedule} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo horario
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : schedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay horarios creados</p>
            <p className="text-gray-400 text-sm mt-1">Crea el primer horario mensual</p>
            <Button className="mt-4" onClick={createSchedule}>
              <Plus className="h-4 w-4 mr-2" />
              Crear horario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/horarios/${s.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {MONTH_NAMES[s.month - 1]} {s.year}
                  </CardTitle>
                  <button
                    onClick={(e) => deleteSchedule(s.id, e)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{s._count.shifts} turnos</span>
                  <Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"}>
                    {s.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
