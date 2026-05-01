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
import { MONTH_NAMES } from "@/lib/time";

type Employee = { id: string; name: string };
type Request = {
  id: string;
  employeeId: string;
  employee: Employee;
  year: number;
  month: number;
  type: string;
  details: string;
  status: string;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  DAY_OFF: "Día libre",
  SHIFT_PREFERENCE: "Preferencia de turno",
  OTHER: "Otro",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const now = new Date();

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
  const [filterYear, setFilterYear] = useState(now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", year: filterYear, month: filterMonth, type: "DAY_OFF", details: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((emps) => {
      setEmployees(emps.filter((e: Employee & { active: boolean }) => e.active));
    });
  }, []);

  useEffect(() => {
    fetch(`/api/requests?year=${filterYear}&month=${filterMonth}`)
      .then((r) => r.json())
      .then(setRequests);
  }, [filterYear, filterMonth]);

  async function create() {
    setSaving(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const r = await res.json();
      setRequests((prev) => [r, ...prev]);
      toast.success("Solicitud registrada");
      setOpen(false);
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(status === "APPROVED" ? "Solicitud aprobada" : "Solicitud rechazada");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Solicitud eliminada");
  }

  const years = [now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Solicitudes</h2>
          <p className="text-sm text-gray-500 mt-1">Peticiones de los empleados por mes</p>
        </div>
        <Button onClick={() => { setForm({ employeeId: employees[0]?.id ?? "", year: filterYear, month: filterMonth, type: "DAY_OFF", details: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva solicitud
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay solicitudes para {MONTH_NAMES[filterMonth - 1]} {filterYear}.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{r.employee.name}</span>
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[r.type] ?? r.type}</Badge>
                  <Badge variant={STATUS_COLORS[r.status] as "default" | "secondary" | "destructive"} className="text-xs">
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{r.details}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.status === "PENDING" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "APPROVED")} className="text-green-500 hover:text-green-700 p-1" title="Aprobar">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button onClick={() => updateStatus(r.id, "REJECTED")} className="text-red-400 hover:text-red-600 p-1" title="Rechazar">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Empleado</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v ?? form.employeeId })}>
                <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mes</Label>
                <Select value={String(form.month)} onValueChange={(v) => setForm({ ...form, month: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_OFF">Día libre</SelectItem>
                  <SelectItem value="SHIFT_PREFERENCE">Preferencia de turno</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Detalles</Label>
              <Textarea
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder={form.type === "DAY_OFF" ? "Ej: 2025-06-15, 2025-06-16 (lunes y martes)" : "Describe la solicitud..."}
                rows={3}
              />
              {form.type === "DAY_OFF" && (
                <p className="text-xs text-gray-400 mt-1">Para días libres, introduce las fechas separadas por comas (AAAA-MM-DD)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} disabled={saving || !form.employeeId || !form.details}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
