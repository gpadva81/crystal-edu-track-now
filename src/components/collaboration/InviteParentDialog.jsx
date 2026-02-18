import React, { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useStudent } from "@/components/auth/StudentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  Copy,
  Check,
  Loader2,
  XCircle,
  UserPlus,
} from "lucide-react";

export default function InviteParentDialog({ open, onOpenChange }) {
  const { currentStudent } = useStudent();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    if (open && currentStudent) {
      loadInvites();
    }
  }, [open, currentStudent]);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ParentInvite.filter(
        { student_id: currentStudent.id },
        "-created_date"
      );
      setInvites(data);
    } catch (err) {
      console.error("Failed to load invites:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    setGenerating(true);
    try {
      const invite = await base44.entities.ParentInvite.create({
        student_id: currentStudent.id,
        invited_by: currentStudent.parent_user_id,
      });
      setInvites((prev) => [invite, ...prev]);
    } catch (err) {
      console.error("Failed to generate invite:", err);
    } finally {
      setGenerating(false);
    }
  };

  const revokeInvite = async (inviteId) => {
    try {
      await base44.entities.ParentInvite.update(inviteId, {
        status: "revoked",
      });
      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === inviteId ? { ...inv, status: "revoked" } : inv
        )
      );
    } catch (err) {
      console.error("Failed to revoke invite:", err);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const statusBadge = (status) => {
    const styles = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
      revoked: "bg-slate-50 text-slate-500 border-slate-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[status]}`}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-500" />
            Invite a Parent
          </DialogTitle>
          <DialogDescription>
            Generate a shareable link so another parent can collaborate on{" "}
            <span className="font-medium text-slate-700">
              {currentStudent?.name}
            </span>
            's profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={generateInvite}
            disabled={generating}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Generate Invite Link
          </Button>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : invites.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Invite History
              </p>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {statusBadge(inv.status)}
                    <span className="text-xs text-slate-400 truncate">
                      {new Date(inv.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {inv.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(inv.token)}
                          className="h-7 px-2 text-xs"
                        >
                          {copiedToken === inv.token ? (
                            <Check className="h-3 w-3 mr-1 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedToken === inv.token ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvite(inv.id)}
                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-2">
              No invites yet. Generate one above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
