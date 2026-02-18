import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, MoreVertical, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function ClassCard({ classData, homeworkCount, onEdit, onDelete }) {
  const navigate = useNavigate();
  
  const colors = {
    blue: "bg-blue-100 border-blue-200",
    green: "bg-emerald-100 border-emerald-200",
    purple: "bg-purple-100 border-purple-200",
    orange: "bg-orange-100 border-orange-200",
    pink: "bg-pink-100 border-pink-200",
    red: "bg-rose-100 border-rose-200",
  };

  const emailTeacher = async () => {
    if (!classData.teacher_email) {
      toast.error("No email address for this teacher");
      return;
    }
    window.location.href = `mailto:${classData.teacher_email}`;
  };

  return (
    <Card 
      className={`${colors[classData.color] || "bg-white"} border hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer`}
      onClick={() => navigate(createPageUrl(`ClassDetails?classId=${classData.id}`))}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-800">{classData.name}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                {classData.schedule && (
                  <p className="text-xs text-slate-500">{classData.schedule}</p>
                )}
                {classData.current_grade && (
                  <>
                    {classData.schedule && <span className="text-slate-300">•</span>}
                    <span className="text-xs font-semibold text-emerald-600">
                      {classData.current_grade}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(classData);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDelete(classData.id);
              }}>
                <Trash2 className="h-4 w-4 mr-2 text-rose-500" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {classData.teacher_name && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">{classData.teacher_name}</p>
            <div className="flex gap-2">
              {classData.teacher_email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    emailTeacher();
                  }}
                  className="text-xs h-7"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              )}
              {classData.teacher_phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${classData.teacher_phone}`;
                  }}
                  className="text-xs h-7"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
          <span className="text-xs text-slate-500">Assignments</span>
          <Badge variant="secondary" className="bg-white/60">
            {homeworkCount || 0}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}