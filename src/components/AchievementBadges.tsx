import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  achievements: Achievement;
}

export const AchievementBadges = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchAchievements = async () => {
      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (allAchievements) {
        setAchievements(allAchievements);
      }

      // Fetch user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at, achievements(*)")
        .eq("user_id", user.id);

      if (userAchievements) {
        const unlocked = new Set(userAchievements.map((ua: UserAchievement) => ua.achievement_id));
        setUnlockedAchievements(unlocked);
      }
    };

    fetchAchievements();

    // Subscribe to new achievements
    const channel = supabase
      .channel("user_achievements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newAchievementId = payload.new.achievement_id;
          setUnlockedAchievements((prev) => new Set([...prev, newAchievementId]));
          
          const achievement = achievements.find((a) => a.id === newAchievementId);
          if (achievement) {
            toast.success(`🎉 Achievement Unlocked: ${achievement.name}!`, {
              description: achievement.description,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, achievements]);

  if (!user) return null;

  return (
    <Card className="glass-card p-6 rounded-3xl">
      <h2 className="text-2xl font-bold text-foreground mb-4">🏆 Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.has(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`glass-card p-4 rounded-2xl text-center transition-all hover-scale ${
                isUnlocked ? "opacity-100" : "opacity-40 grayscale"
              }`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h3 className="font-semibold text-sm text-foreground">{achievement.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
              {isUnlocked && (
                <Badge variant="default" className="mt-2 text-xs">
                  Unlocked
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
