import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Sparkles, User, Bot, Paperclip, X, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { getTutorPersonality, tutorPersonalities } from "./tutorPersonalities";

export default function TutorChat({ conversation, onUpdate, studentGrade }) {
  const [selectedTutorId, setSelectedTutorId] = useState(conversation?.tutor_id || "alex");
  const tutor = getTutorPersonality(selectedTutorId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem("tutorModel") || "gpt-4o");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const messages = conversation?.messages || [];
  const [learningProfile, setLearningProfile] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);

  const starterPrompts = [
    "I'm stuck on this problem. Can you help me understand it?",
    "Can you explain this concept in simpler terms?",
    "I don't know where to start. What should I think about first?",
    "Can you help me check if my approach is correct?"
  ];

  const handleModelChange = (model) => {
    setSelectedModel(model);
    localStorage.setItem("tutorModel", model);
  };

  const handleTutorChange = async (tutorId) => {
    setSelectedTutorId(tutorId);
    await base44.entities.TutorConversation.update(conversation.id, {
      tutor_id: tutorId,
    });
    onUpdate({ ...conversation, tutor_id: tutorId });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, name: file.name, type: file.type };
        })
      );
      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
    } catch (error) {
      console.error("File upload failed:", error);
    }
    setUploading(false);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversation?.id) {
      setSelectedTutorId(conversation.tutor_id || "alex");
      loadStudentContext();
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation && messages.length === 0 && !initializing && learningProfile) {
      initializeConversation();
    }
  }, [conversation?.id, messages.length, learningProfile?.id]);

  const loadStudentContext = async () => {
    if (!conversation?.student_id) return;

    // Load or create learning profile
    const profiles = await base44.entities.StudentLearningProfile.filter({
      student_id: conversation.student_id,
    });

    if (profiles.length === 0) {
      const newProfile = await base44.entities.StudentLearningProfile.create({
        student_id: conversation.student_id,
        learning_style_notes: "",
        strengths: [],
        areas_for_growth: [],
        preferred_explanation_style: "",
        common_misconceptions: [],
        motivation_factors: "",
        tutor_handoff_notes: "New student - getting to know their learning style.",
      });
      setLearningProfile(newProfile);
    } else {
      setLearningProfile(profiles[0]);
    }

    // Load recent conversation history (last 5 conversations)
    const allConversations = await base44.entities.TutorConversation.filter(
      { student_id: conversation.student_id },
      "-created_date",
      6
    );
    setRecentConversations(
      allConversations.filter((c) => c.id !== conversation.id).slice(0, 5)
    );
  };

  const initializeConversation = async () => {
    setInitializing(true);
    
    const gradeContext = studentGrade 
      ? `The student is in ${studentGrade} grade. Adjust your language and explanations to be appropriate for their reading and comprehension level.`
      : "";

    const recentContext = recentConversations.length > 0
      ? `\n\nRECENT CONVERSATION HISTORY (for context):\n${recentConversations
          .map(
            (c) =>
              `- ${c.title} (${c.subject || "General"}): ${
                c.messages?.length || 0
              } messages with ${getTutorPersonality(c.tutor_id).name}`
          )
          .join("\n")}`
      : "";

    const profileContext = learningProfile
      ? `\n\nSTUDENT LEARNING PROFILE (shared by all tutors):\n${
          learningProfile.learning_style_notes
            ? `Learning Style: ${learningProfile.learning_style_notes}\n`
            : ""
        }${
          learningProfile.strengths?.length > 0
            ? `Strengths: ${learningProfile.strengths.join(", ")}\n`
            : ""
        }${
          learningProfile.areas_for_growth?.length > 0
            ? `Working On: ${learningProfile.areas_for_growth.join(", ")}\n`
            : ""
        }${
          learningProfile.preferred_explanation_style
            ? `Prefers: ${learningProfile.preferred_explanation_style}\n`
            : ""
        }${
          learningProfile.tutor_handoff_notes
            ? `Team Notes: ${learningProfile.tutor_handoff_notes}`
            : ""
        }`
      : "";

    const initialPrompt = await base44.integrations.Core.InvokeLLM({
      model: selectedModel,
      prompt: `You are ${tutor.name}, a tutor with this personality: ${tutor.persona}

${gradeContext}${profileContext}${recentContext}

The student's homework topic is: "${conversation.title}".

Your role is to guide students through their thinking process, NOT to give them answers. Use the student profile to adapt your approach. Ask ONE engaging question to understand what they're working on and where they're stuck.

IMPORTANT: Never provide direct answers. Guide them with questions. Stay true to your personality. Keep it concise and warm (2-3 sentences max).`,
    });

    const assistantMsg = {
      role: "assistant",
      content: initialPrompt,
      timestamp: new Date().toISOString(),
    };

    await base44.entities.TutorConversation.update(conversation.id, {
      messages: [assistantMsg],
    });
    onUpdate({ ...conversation, messages: [assistantMsg] });
    setInitializing(false);
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;
    const userMsg = { role: "user", content: textToSend, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];

    setInput("");
    setLoading(true);
    setSuggestions([]);

    // Optimistic update
    onUpdate({ ...conversation, messages: updatedMessages });

    const subjectContext = conversation.subject
      ? `The student is studying ${conversation.subject}. `
      : "";

    const gradeContext = studentGrade 
      ? `The student is in ${studentGrade} grade. Use vocabulary, sentence structure, and explanations appropriate for their reading and comprehension level. `
      : "";

    const profileContext = learningProfile
      ? `\n\nSTUDENT PROFILE (shared by all tutors - update this as you learn):\n${
          learningProfile.learning_style_notes
            ? `Learning Style: ${learningProfile.learning_style_notes}\n`
            : ""
        }${
          learningProfile.strengths?.length > 0
            ? `Strengths: ${learningProfile.strengths.join(", ")}\n`
            : ""
        }${
          learningProfile.areas_for_growth?.length > 0
            ? `Working On: ${learningProfile.areas_for_growth.join(", ")}\n`
            : ""
        }${
          learningProfile.preferred_explanation_style
            ? `Prefers: ${learningProfile.preferred_explanation_style}\n`
            : ""
        }${
          learningProfile.common_misconceptions?.length > 0
            ? `Common Mistakes: ${learningProfile.common_misconceptions.join(", ")}\n`
            : ""
        }${
          learningProfile.tutor_handoff_notes
            ? `Team Notes: ${learningProfile.tutor_handoff_notes}`
            : ""
        }`
      : "";

    const response = await base44.integrations.Core.InvokeLLM({
      model: selectedModel,
      prompt: `You are ${tutor.name}, a tutor with this personality: ${tutor.persona}

${gradeContext}${subjectContext}${profileContext}

Previous conversation:
${updatedMessages
  .slice(-10)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

Student's message: ${textToSend}

CRITICAL - YOUR TEACHING PHILOSOPHY:
- NEVER give direct answers or do the work for them
- Use the Socratic method: ask guiding questions to help them think
- If they're stuck, break the problem into smaller steps with questions
- Encourage their thinking process and celebrate effort
- Keep responses SHORT (2-4 sentences)
- Be warm and supportive, but let THEM figure it out
- Stay true to your unique personality and teaching style
- ADAPT to their learning profile - use their strengths and address their challenges

Guide them with questions, not answers.

As you interact, if you notice insights about their learning style, update the profile_updates field.`,
      file_urls: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.url) : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "2-3 short follow-up questions or prompts to help the student continue learning"
          },
          profile_updates: {
            type: "object",
            description: "Updates to share with other tutors about this student (only include if you noticed something new)",
            properties: {
              learning_insight: { type: "string" },
              strength_observed: { type: "string" },
              area_to_work_on: { type: "string" },
              handoff_note: { type: "string" }
            }
          }
        }
      }
    });

    const assistantMsg = {
      role: "assistant",
      content: response.answer,
      timestamp: new Date().toISOString(),
    };

    setSuggestions(response.suggestions || []);

    // Update learning profile if tutor noticed something new
    if (response.profile_updates && learningProfile) {
      const updates = {};
      
      if (response.profile_updates.learning_insight) {
        updates.learning_style_notes = learningProfile.learning_style_notes
          ? `${learningProfile.learning_style_notes} | ${response.profile_updates.learning_insight}`
          : response.profile_updates.learning_insight;
      }
      
      if (response.profile_updates.strength_observed) {
        updates.strengths = [
          ...(learningProfile.strengths || []),
          response.profile_updates.strength_observed,
        ];
      }
      
      if (response.profile_updates.area_to_work_on) {
        updates.areas_for_growth = [
          ...(learningProfile.areas_for_growth || []),
          response.profile_updates.area_to_work_on,
        ];
      }
      
      if (response.profile_updates.handoff_note) {
        updates.tutor_handoff_notes = `[${tutor.name}]: ${response.profile_updates.handoff_note}`;
      }

      if (Object.keys(updates).length > 0) {
        const updatedProfile = await base44.entities.StudentLearningProfile.update(
          learningProfile.id,
          updates
        );
        setLearningProfile(updatedProfile);
      }
    }

    const finalMessages = [...updatedMessages, assistantMsg];
    await base44.entities.TutorConversation.update(conversation.id, {
      messages: finalMessages,
    });
    onUpdate({ ...conversation, messages: finalMessages });
    setLoading(false);
    setUploadedFiles([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">AI Model:</span>
          </div>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
              <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Tutor:</span>
          </div>
          <Select value={selectedTutorId} onValueChange={handleTutorChange}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(tutorPersonalities).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && initializing && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Getting ready...</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs">
              Preparing to help you with your homework
            </p>
          </div>
        )}
        {messages.length === 0 && !initializing && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Meet {tutor.name}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs font-medium">
              {tutor.description}
            </p>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mb-6">
              I'll guide you with questions to help you learn!
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                    document.querySelector('input[placeholder*="Ask a question"]')?.focus();
                  }}
                  className="px-4 py-2 rounded-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-sm text-slate-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <img 
                    src={tutor.photo}
                    alt={tutor.name}
                    className={`h-9 w-9 rounded-lg object-cover border-2 border-${tutor.color}-200`}
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-100 shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-base leading-7">{msg.content}</p>
                ) : (
                  <div>
                    <div className={`text-xs font-semibold text-${tutor.color}-600 mb-2`}>{tutor.name}</div>
                    <ReactMarkdown className="text-base prose prose-slate max-w-none [&>p]:mb-4 [&>p]:leading-7 [&>ul]:my-3 [&>ol]:my-3 [&>li]:mb-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="shrink-0">
              <img 
                src={tutor.photo}
                alt={tutor.name}
                className={`h-9 w-9 rounded-lg object-cover border-2 border-${tutor.color}-200`}
              />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span className="text-base text-slate-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {suggestions.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="h-9 w-9 shrink-0"></div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-slate-400">Continue the conversation:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(suggestion)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 hover:border-amber-300 text-sm text-amber-800 font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-4">
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs"
              >
                <ImageIcon className="h-3 w-3 text-amber-600" />
                <span className="text-amber-700 max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            className="shrink-0"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your homework..."
            className="border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm px-4 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}