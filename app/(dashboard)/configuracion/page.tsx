"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2 } from "lucide-react";
import { DAY_NAMES } from "@/lib/time";

type BarDayConfig = {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

type StaffingRule = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  salaCount: number;
  cocinaCount: number;
};

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function ConfiguracionPage() {
  const [barConfigs, setBarConfigs] = useState<BarDayConfig[]>([]);
  const [staffingRules, setStaffingRules] = useState<StaffingRule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(({ barDayConfigs, staffingRules: rules }) => {
        setBarConfigs(barDayConfigs);
        setStaffingRules(rules);
      });
  }, []);

  function updateBarConfig(id: string, field: keyof BarDayConfig, value: string | boolean) {
    setBarConfigs((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }

  function updateRule(idx: number, field: keyof StaffingRule, value: string | number) {
    setStaffingRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function addRule() {
    setStaffingRules((prev) => [
      ...prev,
      { dayOfWeek: -1, startTime: "08:00", endTime: "16:00", salaCount: 1, cocinaCount: 0 },
    ]);
  }

  function removeRule(idx: number) {
    setStaffingRules((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barDayConfigs: barConfigs, staffingRules }),
    });
    if (res.ok) {
      toast.success("Configuración guardada");
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-500 mt-1">Horarios del bar y plantilla de personal</p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Bar hours */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Horario del bar por día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {barConfigs.map((c) => (
              <div key={c.id} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-gray-700">{DAY_LABELS[c.dayOfWeek]}</div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={c.isOpen}
                    onChange={(e) => updateBarConfig(c.id, "isOpen", e.target.checked)}
                    className="rounded"
                  />
                  Abre
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={c.openTime}
                    onChange={(e) => updateBarConfig(c.id, "openTime", e.target.value)}
                    disabled={!c.isOpen}
                    className="w-28"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <Input
                    type="time"
                    value={c.closeTime}
                    onChange={(e) => updateBarConfig(c.id, "closeTime", e.target.value)}
                    disabled={!c.isOpen}
                    className="w-28"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staffing rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plantilla de personal por franja</CardTitle>
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir regla
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">
            Día -1 = aplica a todos los días. Las reglas específicas de un día sobreescriben las generales.
          </p>
          <div className="space-y-3">
            {staffingRules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-7">Día</Label>
                  <select
                    value={r.dayOfWeek}
                    onChange={(e) => updateRule(i, "dayOfWeek", Number(e.target.value))}
                    className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-32"
                  >
                    <option value={-1}>Todos</option>
                    {DAY_LABELS.map((d, idx) => (
                      <option key={idx} value={idx}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Input type="time" value={r.startTime} onChange={(e) => updateRule(i, "startTime", e.target.value)} className="w-24" />
                  <span className="text-gray-400 text-xs">→</span>
                  <Input type="time" value={r.endTime} onChange={(e) => updateRule(i, "endTime", e.target.value)} className="w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Sala</Label>
                  <Input type="number" min={0} max={10} value={r.salaCount} onChange={(e) => updateRule(i, "salaCount", Number(e.target.value))} className="w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">Cocina</Label>
                  <Input type="number" min={0} max={10} value={r.cocinaCount} onChange={(e) => updateRule(i, "cocinaCount", Number(e.target.value))} className="w-16" />
                </div>
                <button onClick={() => removeRule(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
