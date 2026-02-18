import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import moment from "moment";
import { useStudent } from "../components/auth/StudentContext";

import StatsCard from "../components/dashboard/StatsCard";
import WeeklyCalendar from "../components/dashboard/WeeklyCalendar";
import HomeworkForm from "../components/homework/HomeworkForm";
import CompletionChart from "../components/dashboard/CompletionChart";
import GamificationCard from "../components/dashboard/GamificationCard";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { currentStudent } = useStudent();

  const { data: assignments = [] } = useQuery({
    queryKey: ["homework", currentStudent?.id],
    queryFn: () => base44.entities.Homework.filter({ student_id: currentStudent.id }, "-due_date"),
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

  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "completed");
  const inProgress = assignments.filter((a) => a.status === "in_progress");
  const completionPct = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {moment().format("dddd, MMMM D")}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={total}
          icon={BookOpen}
          color="violet"
          subtitle="All assignments"
        />
        <StatsCard
          title="Completed"
          value={completed.length}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="In Progress"
          value={inProgress.length}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="Completion"
          value={`${completionPct}%`}
          icon={TrendingUp}
          color="purple"
          subtitle={`${completed.length} of ${total}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionChart assignments={assignments} />
        <GamificationCard assignments={assignments} />
      </div>

      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-700">Weekly Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your assignments for the week
          </p>
        </div>
        <WeeklyCalendar
          assignments={assignments}
          onStatusChange={(hw, status) =>
            updateMutation.mutate({ id: hw.id, data: { status } })
          }
        />
      </div>

      <HomeworkForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => createMutation.mutate(data)}
        classes={[]}
      />
    </div>
  );
}