import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, LayoutList, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useStudent } from "../components/auth/StudentContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

import HomeworkTable from "../components/homework/HomeworkTable";
import HomeworkForm from "../components/homework/HomeworkForm";
import HomeworkCalendar from "../components/homework/HomeworkCalendar";

export default function Assignments() {
  const { currentStudent } = useStudent();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["homework", currentStudent?.id],
    queryFn: () => base44.entities.Homework.filter({ student_id: currentStudent.id }, "-due_date"),
    enabled: !!currentStudent,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", currentStudent?.id],
    queryFn: () => base44.entities.Class.filter({ student_id: currentStudent.id }, "name"),
    enabled: !!currentStudent,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Homework.create({ ...data, student_id: currentStudent.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Homework.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Homework.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] }),
  });

  const navigate = useNavigate();

  const sendReminder = async (hw) => {
    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `📚 Reminder: ${hw.title} is due soon!`,
      body: `
        <h2>Homework Reminder</h2>
        <p><strong>${hw.title}</strong></p>
        <p><strong>Subject:</strong> ${hw.subject}</p>
        <p><strong>Due:</strong> ${new Date(hw.due_date).toLocaleString()}</p>
        ${hw.description ? `<p><strong>Details:</strong> ${hw.description}</p>` : ""}
        <p>Don't forget to complete this assignment on time!</p>
      `,
    });
    toast.success("Reminder sent to your email!");
  };

  const openTutor = async (hw) => {
    try {
      if (hw.tutor_conversation_id) {
        navigate(createPageUrl(`Tutor?conversationId=${hw.tutor_conversation_id}`));
      } else {
        const conversation = await base44.entities.TutorConversation.create({
          student_id: currentStudent.id,
          homework_id: hw.id,
          title: `Help with: ${hw.title}`,
          subject: hw.subject || "General",
          messages: [],
        });

        await updateMutation.mutateAsync({
          id: hw.id,
          data: { tutor_conversation_id: conversation.id },
        });

        navigate(createPageUrl(`Tutor?conversationId=${conversation.id}`));
      }
    } catch (error) {
      toast.error("Failed to open tutor");
    }
  };

  const filtered = assignments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Assignments</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-slate-200"
          />
        </div>
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="list" className="text-xs">
              <LayoutList className="h-4 w-4 mr-1" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="todo" className="text-xs">
              To Do
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">
              Working
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <HomeworkTable
          assignments={filtered}
          classes={classes}
          onStatusChange={(hw, status) =>
            updateMutation.mutate({ id: hw.id, data: { status } })
          }
          onEdit={(hw) => {
            setEditing(hw);
            setShowForm(true);
          }}
          onDelete={(hw) => deleteMutation.mutate(hw.id)}
          onSendReminder={sendReminder}
          onOpenTutor={openTutor}
        />
      ) : (
        <HomeworkCalendar
          assignments={filtered}
          onEdit={(hw) => {
            setEditing(hw);
            setShowForm(true);
          }}
          onStatusChange={(hw, status) =>
            updateMutation.mutate({ id: hw.id, data: { status } })
          }
        />
      )}

      <HomeworkForm
        open={showForm}
        onOpenChange={setShowForm}
        editingHomework={editing}
        classes={classes}
        onSubmit={(data) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, data });
          } else {
            createMutation.mutate(data);
          }
          setShowForm(false);
          setEditing(null);
        }}
      />
    </div>
  );
}