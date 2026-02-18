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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  MessageCircle,
  Sparkles,
  Trash2,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudent } from "../components/auth/StudentContext";
import { useEffect } from "react";

import TutorChat from "../components/tutor/TutorChat";
import { tutorPersonalities } from "../components/tutor/tutorPersonalities";

const SUBJECTS = [
  "Math",
  "English",
  "Science",
  "History",
  "Art",
  "Computer Science",
  "Foreign Language",
  "Other",
];

export default function Tutor() {
  const [activeConvo, setActiveConvo] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("alex");
  const queryClient = useQueryClient();
  const { currentStudent } = useStudent();

  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get("conversationId");

  const { data: conversations = [] } = useQuery({
    queryKey: ["tutorConvos", currentStudent?.id],
    queryFn: () => base44.entities.TutorConversation.filter({ student_id: currentStudent.id }, "-created_date"),
    enabled: !!currentStudent,
  });

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const convo = conversations.find(c => c.id === conversationIdFromUrl);
      if (convo) {
        setActiveConvo(convo);
      }
    }
  }, [conversationIdFromUrl, conversations]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TutorConversation.create({ ...data, student_id: currentStudent.id }),
    onSuccess: (newConvo) => {
      queryClient.invalidateQueries({ queryKey: ["tutorConvos", currentStudent?.id] });
      setActiveConvo(newConvo);
      setShowNew(false);
      setNewTitle("");
      setNewSubject("");
      setSelectedTutor("alex");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TutorConversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorConvos", currentStudent?.id] });
      if (activeConvo) setActiveConvo(null);
    },
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Button
            onClick={() => setShowNew(true)}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Start a tutoring session
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  activeConvo?.id === c.id
                    ? "bg-violet-50 border border-violet-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
                onClick={() => setActiveConvo(c)}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeConvo?.id === c.id
                      ? "bg-violet-100"
                      : "bg-slate-100"
                  }`}
                >
                  <MessageCircle
                    className={`h-4 w-4 ${
                      activeConvo?.id === c.id
                        ? "text-violet-600"
                        : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {c.title}
                  </p>
                  {c.subject && (
                    <p className="text-[10px] text-slate-400">{c.subject}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition h-6 w-6 flex items-center justify-center rounded hover:bg-rose-50"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        {activeConvo ? (
          <TutorChat
            conversation={activeConvo}
            studentGrade={currentStudent?.grade}
            onUpdate={(updated) => {
              setActiveConvo(updated);
              queryClient.invalidateQueries({ queryKey: ["tutorConvos", currentStudent?.id] });
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">AI Homework Tutor</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Get step-by-step help with any subject. Start a new chat to ask
              your questions!
            </p>
            <Button
              onClick={() => setShowNew(true)}
              className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start Tutoring Session
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Tutoring Session</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({
                title: newTitle,
                subject: newSubject,
                tutor_id: selectedTutor,
                messages: [],
              });
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Topic
              </Label>
              <Input
                placeholder="e.g. Quadratic Equations"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subject
              </Label>
              <Select value={newSubject} onValueChange={setNewSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Choose Your Tutor
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(tutorPersonalities).map((tutor) => (
                  <button
                    key={tutor.id}
                    type="button"
                    onClick={() => setSelectedTutor(tutor.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedTutor === tutor.id
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={tutor.photo}
                      alt={tutor.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-700">{tutor.name}</div>
                      <div className="text-[10px] text-slate-500">{tutor.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              >
                Start Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}