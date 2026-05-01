"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, CheckCircle, XCircle, Trash2 } from "lucide-react";

type Employee = { id: string; name: string };
type Vacation = {
  id: string;
  employeeId: string;
  employee: Employee;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada" };
const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary", APPROVED: "default", REJECTED: "destructive",
};

export default function VacacionesPage() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", startDate: "", endDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((emps) => {
      setEmployees(emps.filter((e: Employee & { active: boolean }) => e.active));
    });
    fetch("/api/vacations").then((r) => r.json()).then(setVacations);
  }, []);

  async function create() {
    setSaving(true);
    const res = await fetch("/api/vacations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const v = await res.json();
      setVacations((prev) => [v, ...prev]);
      toast.success("Vacaciones registradas");
      setOpen(false);
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/vacations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setVacations((prev) => prev.map((v) => v.id === id ? { ...v, status } : v));
      toast.success(status === "APPROVED" ? "Vacaciones aprobadas" : "Vacaciones rechazadas");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/vacations/${id}`, { method: "DELETE" });
    setVacations((prev) => prev.filter((v) => v.id !== id));
    toast.success("Eliminado");
  }

  const filtered = filterStatus === "ALL" ? vacations : vacations.filter((v) => v.status === filterStatus);

  function dayCount(start: string, end: string) {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Vacaciones</h2>
          <p className="text-sm text-gray-500 mt-1">
            {vacations.filter((v) => v.status === "APPROVED").length} periodos aprobados
          </p>
        </div>
        <Button onClick={() => { setForm({ employeeId: employees[0]?.id ?? "", startDate: "", endDate: "", notes: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar vacaciones
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "Todas" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay vacaciones registradas.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{v.employee.name}</span>
                  <Badge variant={STATUS_COLORS[v.status]}>
                    {STATUS_LABELS[v.status]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {dayCount(v.startDate, v.endDate)} días
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {v.startDate} → {v.endDate}
                </p>
                {v.notes && <p className="text-xs text-gray-400 mt-1">{v.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {v.status === "PENDING" && (
                  <>
                    <button onClick={() => updateStatus(v.id, "APPROVED")} className="text-green-500 hover:text-green-700 p-1">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button onClick={() => updateStatus(v.id, "REJECTED")} className="text-red-400 hover:text-red-600 p-1">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button onClick={() => remove(v.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar vacaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Empleado</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} disabled={saving || !form.employeeId || !form.startDate || !form.endDate}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
