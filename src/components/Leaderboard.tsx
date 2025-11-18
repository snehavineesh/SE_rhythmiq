import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  xp: number;
  level: number;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("user_xp")
        .select(`
          user_id,
          xp,
          level,
          profiles!user_xp_user_id_fkey(username)
        `)
        .not("profiles.username", "is", null)
        .order("xp", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Leaderboard data:", data);
        const formattedData = data.map((entry: any) => ({
          user_id: entry.user_id,
          username: entry.profiles?.username || "Unknown",
          xp: entry.xp || 0,
          level: entry.level || 1,
        }));
        console.log("Formatted leaderboard:", formattedData);
        setEntries(formattedData);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to XP changes for real-time updates
    const channel = supabase
      .channel("leaderboard_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_xp",
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <Trophy className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-6 rounded-3xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Top 3 Players</p>
        </div>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No players yet</p>
        ) : (
          entries.slice(0, 3).map((entry, index) => (
            <div
              key={entry.user_id}
              className={`glass-card p-4 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                index < 3 ? "border border-primary/20" : ""
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {entry.username}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Lvl {entry.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{entry.xp} XP</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                #{index + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default Leaderboard;
