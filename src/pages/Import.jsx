import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Info } from "lucide-react";
import { useStudent } from "../components/auth/StudentContext";

import SchoologyImport from "../components/import/SchoologyImport";

export default function Import() {
  const queryClient = useQueryClient();
  const { currentStudent } = useStudent();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Import Assignments
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Bring in your assignments from Schoology
        </p>
      </div>

      <SchoologyImport
        studentId={currentStudent?.id}
        onImportComplete={() =>
          queryClient.invalidateQueries({ queryKey: ["homework", currentStudent?.id] })
        }
      />

      <Card className="border-slate-100 shadow-sm bg-slate-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
            <Info className="h-4 w-4" />
            How to export from Schoology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-slate-500 space-y-2 list-decimal list-inside">
            <li>Log in to your Schoology account on your device</li>
            <li>Navigate to your "Upcoming" or overdue assignments page</li>
            <li>
              Take clear screenshots that show assignment names, due dates, 
              course names, and teacher information
            </li>
            <li>Upload all screenshots above — you can select multiple at once</li>
            <li>Our AI will extract all the details automatically!</li>
          </ol>
          <p className="text-xs text-slate-400 mt-4">
            💡 Tip: Make sure teacher names and emails are visible in the screenshots 
            for better organization. The AI can read multiple screenshots at once.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}