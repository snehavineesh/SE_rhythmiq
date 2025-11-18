import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const XPBar = () => {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (!user) return;

    const fetchXP = async () => {
      const { data } = await supabase
        .from("user_xp")
        .select("xp, level")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setXp(data.xp);
        setLevel(data.level);
      }
    };

    fetchXP();

    // Subscribe to XP changes
    const channel = supabase
      .channel("user_xp_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_xp",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setXp(payload.new.xp);
            setLevel(payload.new.level);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const currentLevelXP = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = (currentLevelXP / xpNeeded) * 100;

  return (
    <div className="glass-card p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-pink">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Level {level}</h3>
            <p className="text-sm text-muted-foreground">{currentLevelXP} / {xpNeeded} XP</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold gradient-text">{xp}</div>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Complete focus sessions to earn XP and level up!
      </p>
    </div>
  );
};

export default XPBar;

export const addXP = async (amount: number) => {
  try {
    await supabase.rpc("add_user_xp", { amount });
    return amount;
  } catch (error) {
    console.error("Error adding XP:", error);
    return 0;
  }
};
