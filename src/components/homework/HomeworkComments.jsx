import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { base44 } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Trash2, MessageSquare } from "lucide-react";
import moment from "moment";

export default function HomeworkComments({ homeworkId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const queryKey = ["homework-comments", homeworkId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework_comment")
        .select("*, profiles:user_id(full_name, account_type)")
        .eq("homework_id", homeworkId)
        .order("created_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (content) => {
      return base44.entities.HomeworkComment.create({
        homework_id: homeworkId,
        user_id: user.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      return base44.entities.HomeworkComment.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const accountBadge = (type) => {
    if (type === "parent")
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-amber-50 text-amber-600 border-amber-200"
        >
          Parent
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-[10px] bg-blue-50 text-blue-600 border-blue-200"
      >
        Student
      </Badge>
    );
  };

  return (
    <div className="border-t border-slate-100 pt-3">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-xs text-slate-400">({comments.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-2 p-2 rounded-lg bg-slate-50/80 group"
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-600">
                  {c.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700">
                    {c.profiles?.full_name || "Unknown"}
                  </span>
                  {accountBadge(c.profiles?.account_type)}
                  <span className="text-[10px] text-slate-400">
                    {moment(c.created_date).fromNow()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5 break-words whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
              {c.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(c.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-3">
          No comments yet. Start the conversation below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={1}
          className="flex-1 min-h-[36px] max-h-20 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newComment.trim() || addMutation.isPending}
          className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-white shrink-0"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}
