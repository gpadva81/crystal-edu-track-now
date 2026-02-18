import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Target, Zap, Star, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/supabaseClient";
import { useStudent } from "../auth/StudentContext";
import moment from "moment";

export default function GamificationCard({ assignments }) {
  const { currentStudent } = useStudent();
  const queryClient = useQueryClient();

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", currentStudent?.id],
    queryFn: () => base44.entities.Achievement.filter({ student_id: currentStudent.id }),
    enabled: !!currentStudent,
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Achievement.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["achievements", currentStudent?.id] }),
  });

  const completed = assignments.filter((a) => a.status === "completed");
  const completedToday = completed.filter((a) => 
    moment(a.updated_date).isSame(moment(), "day")
  );
  const completedThisWeek = completed.filter((a) =>
    moment(a.updated_date).isSame(moment(), "week")
  );

  // Calculate streak (consecutive days with completed assignments)
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
  const points = completed.length * 10;
  const level = Math.floor(points / 100) + 1;

  const badges = [
    { 
      name: "Beginner", 
      icon: Star, 
      requirement: 5, 
      unlocked: completed.length >= 5,
      color: "bg-slate-100 text-slate-600"
    },
    { 
      name: "Dedicated", 
      icon: Target, 
      requirement: 20, 
      unlocked: completed.length >= 20,
      color: "bg-blue-100 text-blue-600"
    },
    { 
      name: "On Fire", 
      icon: Flame, 
      requirement: 3, 
      unlocked: streak >= 3,
      color: "bg-orange-100 text-orange-600"
    },
    { 
      name: "Champion", 
      icon: Trophy, 
      requirement: 50, 
      unlocked: completed.length >= 50,
      color: "bg-amber-100 text-amber-600"
    },
  ];

  // Auto-unlock achievements
  useEffect(() => {
    badges.forEach(badge => {
      const achievement = achievements.find(a => a.name === badge.name);
      if (badge.unlocked && achievement && !achievement.unlocked) {
        unlockMutation.mutate({
          id: achievement.id,
          data: { unlocked: true, unlocked_date: new Date().toISOString() }
        });
      }
    });
  }, [badges, achievements]);

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{points}</div>
            <div className="text-xs text-amber-600">Points</div>
          </div>

          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700">Lvl {level}</div>
            <div className="text-xs text-purple-600">Level</div>
          </div>

          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{streak}</div>
            <div className="text-xs text-orange-600">Day Streak</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-3">This Week</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Today</div>
              <div className="text-lg font-bold text-slate-800">{completedToday.length}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">This Week</div>
              <div className="text-lg font-bold text-slate-800">{completedThisWeek.length}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-3">Achievements</div>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badge) => {
              const Icon = badge.icon;
              const achievement = achievements.find(a => a.name === badge.name);
              const hasReward = achievement?.reward;
              
              return (
                <div
                  key={badge.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    badge.unlocked
                      ? `${badge.color} border-transparent shadow-sm`
                      : "bg-slate-50 text-slate-300 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`h-4 w-4 ${badge.unlocked ? "" : "opacity-30"}`} />
                    {badge.unlocked && hasReward && (
                      <Gift className="h-3 w-3 text-amber-600" />
                    )}
                  </div>
                  <div className={`text-xs font-semibold ${badge.unlocked ? "" : "text-slate-400"}`}>
                    {badge.name}
                  </div>
                  {!badge.unlocked && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      {badge.requirement} needed
                    </div>
                  )}
                  {badge.unlocked && hasReward && (
                    <div className="text-[9px] text-amber-600 mt-1 truncate">
                      🎁 {achievement.reward}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}