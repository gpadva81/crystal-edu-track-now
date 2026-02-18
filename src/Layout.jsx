import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Bell,
  FileSpreadsheet,
  Menu,
  X,
  GraduationCap,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentProvider, useStudent } from "./components/auth/StudentContext";
import StudentSelector from "./components/auth/StudentSelector";
import SetupFlow from "./components/auth/SetupFlow";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Classes", icon: BookOpen, page: "Classes" },
  { name: "Assignments", icon: BookOpen, page: "Assignments" },
  { name: "AI Tutor", icon: Sparkles, page: "Tutor" },
  { name: "Rewards", icon: GraduationCap, page: "Rewards" },
  { name: "Reminders", icon: Bell, page: "Reminders" },
  { name: "Import", icon: FileSpreadsheet, page: "Import" },
];

function LayoutContent({ children, currentPageName, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentStudent, isParent } = useStudent();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!currentStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <style>{`
        :root {
          --accent: #f59e0b;
          --accent-light: #fef3c7;
        }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-50"
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-slate-600" />
              ) : (
                <Menu className="h-5 w-5 text-slate-600" />
              )}
            </button>
            <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                <GraduationCap className="h-5 w-5 text-white relative z-10" />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-white"></div>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-800 via-amber-600 to-slate-800 bg-clip-text text-transparent tracking-tight hidden sm:block">
                StudyTrack
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? "text-amber-500" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <StudentSelector />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hidden sm:flex">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-700">{user?.full_name || "User"}</p>
                    <p className="text-[10px] text-slate-400">
                      {isParent ? "Parent Account" : "Student Account"}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold text-slate-700">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {isParent && currentStudent && (
                    <p className="text-xs text-amber-600 mt-1">
                      Viewing: {currentStudent.name}'s profile
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((item) => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? "text-amber-500" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const { user, isAuthenticated, isLoadingAuth, checkAppState } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user?.account_type) {
    return <SetupFlow user={user} onComplete={() => checkAppState()} />;
  }

  return (
    <StudentProvider>
      <LayoutContent children={children} currentPageName={currentPageName} user={user} />
    </StudentProvider>
  );
}