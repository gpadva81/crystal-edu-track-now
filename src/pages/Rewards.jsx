import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Flame, Gift, CheckCircle2, Lock } from "lucide-react";
import { useStudent } from "../components/auth/StudentContext";
import moment from "moment";

const achievementTypes = [
  { 
    name: "Beginner", 
    icon: Star, 
    description: "Complete 5 assignments",
    requirement: 5,
    type: "completed",
    color: "bg-slate-100 text-slate-600"
  },
  { 
    name: "Dedicated", 
    icon: Target, 
    description: "Complete 20 assignments",
    requirement: 20,
    type: "completed",
    color: "bg-blue-100 text-blue-600"
  },
  { 
    name: "On Fire", 
    icon: Flame, 
    description: "3 day streak",
    requirement: 3,
    type: "streak",
    color: "bg-orange-100 text-orange-600"
  },
  { 
    name: "Champion", 
    icon: Trophy, 
    description: "Complete 50 assignments",
    requirement: 50,
    type: "completed",
    color: "bg-amber-100 text-amber-600"
  },
];

export default function Rewards() {
  const { currentStudent, isParent } = useStudent();
  const queryClient = useQueryClient();
  const [editingReward, setEditingReward] = useState({});

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", currentStudent?.id],
    queryFn: () => base44.entities.Achievement.filter({ student_id: currentStudent.id }),
    enabled: !!currentStudent,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["homework", currentStudent?.id],
    queryFn: () => base44.entities.Homework.filter({ student_id: currentStudent.id }),
    enabled: !!currentStudent,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ name, reward }) => {
      const existing = achievements.find(a => a.name === name);
      if (existing) {
        return base44.entities.Achievement.update(existing.id, { reward });
      } else {
        return base44.entities.Achievement.create({
          student_id: currentStudent.id,
          name,
          reward,
          unlocked: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements", currentStudent?.id] });
      setEditingReward({});
    },
  });

  // Calculate progress
  const completed = assignments.filter((a) => a.status === "completed");
  
  const calculateStreak = () => {
    let streak = 0;
    let currentDate = moment();
    
    while (streak < 30) {
      const hasCompletedOnDay = completed.some((a) =>
        moment(a.updated_date).isSame(currentDate, "day")
      );
      
      if (hasCompletedOnDay) {
        streak++;
        currentDate = currentDate.subtract(1, "day");
      } else if (streak === 0 && currentDate.isSame(moment(), "day")) {
        currentDate = currentDate.subtract(1, "day");
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  const checkIfUnlocked = (achievement) => {
    if (achievement.type === "completed") {
      return completed.length >= achievement.requirement;
    } else if (achievement.type === "streak") {
      return streak >= achievement.requirement;
    }
    return false;
  };

  const getProgress = (achievement) => {
    if (achievement.type === "completed") {
      return Math.min(completed.length, achievement.requirement);
    } else if (achievement.type === "streak") {
      return Math.min(streak, achievement.requirement);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Rewards & Achievements
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isParent ? "Set rewards for achievements" : "Track your achievements and earn rewards"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievementTypes.map((achievement) => {
          const Icon = achievement.icon;
          const isUnlocked = checkIfUnlocked(achievement);
          const progress = getProgress(achievement);
          const savedAchievement = achievements.find(a => a.name === achievement.name);
          const reward = savedAchievement?.reward || "";
          const isEditing = editingReward[achievement.name];

          return (
            <Card
              key={achievement.name}
              className={`border-2 transition-all ${
                isUnlocked
                  ? "border-green-200 bg-green-50/50"
                  : "border-slate-100"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${achievement.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {achievement.name}
                        {isUnlocked && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      <p className="text-xs text-slate-500">{achievement.description}</p>
                    </div>
                  </div>
                  {!isUnlocked && <Lock className="h-4 w-4 text-slate-300" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{progress} / {achievement.requirement}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${isUnlocked ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${(progress / achievement.requirement) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reward */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-600">Reward</span>
                  </div>
                  {isParent && isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Ice cream, Movie night"
                        value={editingReward[achievement.name] || reward}
                        onChange={(e) =>
                          setEditingReward({ ...editingReward, [achievement.name]: e.target.value })
                        }
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          upsertMutation.mutate({
                            name: achievement.name,
                            reward: editingReward[achievement.name] || reward,
                          });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-700">
                        {reward || (
                          <span className="text-slate-400 italic">No reward set</span>
                        )}
                      </p>
                      {isParent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingReward({ ...editingReward, [achievement.name]: reward })}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {isUnlocked && reward && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    🎉 Reward Earned!
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}