import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudent } from "../components/auth/StudentContext";
import { toast } from "sonner";

import ClassCard from "../components/classes/ClassCard";
import ClassForm from "../components/classes/ClassForm";

export default function Classes() {
  const { currentStudent } = useStudent();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", currentStudent?.id],
    queryFn: () => base44.entities.Class.filter({ student_id: currentStudent.id }, "name"),
    enabled: !!currentStudent,
  });

  const { data: allHomework = [] } = useQuery({
    queryKey: ["homework", currentStudent?.id],
    queryFn: () => base44.entities.Homework.filter({ student_id: currentStudent.id }),
    enabled: !!currentStudent,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Class.create({ ...data, student_id: currentStudent.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", currentStudent?.id] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", currentStudent?.id] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Class.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", currentStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] });
      setDeleteTarget(null);
    },
  });

  const getHomeworkCount = (classId) => {
    return allHomework.filter((hw) => hw.class_id === classId).length;
  };

  const importFromHomework = async () => {
    setImporting(true);
    try {
      const existingClassNames = new Set(classes.map(c => c.name?.toLowerCase()));
      
      // Extract unique class info from homework
      const classMap = new Map();
      allHomework.forEach(hw => {
        const className = hw.subject || "General";
        const key = className.toLowerCase();
        
        if (!existingClassNames.has(key) && !classMap.has(key)) {
          classMap.set(key, {
            name: className,
            subject: hw.subject,
            teacher_name: hw.teacher_name,
            teacher_email: hw.teacher_email,
            student_id: currentStudent.id,
            color: ["blue", "green", "purple", "orange", "pink", "red"][Math.floor(Math.random() * 6)],
          });
        }
      });

      if (classMap.size === 0) {
        toast.info("No new classes found in homework assignments");
        setImporting(false);
        return;
      }

      await base44.entities.Class.bulkCreate(Array.from(classMap.values()));
      
      // Update homework with class_id references
      const allClassesAfter = await base44.entities.Class.filter({ student_id: currentStudent.id });
      const classNameToId = new Map(allClassesAfter.map(c => [c.name?.toLowerCase(), c.id]));
      
      const updates = allHomework
        .filter(hw => !hw.class_id && hw.subject)
        .map(hw => ({
          id: hw.id,
          class_id: classNameToId.get(hw.subject.toLowerCase()),
        }));

      await Promise.all(updates.map(u => base44.entities.Homework.update(u.id, { class_id: u.class_id })));

      queryClient.invalidateQueries({ queryKey: ["classes", currentStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] });
      toast.success(`Created ${classMap.size} class${classMap.size !== 1 ? "es" : ""} from homework`);
    } catch (error) {
      toast.error("Failed to import classes");
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Classes</h1>
        <div className="flex gap-2">
          <Button
            onClick={importFromHomework}
            disabled={importing || allHomework.length === 0}
            variant="outline"
            className="border-violet-200 text-violet-600 hover:bg-violet-50"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import from Homework
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No classes yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add your first class to get organized
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              classData={cls}
              homeworkCount={getHomeworkCount(cls.id)}
              onEdit={(c) => {
                setEditing(c);
                setShowForm(true);
              }}
              onDelete={(id) => setDeleteTarget(classes.find(c => c.id === id) || { id })}
            />
          ))}
        </div>
      )}

      <ClassForm
        open={showForm}
        onOpenChange={setShowForm}
        editingClass={editing}
        onSubmit={(data) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name || "class"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this class. Linked assignments will keep their data but will no longer be associated with this class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}