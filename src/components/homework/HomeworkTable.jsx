import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Bell,
  ArrowUpCircle,
  Mail,
  Sparkles,
} from "lucide-react";
import moment from "moment";
import HomeworkComments from "./HomeworkComments";

const statusConfig = {
  todo: { icon: Circle, color: "text-slate-400", bg: "bg-slate-50", label: "To Do" },
  in_progress: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50", label: "Working" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Done" },
};

const priorityStyles = {
  high: "bg-rose-50 text-rose-600 border-rose-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-sky-50 text-sky-600 border-sky-200",
};

export default function HomeworkTable({
  assignments,
  onStatusChange,
  onEdit,
  onDelete,
  onSendReminder,
  onOpenTutor,
  classes = [],
}) {
  const [expandedId, setExpandedId] = React.useState(null);
  if (!assignments || assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold">No assignments yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Add your first homework above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {assignments.map((hw, i) => {
          const st = statusConfig[hw.status] || statusConfig.todo;
          const StatusIcon = st.icon;
          const isOverdue =
            hw.status !== "completed" && moment(hw.due_date).isBefore(moment());
          const assignedClass = classes.find(c => c.id === hw.class_id);

          const isExpanded = expandedId === hw.id;

          return (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.03 }}
              className={`group rounded-xl border transition-all hover:shadow-sm ${
                hw.status === "completed"
                  ? "bg-slate-50/50 border-slate-100"
                  : isOverdue
                  ? "bg-rose-50/30 border-rose-100"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              <div 
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : hw.id)}
              >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${st.bg} ${st.color} hover:opacity-80 transition`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onStatusChange(hw, "todo")}>
                    <Circle className="h-4 w-4 mr-2 text-slate-400" />
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(hw, "in_progress")}>
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Working On It
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(hw, "completed")}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-semibold text-sm truncate ${
                      hw.status === "completed"
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {hw.title}
                  </p>
                  {hw.source === "schoology_import" && (
                    <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 border-violet-200">
                      Schoology
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                    {hw.subject}
                  </span>
                  {hw.teacher_name && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400">{hw.teacher_name}</span>
                    </>
                  )}
                  <span className="text-slate-200">·</span>
                  <span
                    className={`text-xs ${
                      isOverdue ? "text-rose-500 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {isOverdue ? "Overdue · " : ""}
                    {moment(hw.due_date).format("MMM D, h:mm A")}
                  </span>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`${priorityStyles[hw.priority]} text-xs font-medium hidden sm:flex`}
              >
                {hw.priority}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(isExpanded ? null : hw.id);
                }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                </motion.div>
              </Button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTutor(hw);
                        }}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        size="sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get AI Assistance
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(hw);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendReminder(hw);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                      {(hw.teacher_email || assignedClass?.teacher_email) && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            const email = hw.teacher_email || assignedClass?.teacher_email;
                            window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Question about: ${hw.title}`)}`;
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Teacher
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(hw);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <div className="px-4 pb-4">
                      <HomeworkComments homeworkId={hw.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}