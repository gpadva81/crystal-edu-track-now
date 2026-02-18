import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { base44 } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useStudent } from "@/components/auth/StudentContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Users,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Trash2,
  Shield,
  UserMinus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API Key Tab
// ---------------------------------------------------------------------------
function ApiKeySection() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    try {
      const result = await base44.rpc.getApiKey();
      setApiKey(result.api_key || "");
    } catch (err) {
      console.error("Failed to load API key:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await base44.rpc.updateApiKey(apiKey.trim() || null);
      setSaved(true);
      toast({ title: "API key saved", description: "Your API key has been updated." });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 8) + "\u2022".repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4)
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Key className="h-4 w-4 text-amber-500" />
          API Key
        </CardTitle>
        <p className="text-sm text-slate-500">
          Store your unique API key for AI-powered features. This key is private to your account.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">Your API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {apiKey && !showKey && (
                <p className="text-xs text-slate-400 font-mono">{maskedKey}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : saved ? (
                  <Check className="h-4 w-4 mr-2 text-white" />
                ) : null}
                {saved ? "Saved" : "Save API Key"}
              </Button>
              {apiKey && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setApiKey("");
                    // immediately save the removal
                    base44.rpc.updateApiKey(null).then(() => {
                      toast({ title: "API key removed" });
                    });
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// User Management Tab
// ---------------------------------------------------------------------------
function UserManagementSection() {
  const { user } = useAuth();
  const { students, refreshStudents } = useStudent();
  const [linkedUsers, setLinkedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (students.length > 0) {
      loadLinkedUsers();
    } else {
      setLoading(false);
    }
  }, [students]);

  const loadLinkedUsers = async () => {
    setLoading(true);
    try {
      const result = {};
      for (const student of students) {
        // Fetch all parent links for this student
        const links = await base44.entities.StudentParent.filter({
          student_id: student.id,
        });

        // Fetch profile info for each linked parent
        const enriched = [];
        for (const link of links) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, account_type")
            .eq("id", link.parent_user_id)
            .single();

          enriched.push({
            ...link,
            full_name: profile?.full_name || "Unknown",
            account_type: profile?.account_type || "parent",
            isOwner: link.role === "owner",
            isSelf: link.parent_user_id === user.id,
          });
        }

        // Also include the student user themselves if they exist
        if (student.student_user_id) {
          const { data: studentProfile } = await supabase
            .from("profiles")
            .select("full_name, account_type")
            .eq("id", student.student_user_id)
            .single();

          if (studentProfile) {
            enriched.unshift({
              id: null,
              parent_user_id: student.student_user_id,
              full_name: studentProfile.full_name || student.name,
              account_type: "student",
              role: "student",
              isOwner: false,
              isSelf: student.student_user_id === user.id,
              isStudentUser: true,
            });
          }
        }

        result[student.id] = enriched;
      }
      setLinkedUsers(result);
    } catch (err) {
      console.error("Failed to load linked users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await base44.rpc.removeStudentParent(removeTarget.id);
      toast({
        title: "User removed",
        description: `${removeTarget.full_name} has been removed.`,
      });
      setRemoveTarget(null);
      await loadLinkedUsers();
      await refreshStudents();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const roleBadge = (link) => {
    if (link.role === "student") {
      return (
        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
          Student
        </Badge>
      );
    }
    if (link.role === "owner") {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
          Owner
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
        Collaborator
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-amber-500" />
            Linked Users
          </CardTitle>
          <p className="text-sm text-slate-500">
            Manage parents and students linked to each child's profile. Use the Invite button in the
            header to add new collaborators.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No student profiles found.
            </p>
          ) : (
            <div className="space-y-6">
              {students.map((student) => (
                <div key={student.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-xs font-semibold text-amber-700">
                      {student.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{student.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {student.grade} {student.school ? `\u00b7 ${student.school}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 ml-9">
                    {(linkedUsers[student.id] || []).map((link, idx) => (
                      <div
                        key={link.id || `student-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-slate-600">
                              {link.full_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {link.full_name}
                            {link.isSelf && (
                              <span className="text-xs text-slate-400 ml-1">(you)</span>
                            )}
                          </span>
                          {roleBadge(link)}
                        </div>

                        {/* Only show remove for collaborators the owner can remove */}
                        {!link.isStudentUser &&
                          !link.isSelf &&
                          link.role === "collaborator" &&
                          student.parent_user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveTarget(link)}
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                      </div>
                    ))}

                    {(!linkedUsers[student.id] || linkedUsers[student.id].length === 0) && (
                      <p className="text-xs text-slate-400 py-2">No linked users found.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove collaborator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{removeTarget?.full_name}</span> from
              this student's profile. They will lose access to all related data. This action can be
              undone by sending a new invite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Change Password Tab
// ---------------------------------------------------------------------------
function ChangePasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await base44.auth.changePassword(newPassword);
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-amber-500" />
          Change Password
        </CardTitle>
        <p className="text-sm text-slate-500">
          Update your account password. You'll stay signed in after the change.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-rose-500">Passwords do not match</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={saving || !newPassword || !confirmPassword}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------
export default function Admin() {
  const { user } = useAuth();
  const { isParent } = useStudent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-500" />
          Admin Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your API key, linked users, and account security.
        </p>
      </div>

      <Tabs defaultValue="api-key" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="api-key" className="gap-1.5">
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">API Key</span>
            <span className="sm:hidden">Key</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Password</span>
            <span className="sm:hidden">Pass</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-key" className="mt-4">
          <ApiKeySection />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UserManagementSection />
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <ChangePasswordSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
