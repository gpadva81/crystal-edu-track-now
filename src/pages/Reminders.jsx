import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  Clock,
  Loader2,
  CheckCircle2,
  Send,
  AlertTriangle,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useStudent } from "../components/auth/StudentContext";

export default function Reminders() {
  const { currentStudent } = useStudent();
  const [sending, setSending] = useState({});
  const [sentAll, setSentAll] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["homework", currentStudent?.id],
    queryFn: () => base44.entities.Homework.filter({ student_id: currentStudent.id }, "-due_date"),
    enabled: !!currentStudent,
  });

  const upcoming = assignments
    .filter(
      (a) =>
        a.status !== "completed" &&
        moment(a.due_date).isAfter(moment()) &&
        moment(a.due_date).diff(moment(), "hours") <= 72
    )
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const overdue = assignments.filter(
    (a) =>
      a.status !== "completed" && moment(a.due_date).isBefore(moment())
  );

  const sendReminder = async (hw) => {
    setSending((prev) => ({ ...prev, [hw.id]: true }));
    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `📚 Reminder: ${hw.title} — ${hw.subject}`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b; font-size: 20px;">📚 Homework Reminder</h2>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; color: #334155; font-size: 16px;">${hw.title}</p>
            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">${hw.subject}</p>
            <p style="margin: 12px 0 0; color: #f59e0b; font-weight: 600; font-size: 14px;">
              Due: ${moment(hw.due_date).format("dddd, MMM D [at] h:mm A")}
            </p>
            ${hw.description ? `<p style="margin: 12px 0 0; color: #64748b; font-size: 14px;">${hw.description}</p>` : ""}
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Sent from StudyTrack</p>
        </div>
      `,
    });
    setSending((prev) => ({ ...prev, [hw.id]: false }));
    toast.success(`Reminder sent for "${hw.title}"`);
  };

  const sendAllReminders = async () => {
    setSentAll(true);
    const user = await base44.auth.me();
    const all = [...overdue, ...upcoming];

    const listHtml = all
      .map(
        (hw) =>
          `<li style="margin-bottom: 12px;">
            <strong>${hw.title}</strong> — ${hw.subject}<br/>
            <span style="color: ${moment(hw.due_date).isBefore(moment()) ? "#ef4444" : "#f59e0b"};">
              ${moment(hw.due_date).isBefore(moment()) ? "OVERDUE" : `Due ${moment(hw.due_date).fromNow()}`}
            </span>
          </li>`
      )
      .join("");

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `📋 StudyTrack: ${all.length} assignment${all.length !== 1 ? "s" : ""} need attention`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">📋 Assignment Summary</h2>
          <ul style="padding-left: 20px; color: #334155;">${listHtml}</ul>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Sent from StudyTrack</p>
        </div>
      `,
    });
    setSentAll(false);
    toast.success("Summary email sent!");
  };

  const ReminderCard = ({ hw }) => {
    const isOverdue = moment(hw.due_date).isBefore(moment());
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
          isOverdue
            ? "bg-rose-50/50 border-rose-100"
            : "bg-white border-slate-100"
        }`}
      >
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            isOverdue ? "bg-rose-100" : "bg-violet-50"
          }`}
        >
          {isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          ) : (
            <Clock className="h-5 w-5 text-violet-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-700 truncate">
            {hw.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400">{hw.subject}</span>
            <span className="text-slate-200">·</span>
            <span
              className={`text-xs font-medium ${
                isOverdue ? "text-rose-500" : "text-violet-500"
              }`}
            >
              {isOverdue ? "Overdue" : moment(hw.due_date).fromNow()}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendReminder(hw)}
          disabled={sending[hw.id]}
          className="shrink-0"
        >
          {sending[hw.id] ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Remind
            </>
          )}
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Reminders</h1>
          <p className="text-slate-400 text-sm mt-1">
            Send yourself email reminders for upcoming deadlines
          </p>
        </div>
        {(overdue.length > 0 || upcoming.length > 0) && (
          <Button
            onClick={sendAllReminders}
            disabled={sentAll}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
          >
            {sentAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Email All
          </Button>
        )}
      </div>

      {overdue.length > 0 && (
        <Card className="border-rose-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              Overdue ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((hw) => (
              <ReminderCard key={hw.id} hw={hw} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Bell className="h-4 w-4 text-violet-500" />
            Due Within 72 Hours ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                Nothing due soon!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You're all clear for the next 72 hours
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((hw) => (
                <ReminderCard key={hw.id} hw={hw} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}