import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
  { value: "red", label: "Red" },
];

export default function ClassForm({ open, onOpenChange, onSubmit, editingClass }) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    teacher_name: "",
    teacher_email: "",
    teacher_phone: "",
    room_number: "",
    schedule: "",
    current_grade: "",
    color: "blue",
  });

  useEffect(() => {
    if (editingClass) {
      setForm({
        name: editingClass.name || "",
        subject: editingClass.subject || "",
        teacher_name: editingClass.teacher_name || "",
        teacher_email: editingClass.teacher_email || "",
        teacher_phone: editingClass.teacher_phone || "",
        room_number: editingClass.room_number || "",
        schedule: editingClass.schedule || "",
        current_grade: editingClass.current_grade || "",
        color: editingClass.color || "blue",
      });
    } else {
      setForm({
        name: "",
        subject: "",
        teacher_name: "",
        teacher_email: "",
        teacher_phone: "",
        room_number: "",
        schedule: "",
        current_grade: "",
        color: "blue",
      });
    }
  }, [editingClass, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {editingClass ? "Edit Class" : "New Class"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Class Name
              </Label>
              <Input
                placeholder="e.g. AP Biology"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subject
              </Label>
              <Input
                placeholder="e.g. Science"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Color
              </Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teacher Name
            </Label>
            <Input
              placeholder="e.g. Ms. Johnson"
              value={form.teacher_name}
              onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher Email
              </Label>
              <Input
                type="email"
                placeholder="teacher@school.edu"
                value={form.teacher_email}
                onChange={(e) => setForm({ ...form, teacher_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher Phone
              </Label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={form.teacher_phone}
                onChange={(e) => setForm({ ...form, teacher_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Room Number
              </Label>
              <Input
                placeholder="e.g. 204"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Schedule
              </Label>
              <Input
                placeholder="e.g. Period 3"
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Grade
            </Label>
            <Input
              placeholder="e.g. A, B+, 95%"
              value={form.current_grade}
              onChange={(e) => setForm({ ...form, current_grade: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {editingClass ? "Update" : "Add Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}