import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/localClient";
import { useStudent } from "../components/auth/StudentContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Plus,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import moment from "moment";
import HomeworkTable from "../components/homework/HomeworkTable";
import HomeworkForm from "../components/homework/HomeworkForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ClassDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const classId = urlParams.get("classId");
  const { currentStudent } = useStudent();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editingGrade, setEditingGrade] = useState(false);
  const [gradeValue, setGradeValue] = useState("");
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  const { data: classData } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const classes = await base44.entities.Class.filter({ id: classId });
      return classes[0];
    },
    enabled: !!classId,
  });

  const { data: homework = [] } = useQuery({
    queryKey: ["homework", classId, currentStudent?.id],
    queryFn: () =>
      base44.entities.Homework.filter(
        { student_id: currentStudent.id, class_id: classId },
        "-due_date"
      ),
    enabled: !!classId && !!currentStudent,
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      setEditingGrade(false);
      toast.success("Grade updated");
    },
  });

  const createHomeworkMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Homework.create({
        ...data,
        student_id: currentStudent.id,
        class_id: classId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", classId, currentStudent?.id] });
      setShowHomeworkForm(false);
    },
  });

  const updateHomeworkMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Homework.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", classId, currentStudent?.id] });
    },
  });

  const deleteHomeworkMutation = useMutation({
    mutationFn: (id) => base44.entities.Homework.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", classId, currentStudent?.id] });
    },
  });

  const saveGrade = () => {
    updateClassMutation.mutate({
      id: classId,
      data: { current_grade: gradeValue },
    });
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
          subject: hw.subject || classData?.subject || "General",
          messages: [],
        });

        await updateHomeworkMutation.mutateAsync({
          id: hw.id,
          data: { tutor_conversation_id: conversation.id },
        });

        navigate(createPageUrl(`Tutor?conversationId=${conversation.id}`));
      }
    } catch (error) {
      toast.error("Failed to open tutor");
    }
  };

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
      `,
    });
    toast.success("Reminder sent to your email!");
  };

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const colors = {
    blue: "from-blue-400 to-blue-500",
    green: "from-emerald-400 to-emerald-500",
    purple: "from-purple-400 to-purple-500",
    orange: "from-orange-400 to-orange-500",
    pink: "from-pink-400 to-pink-500",
    red: "from-rose-400 to-rose-500",
  };

  const completed = homework.filter((h) => h.status === "completed").length;
  const active = homework.filter((h) => h.status !== "completed").length;
  const overdue = homework.filter(
    (h) => h.status !== "completed" && moment(h.due_date).isBefore(moment())
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Classes")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div
          className={`h-14 w-14 rounded-xl bg-gradient-to-br ${colors[classData.color] || "from-slate-400 to-slate-500"} flex items-center justify-center shadow-md`}
        >
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">{classData.name}</h1>
          {classData.subject && (
            <p className="text-slate-500 mt-1">{classData.subject}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {classData.teacher_name && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Teacher</p>
                  <p className="text-sm font-medium text-slate-700">
                    {classData.teacher_name}
                  </p>
                </div>
              )}
              {classData.schedule && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Schedule</p>
                  <p className="text-sm font-medium text-slate-700">
                    {classData.schedule}
                  </p>
                </div>
              )}
              {classData.room_number && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Room</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {classData.room_number}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Current Grade</p>
                  {!editingGrade ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        setGradeValue(classData.current_grade || "");
                        setEditingGrade(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={saveGrade}
                      >
                        <Save className="h-3 w-3 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setEditingGrade(false)}
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                  )}
                </div>
                {editingGrade ? (
                  <Input
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    placeholder="e.g., A, 95%"
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm font-semibold text-emerald-600">
                    {classData.current_grade || "Not set"}
                  </p>
                )}
              </div>
            </div>

            {(classData.teacher_email || classData.teacher_phone) && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Contact Teacher</p>
                <div className="flex gap-2">
                  {classData.teacher_email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `mailto:${classData.teacher_email}`)
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                  {classData.teacher_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `tel:${classData.teacher_phone}`)
                      }
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              <Badge variant="secondary">{homework.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Active</span>
              <Badge className="bg-amber-100 text-amber-700">{active}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Completed</span>
              <Badge className="bg-emerald-100 text-emerald-700">
                {completed}
              </Badge>
            </div>
            {overdue > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Overdue</span>
                <Badge className="bg-rose-100 text-rose-700">{overdue}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assignments</CardTitle>
            <Button
              onClick={() => {
                setEditingHomework(null);
                setShowHomeworkForm(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No assignments yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Add your first assignment to get started
              </p>
            </div>
          ) : (
            <HomeworkTable
              assignments={homework}
              classes={[classData]}
              onStatusChange={(hw, status) =>
                updateHomeworkMutation.mutate({ id: hw.id, data: { status } })
              }
              onEdit={(hw) => {
                setEditingHomework(hw);
                setShowHomeworkForm(true);
              }}
              onDelete={(hw) => deleteHomeworkMutation.mutate(hw.id)}
              onSendReminder={sendReminder}
              onOpenTutor={openTutor}
            />
          )}
        </CardContent>
      </Card>

      <HomeworkForm
        open={showHomeworkForm}
        onOpenChange={setShowHomeworkForm}
        editingHomework={editingHomework}
        classes={[classData]}
        onSubmit={(data) => {
          if (editingHomework) {
            updateHomeworkMutation.mutate({ id: editingHomework.id, data });
          } else {
            createHomeworkMutation.mutate(data);
          }
          setShowHomeworkForm(false);
          setEditingHomework(null);
        }}
      />
    </div>
  );
}