"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, UserX } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  role: string;
  weeklyHours: number;
  active: boolean;
  color: string;
};

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316",
];

const ROLE_LABELS: Record<string, string> = {
  SALA: "Sala",
  COCINA: "Cocina",
  BOTH: "Sala y Cocina",
};

type Form = {
  id?: string;
  name: string;
  role: string;
  weeklyHours: string;
  color: string;
};

const emptyForm = (): Form => ({ name: "", role: "SALA", weeklyHours: "40", color: COLORS[0] });

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
  }, []);

  function openCreate() {
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(e: Employee) {
    setForm({ id: e.id, name: e.name, role: e.role, weeklyHours: String(e.weeklyHours), color: e.color });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/employees/${form.id}` : "/api/employees";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, role: form.role, weeklyHours: Number(form.weeklyHours), color: form.color }),
    });

    if (res.ok) {
      const emp = await res.json();
      if (form.id) {
        setEmployees((prev) => prev.map((e) => (e.id === form.id ? emp : e)));
        toast.success("Empleado actualizado");
      } else {
        setEmployees((prev) => [...prev, emp]);
        toast.success("Empleado añadido");
      }
      setOpen(false);
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  async function deactivate(id: string) {
    if (!confirm("¿Desactivar este empleado?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: false } : e)));
    toast.success("Empleado desactivado");
  }

  const active = employees.filter((e) => e.active);
  const inactive = employees.filter((e) => !e.active);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Empleados</h2>
          <p className="text-sm text-gray-500 mt-1">{active.length} activos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir empleado
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {active.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                style={{ backgroundColor: e.color }}
              >
                {e.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{e.name}</div>
                <div className="text-sm text-gray-500">
                  {ROLE_LABELS[e.role] ?? e.role} · {e.weeklyHours}h/sem
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(e)} className="text-gray-400 hover:text-gray-600 p-1">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deactivate(e.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Inactivos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactive.map((e) => (
              <Card key={e.id} className="opacity-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {e.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 truncate">{e.name}</div>
                    <Badge variant="secondary" className="text-xs mt-0.5">Inactivo</Badge>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch(`/api/employees/${e.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: true }),
                      });
                      setEmployees((prev) => prev.map((emp) => emp.id === e.id ? { ...emp, active: true } : emp));
                      toast.success("Empleado reactivado");
                    }}
                    className="text-indigo-500 text-xs hover:underline"
                  >
                    Reactivar
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? form.role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALA">Sala</SelectItem>
                  <SelectItem value="COCINA">Cocina</SelectItem>
                  <SelectItem value="BOTH">Sala y Cocina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horas semanales por contrato</Label>
              <Input
                type="number"
                min={1}
                max={40}
                value={form.weeklyHours}
                onChange={(e) => setForm({ ...form, weeklyHours: e.target.value })}
              />
            </div>
            <div>
              <Label>Color identificativo</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
