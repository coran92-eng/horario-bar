"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

type Employee = { id: string; name: string; role: string };
type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  environment: string;
  employeeId: string | null;
  isExtra: boolean;
  hasBreak: boolean;
  notes: string | null;
};

export function EditShiftDialog({
  shift,
  employees,
  onSave,
  onDelete,
  onClose,
}: {
  shift: Shift;
  employees: Employee[];
  onSave: (id: string, data: Partial<Shift>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [environment, setEnvironment] = useState(shift.environment);
  const [employeeId, setEmployeeId] = useState(shift.employeeId ?? "EXTRA");
  const [notes, setNotes] = useState(shift.notes ?? "");

  function save() {
    const isExtra = employeeId === "EXTRA";
    onSave(shift.id, {
      startTime,
      endTime,
      environment,
      employeeId: isExtra ? null : employeeId,
      isExtra,
      notes: notes || null,
    });
  }

  // Filter employees by environment
  const compatible = employees.filter((e) => {
    if (environment === "SALA") return e.role === "SALA" || e.role === "BOTH";
    if (environment === "COCINA") return e.role === "COCINA" || e.role === "BOTH";
    return true;
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar turno — {shift.date}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Entrada</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>Salida</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Ambiente</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v ?? environment)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALA">Sala</SelectItem>
                <SelectItem value="COCINA">Cocina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Empleado</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? employeeId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXTRA">⚠ Slot para extra</SelectItem>
                {compatible.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(shift.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
