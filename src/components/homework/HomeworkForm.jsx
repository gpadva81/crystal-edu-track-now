import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { BookOpen, Calendar, Flag, FileText } from "lucide-react";

const SUBJECTS = [
  "Math",
  "English",
  "Science",
  "History",
  "Art",
  "Music",
  "PE",
  "Computer Science",
  "Foreign Language",
  "Social Studies",
  "Other",
];

export default function HomeworkForm({ open, onOpenChange, onSubmit, editingHomework, classes = [] }) {
  const [form, setForm] = useState({
    title: "",
    class_id: "",
    subject: "",
    description: "",
    due_date: "",
    priority: "medium",
    notes: "",
    teacher_feedback: "",
  });

  useEffect(() => {
    if (editingHomework) {
      setForm({
        title: editingHomework.title || "",
        class_id: editingHomework.class_id || "",
        subject: editingHomework.subject || "",
        description: editingHomework.description || "",
        due_date: editingHomework.due_date
          ? new Date(editingHomework.due_date).toISOString().slice(0, 16)
          : "",
        priority: editingHomework.priority || "medium",
        notes: editingHomework.notes || "",
        teacher_feedback: editingHomework.teacher_feedback || "",
      });
    } else {
      setForm({
        title: "",
        class_id: "",
        subject: "",
        description: "",
        due_date: "",
        priority: "medium",
        notes: "",
        teacher_feedback: "",
      });
    }
  }, [editingHomework, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      due_date: new Date(form.due_date).toISOString(),
      status: editingHomework?.status || "todo",
      source: editingHomework?.source || "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {editingHomework ? "Edit Assignment" : "New Assignment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <BookOpen className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Title
            </Label>
            <Input
              placeholder="e.g. Chapter 5 Review Questions"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class (Optional)
            </Label>
            <Select
              value={form.class_id}
              onValueChange={(v) => {
                const selectedClass = classes.find(c => c.id === v);
                setForm({ 
                  ...form, 
                  class_id: v,
                  subject: selectedClass?.subject || form.subject
                });
              }}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subject
              </Label>
              <Select
                value={form.subject}
                onValueChange={(v) => setForm({ ...form, subject: v })}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Pick subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Flag className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                Priority
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Due Date & Time
            </Label>
            <Input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
              className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FileText className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              Description
            </Label>
            <Textarea
              placeholder="Assignment details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Notes
            </Label>
            <Textarea
              placeholder="Personal notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teacher Feedback
            </Label>
            <Textarea
              placeholder="Feedback from your teacher..."
              value={form.teacher_feedback}
              onChange={(e) => setForm({ ...form, teacher_feedback: e.target.value })}
              rows={2}
              className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
            >
              {editingHomework ? "Update" : "Add Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}