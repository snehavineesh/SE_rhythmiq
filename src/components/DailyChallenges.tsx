import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  completed: boolean;
}

const DailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("daily_challenges")
        .select("*")
        .limit(5);

      if (challengesError) throw challengesError;

      // Fetch user's completed challenges
      const { data: completionsData, error: completionsError } = await supabase
        .from("user_challenge_completions")
        .select("challenge_id")
        .eq("user_id", user.id);

      if (completionsError) throw completionsError;

      const completedIds = new Set(completionsData?.map(c => c.challenge_id) || []);

      const challengesWithStatus = challengesData?.map(challenge => ({
        ...challenge,
        completed: completedIds.has(challenge.id),
      })) || [];

      setChallenges(challengesWithStatus);
    } catch (error: any) {
      toast.error("Failed to load challenges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkChallengeCompletion = async (challengeTitle: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check different challenge types
      if (challengeTitle.includes("Complete 5 tasks")) {
        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true);
        return (count || 0) >= 5;
      }
      
      if (challengeTitle.includes("Focus for 25 minutes")) {
        // This would need session tracking - for now return false
        return false;
      }
      
      if (challengeTitle.includes("Add 3 tracks")) {
        const { count } = await supabase
          .from("playlist_tracks")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", user.id);
        return (count || 0) >= 3;
      }

      return false;
    } catch (error) {
      console.error("Error checking challenge:", error);
      return false;
    }
  };

  const redeemChallenge = async (challengeId: string, xpReward: number, challengeTitle: string) => {
    if (!user) return;

    const isComplete = await checkChallengeCompletion(challengeTitle);
    
    if (!isComplete) {
      toast.error("You haven't completed this challenge yet!");
      return;
    }

    try {
      // Insert completion record
      const { error: completionError } = await supabase
        .from("user_challenge_completions")
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
        });

      if (completionError) throw completionError;

      // Add XP to user
      const { error: xpError } = await supabase.rpc("add_user_xp", {
        amount: xpReward,
      });

      if (xpError) throw xpError;

      toast.success(`Challenge completed! +${xpReward} XP earned!`);
      
      // Update local state
      setChallenges(prev =>
        prev.map(c =>
          c.id === challengeId ? { ...c, completed: true } : c
        )
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to redeem challenge");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading challenges...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Daily Challenges
        </CardTitle>
        <CardDescription>
          Complete challenges to earn extra XP and level up faster!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">{challenge.title}</h4>
                {challenge.completed && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                +{challenge.xp_reward} XP
              </Badge>
              <Button
                size="sm"
                disabled={challenge.completed}
                onClick={() => redeemChallenge(challenge.id, challenge.xp_reward, challenge.title)}
                className="whitespace-nowrap"
              >
                {challenge.completed ? "Completed" : "Redeem"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;
