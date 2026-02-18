import React from "react";
import { useStudent } from "./StudentContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";

const avatarColors = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  pink: "bg-pink-100 text-pink-700",
};

export default function StudentSelector() {
  const { currentStudent, students, switchStudent, isParent } = useStudent();

  if (!isParent || students.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className={`h-6 w-6 rounded-full ${avatarColors[currentStudent?.avatar_color] || avatarColors.blue} flex items-center justify-center text-xs font-semibold`}>
            {currentStudent?.name?.[0]?.toUpperCase()}
          </div>
          <span className="font-medium">{currentStudent?.name}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {students.map((student) => (
          <DropdownMenuItem
            key={student.id}
            onClick={() => switchStudent(student.id)}
            className="gap-3"
          >
            <div className={`h-8 w-8 rounded-full ${avatarColors[student.avatar_color] || avatarColors.blue} flex items-center justify-center text-sm font-semibold`}>
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-xs text-slate-500">{student.grade} • {student.school}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}