import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";

const statusConfig = {
  todo: { icon: Circle, color: "text-slate-400", bg: "bg-slate-100" },
  in_progress: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
};

const priorityColors = {
  high: "border-l-rose-500",
  medium: "border-l-amber-500",
  low: "border-l-blue-500",
};

export default function HomeworkCalendar({ assignments, onEdit, onStatusChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAssignmentsForDay = (day) => {
    return assignments.filter((a) => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      if (isNaN(dueDate.getTime())) return false;
      return isSameDay(dueDate, day);
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-500 py-2"
          >
            {day}
          </div>
        ))}

        {days.map((day, i) => {
          const dayAssignments = getAssignmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <Card
              key={i}
              className={`min-h-[120px] ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isDayToday ? "ring-2 ring-amber-500" : ""}`}
            >
              <CardContent className="p-2">
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isDayToday
                      ? "bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      : "text-slate-700"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayAssignments.map((assignment) => {
                    const StatusIcon = statusConfig[assignment.status]?.icon || Circle;
                    return (
                      <button
                        key={assignment.id}
                        onClick={() => onEdit(assignment)}
                        className={`w-full text-left p-1.5 rounded border-l-2 ${
                          priorityColors[assignment.priority]
                        } ${
                          statusConfig[assignment.status]?.bg
                        } hover:shadow-sm transition-shadow text-xs`}
                      >
                        <div className="flex items-start gap-1">
                          <StatusIcon
                            className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                              statusConfig[assignment.status]?.color
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {assignment.title}
                            </div>
                            {assignment.subject && (
                              <div className="text-[10px] text-slate-500 truncate">
                                {assignment.subject}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}