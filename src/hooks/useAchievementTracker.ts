import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAchievementTracker = () => {
  const { user } = useAuth();

  const checkAndUnlockAchievement = async (
    requirementType: string,
    currentValue: number
  ) => {
    if (!user) return;

    // Fetch achievements matching this requirement type
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("requirement_type", requirementType)
      .lte("requirement_value", currentValue);

    if (!achievements) return;

    // Check which ones are already unlocked
    const { data: unlockedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const unlockedIds = new Set(
      unlockedAchievements?.map((ua) => ua.achievement_id) || []
    );

    // Unlock new achievements
    for (const achievement of achievements) {
      if (!unlockedIds.has(achievement.id)) {
        await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });
      }
    }
  };

  const trackTaskCompletion = async () => {
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("completed", true);

    if (count !== null) {
      await checkAndUnlockAchievement("tasks_completed", count);
    }
  };

  const trackFocusSession = async () => {
    // Track focus sessions completed - we'll increment a counter
    const { data: userXp } = await supabase
      .from("user_xp")
      .select("level")
      .eq("user_id", user?.id)
      .single();

    if (userXp) {
      await checkAndUnlockAchievement("level_reached", userXp.level);
    }
  };

  const trackLikedTrack = async () => {
    const { count } = await supabase
      .from("liked_tracks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    if (count !== null) {
      await checkAndUnlockAchievement("liked_tracks", count);
    }
  };

  const trackPlaylistCreated = async () => {
    const { count } = await supabase
      .from("playlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    if (count !== null) {
      await checkAndUnlockAchievement("playlists_created", count);
    }
  };

  const trackChallengeCompleted = async () => {
    const { count } = await supabase
      .from("user_challenge_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    if (count !== null) {
      await checkAndUnlockAchievement("challenges_completed", count);
    }
  };

  const trackFeedbackSubmitted = async () => {
    const { count } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    if (count !== null) {
      await checkAndUnlockAchievement("feedback_submitted", count);
    }
  };

  return {
    trackTaskCompletion,
    trackFocusSession,
    trackLikedTrack,
    trackPlaylistCreated,
    trackChallengeCompleted,
    trackFeedbackSubmitted,
  };
};
