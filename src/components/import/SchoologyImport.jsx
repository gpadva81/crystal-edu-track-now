import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SchoologyImport({ studentId, onImportComplete }) {
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (files.length === 0) return;
    setImporting(true);
    setResult(null);

    const fileUrls = await Promise.all(
      files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );

    let extracted;
    try {
      extracted = await base44.integrations.Core.InvokeLLM({
        model: "gpt-4o",
        prompt: `Analyze these Schoology screenshot(s) and extract EVERY homework assignment visible. For each assignment provide:
- title: the assignment name
- class_name: the course/class name
- subject: the academic subject
- description: any instructions or details visible
- due_date: in ISO format (YYYY-MM-DD), assume year 2026 if not shown
- teacher_name: instructor name if visible
- teacher_email: instructor email if visible
- priority: "low", "medium", or "high" based on due date urgency

Extract ALL assignments you can see across all images. If you see even partial information, include it with what you have.`,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                 title: { type: "string" },
                 class_name: { type: "string" },
                 subject: { type: "string" },
                 description: { type: "string" },
                 due_date: { type: "string" },
                 teacher_name: { type: "string" },
                 teacher_email: { type: "string" },
                 priority: { type: "string", enum: ["low", "medium", "high"] },
                },
              },
            },
          },
        },
      });
    } catch (err) {
      console.error("Import InvokeLLM error:", err);
      setResult({ success: false, error: err.message || "AI extraction failed" });
      setImporting(false);
      return;
    }

    console.log("Import AI response:", extracted);

    // Handle cases where extracted is a string (failed JSON parse)
    if (typeof extracted === "string") {
      setResult({ success: false, error: "AI returned text instead of structured data. Please try again." });
      setImporting(false);
      return;
    }

    if (extracted?.assignments && extracted.assignments.length > 0) {
      // Get existing classes for this student
      const existingClasses = await base44.entities.Class.filter({ student_id: studentId });
      const existingClassNames = new Set(existingClasses.map(c => c.name?.toLowerCase()));

      // Extract unique class names and teachers from assignments
      const classData = new Map();
      extracted.assignments.forEach(a => {
        if (a.class_name && !existingClassNames.has(a.class_name.toLowerCase())) {
          classData.set(a.class_name.toLowerCase(), {
            name: a.class_name,
            subject: a.subject || "General",
            teacher_name: a.teacher_name,
            teacher_email: a.teacher_email,
            student_id: studentId,
            color: ["blue", "green", "purple", "orange", "pink"][Math.floor(Math.random() * 5)],
          });
        }
      });

      // Create new classes
      if (classData.size > 0) {
        await base44.entities.Class.bulkCreate(Array.from(classData.values()));
      }

      // Refresh classes to get IDs
      const allClasses = await base44.entities.Class.filter({ student_id: studentId });
      const classNameToId = new Map(allClasses.map(c => [c.name?.toLowerCase(), c.id]));

      // Get existing assignments to detect duplicates
      const existingAssignments = await base44.entities.Homework.filter({ student_id: studentId });
      const existingSet = new Set(
        existingAssignments.map(a => `${a.title?.toLowerCase()}|${a.due_date}`)
      );

      const assignments = extracted.assignments
        .map((a) => ({
          ...a,
          student_id: studentId,
          class_id: a.class_name ? classNameToId.get(a.class_name.toLowerCase()) : undefined,
          status: "todo",
          source: "schoology_import",
          priority: a.priority || "medium",
        }))
        .filter(a => !existingSet.has(`${a.title?.toLowerCase()}|${a.due_date}`));

      const duplicateCount = extracted.assignments.length - assignments.length;

      if (assignments.length > 0) {
        await base44.entities.Homework.bulkCreate(assignments);
      }

      setResult({ 
        success: true, 
        count: assignments.length, 
        classesCreated: classData.size,
        duplicatesSkipped: duplicateCount
      });
      onImportComplete();
    } else {
      setResult({ success: false, error: "No assignments found in screenshots" });
    }

    setImporting(false);
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-violet-500" />
          </div>
          Import from Schoology
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Take screenshots of your Schoology homework (including teacher info if visible), 
          then upload them here. We'll use AI to extract assignments, courses, and teacher details.
        </p>

        <div 
          className="rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-300 transition-colors bg-slate-50/50 p-8"
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (droppedFiles.length > 0) {
              setFiles(droppedFiles);
              setResult(null);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-violet-400', 'bg-violet-50/30');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-violet-400', 'bg-violet-50/30');
          }}
        >
          <div className="flex flex-col items-center text-center">
            <Upload className="h-8 w-8 text-slate-300 mb-3" />
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition">
                Drag & drop or click to upload
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  setFiles(Array.from(e.target.files));
                  setResult(null);
                }}
              />
            </label>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG, or multiple images
            </p>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {files.map((f, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="bg-white text-slate-600"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    {f.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={files.length === 0 || importing}
          className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing screenshots...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Extract Assignments
            </>
          )}
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 flex items-start gap-3 ${
              result.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-rose-50 border border-rose-200"
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Import successful!
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {result.count} assignment{result.count !== 1 ? "s" : ""} imported
                    {result.classesCreated > 0 && ` • ${result.classesCreated} class${result.classesCreated !== 1 ? "es" : ""} created`}
                    {result.duplicatesSkipped > 0 && ` • ${result.duplicatesSkipped} duplicate${result.duplicatesSkipped !== 1 ? "s" : ""} skipped`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-700">
                    Import failed
                  </p>
                  <p className="text-xs text-rose-600 mt-0.5">{result.error}</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}