import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function CompletionChart({ assignments }) {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const inProgress = assignments.filter((a) => a.status === "in_progress").length;
  const todo = assignments.filter((a) => a.status === "todo").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-700">Completion Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-violet-50 to-violet-100 relative">
            <div className="text-4xl font-bold text-violet-600">{completionRate}%</div>
            <div className="absolute inset-0 rounded-full border-8 border-violet-200"></div>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${completionRate * 2.64} 264`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-sm text-slate-500 mt-3">Overall Completion Rate</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={(completed / total) * 100} className="w-20 h-2" />
              <span className="text-sm font-semibold text-slate-700 w-8 text-right">{completed}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-slate-600">In Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={(inProgress / total) * 100} className="w-20 h-2" />
              <span className="text-sm font-semibold text-slate-700 w-8 text-right">{inProgress}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">To Do</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={(todo / total) * 100} className="w-20 h-2" />
              <span className="text-sm font-semibold text-slate-700 w-8 text-right">{todo}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}