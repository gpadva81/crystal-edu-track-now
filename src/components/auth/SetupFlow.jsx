import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Plus, Trash2 } from "lucide-react";

export default function SetupFlow({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState("");
  const [studentData, setStudentData] = useState({
    name: "",
    grade: "",
    school: "",
  });
  const [children, setChildren] = useState([{ name: "", grade: "", school: "" }]);

  const handleStudentSetup = async () => {
    await base44.auth.updateMe({ account_type: "student" });
    await base44.entities.Student.create({
      ...studentData,
      student_user_id: user.id,
      avatar_color: "blue",
    });
    onComplete();
  };

  const handleParentSetup = async () => {
    await base44.auth.updateMe({ account_type: "parent" });
    for (const child of children.filter(c => c.name)) {
      await base44.entities.Student.create({
        ...child,
        parent_user_id: user.id,
        avatar_color: ["blue", "green", "purple", "orange", "pink"][Math.floor(Math.random() * 5)],
      });
    }
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to StudyTrack!</CardTitle>
            <p className="text-sm text-slate-500 mt-2">Let's set up your account</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => {
                setAccountType("student");
                setStep(2);
              }}
              className="w-full h-auto py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-base">I'm a Student</p>
                  <p className="text-xs text-blue-100">Track my own homework</p>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => {
                setAccountType("parent");
                setStep(2);
              }}
              className="w-full h-auto py-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-base">I'm a Parent</p>
                  <p className="text-xs text-purple-100">Manage my children's homework</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2 && accountType === "student") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Student Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStudentSetup();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input
                  value={studentData.grade}
                  onChange={(e) => setStudentData({ ...studentData, grade: e.target.value })}
                  placeholder="e.g. 10th Grade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>School</Label>
                <Input
                  value={studentData.school}
                  onChange={(e) => setStudentData({ ...studentData, school: e.target.value })}
                  placeholder="School name"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600">
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2 && accountType === "parent") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Add Your Children</CardTitle>
            <p className="text-sm text-slate-500">You can add more later</p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleParentSetup();
              }}
              className="space-y-4"
            >
              {children.map((child, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
                  {children.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setChildren(children.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  )}
                  <Input
                    value={child.name}
                    onChange={(e) => {
                      const updated = [...children];
                      updated[idx].name = e.target.value;
                      setChildren(updated);
                    }}
                    placeholder="Child's name"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={child.grade}
                      onChange={(e) => {
                        const updated = [...children];
                        updated[idx].grade = e.target.value;
                        setChildren(updated);
                      }}
                      placeholder="Grade"
                      required
                    />
                    <Input
                      value={child.school}
                      onChange={(e) => {
                        const updated = [...children];
                        updated[idx].school = e.target.value;
                        setChildren(updated);
                      }}
                      placeholder="School"
                      required
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setChildren([...children, { name: "", grade: "", school: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Child
              </Button>
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600">
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
}