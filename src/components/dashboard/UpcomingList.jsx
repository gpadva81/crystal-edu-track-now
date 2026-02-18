import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import moment from "moment";

const priorityStyles = {
  high: "bg-rose-50 text-rose-600 border-rose-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-sky-50 text-sky-600 border-sky-200",
};

export default function UpcomingList({ assignments, onMarkComplete }) {
  const getTimeLeft = (dueDate) => {
    const now = moment();
    const due = moment(dueDate);
    const diff = due.diff(now, "hours");
    if (diff < 0) return { text: "Overdue", urgent: true };
    if (diff < 24) return { text: `${diff}h left`, urgent: true };
    if (diff < 48) return { text: "Tomorrow", urgent: false };
    return { text: due.fromNow(), urgent: false };
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="text-slate-500 font-medium">All caught up!</p>
        <p className="text-sm text-slate-400 mt-1">No upcoming assignments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {assignments.map((hw, i) => {
          const timeLeft = getTimeLeft(hw.due_date);
          return (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-center gap-4 rounded-xl border border-white/30 bg-white/60 backdrop-blur-sm p-4 hover:bg-white/70 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => onMarkComplete(hw)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-50 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 truncate text-sm">
                  {hw.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{hw.subject}</span>
                  <span className="text-slate-200">·</span>
                  <span
                    className={`text-xs font-medium ${
                      timeLeft.urgent ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    {timeLeft.urgent && (
                      <AlertTriangle className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                    )}
                    {timeLeft.text}
                  </span>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`${priorityStyles[hw.priority]} text-xs font-medium`}
              >
                {hw.priority}
              </Badge>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}