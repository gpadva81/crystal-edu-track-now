import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No invite token found in the URL.");
    }
  }, [token]);

  useEffect(() => {
    // If not authenticated, save the invite URL so AuthContext can redirect after login
    if (!isLoadingAuth && !isAuthenticated && token) {
      localStorage.setItem(
        "pendingInvite",
        `/accept-invite?token=${token}`
      );
    }
  }, [isLoadingAuth, isAuthenticated, token]);

  const handleAccept = async () => {
    setStatus("loading");
    try {
      await base44.rpc.acceptParentInvite(token);
      setStatus("success");
      // Clear any pending invite
      localStorage.removeItem("pendingInvite");
      // Navigate to dashboard after a short delay
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to accept invite.");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50/50 to-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Parent Collaboration Invite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-slate-500 text-center">
                You've been invited to collaborate on a student's profile.
                Please sign in or create an account to accept.
              </p>
              <div className="space-y-2">
                <Link to="/login" className="block">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="outline" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            </>
          ) : status === "success" ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium text-emerald-700">
                Invite accepted! You now have access to the student's profile.
              </p>
              <p className="text-xs text-slate-400">
                Redirecting to dashboard...
              </p>
            </div>
          ) : status === "error" ? (
            <div className="text-center space-y-3">
              <XCircle className="h-12 w-12 text-rose-400 mx-auto" />
              <p className="text-sm text-rose-600">{errorMsg}</p>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 text-center">
                You've been invited to collaborate on a student's profile. Click
                below to accept and gain access.
              </p>
              <Button
                onClick={handleAccept}
                disabled={status === "loading"}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Accept Invitation
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
