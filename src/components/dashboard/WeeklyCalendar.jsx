import React, { useState } from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityBorders = {
  high: "border-l-4 border-l-rose-500",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-blue-500",
};

export default function WeeklyCalendar({ assignments, onStatusChange }) {
  const [currentWeek, setCurrentWeek] = useState(moment());

  const startOfWeek = currentWeek.clone().startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, "days"));

  const getAssignmentsForDay = (day) => {
    return assignments.filter((a) => 
      moment(a.due_date).isSame(day, "day")
    );
  };

  const goToPreviousWeek = () => setCurrentWeek(currentWeek.clone().subtract(1, "week"));
  const goToNextWeek = () => setCurrentWeek(currentWeek.clone().add(1, "week"));
  const goToToday = () => setCurrentWeek(moment());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {startOfWeek.format("MMM D")} - {startOfWeek.clone().add(6, "days").format("MMM D, YYYY")}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const dayAssignments = getAssignmentsForDay(day);
          const isToday = day.isSame(moment(), "day");
          const isPast = day.isBefore(moment(), "day");

          return (
            <div
              key={idx}
              className={`rounded-xl border-2 transition-all flex flex-col ${
                isToday
                  ? "border-violet-400 bg-violet-50/50"
                  : "border-white/30 bg-white/60 backdrop-blur-sm"
              }`}
            >
              <div className={`p-3 border-b ${isToday ? "border-violet-200 bg-violet-100/50" : "border-slate-100"}`}>
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  {day.format("ddd")}
                </div>
                <div className={`text-lg font-bold ${isToday ? "text-violet-700" : isPast ? "text-slate-400" : "text-slate-700"}`}>
                  {day.format("D")}
                </div>
                {dayAssignments.length > 0 && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    {dayAssignments.length} assignment{dayAssignments.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5 flex-1">
                {dayAssignments.map((assignment) => (
                  <DropdownMenu key={assignment.id}>
                    <DropdownMenuTrigger asChild>
                      <div
                        className={`p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer ${priorityBorders[assignment.priority]} group`}
                      >
                        <div className="flex items-start gap-2">
                          {assignment.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                          ) : assignment.status === "in_progress" ? (
                            <Clock className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium break-words ${assignment.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                              {assignment.title}
                            </p>
                            {assignment.subject && (
                              <p className="text-[9px] text-slate-400">{assignment.subject}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onStatusChange(assignment, "todo")}>
                        <Circle className="h-4 w-4 mr-2 text-slate-400" />
                        To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(assignment, "in_progress")}>
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        Working On It
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(assignment, "completed")}>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                        Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}