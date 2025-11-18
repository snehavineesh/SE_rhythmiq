import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, TrendingUp, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserStats {
  total_users: number;
  total_xp: number;
  avg_level: number;
}

interface FeedbackItem {
  id: string;
  message: string;
  created_at: string;
  username: string;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({ total_users: 0, total_xp: 0, avg_level: 0 });
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Access denied. Admin only.");
        navigate("/app");
        return;
      }

      setIsAdmin(true);
      fetchData();

      // Subscribe to feedback changes for real-time updates
      const feedbackChannel = supabase
        .channel("admin_feedback_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feedback",
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(feedbackChannel);
      };
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchData = async () => {
    // Fetch user stats with profiles joined
    const { data: xpData } = await supabase
      .from("user_xp")
      .select(`
        xp,
        level,
        profiles!user_xp_user_id_fkey(username, created_at)
      `);

    if (xpData) {
      const totalXp = xpData.reduce((sum, u) => sum + (u.xp || 0), 0);
      const avgLevel = xpData.length > 0 
        ? xpData.reduce((sum, u) => sum + (u.level || 1), 0) / xpData.length 
        : 0;
      
      setStats({
        total_users: xpData.length,
        total_xp: totalXp,
        avg_level: Math.round(avgLevel * 10) / 10,
      });

      // Format users data with proper typing
      const formattedUsers = xpData
        .filter((entry: any) => entry.profiles?.username) // Filter out entries without usernames
        .map((entry: any) => ({
          id: entry.profiles?.id || '',
          username: entry.profiles.username,
          created_at: entry.profiles?.created_at || new Date().toISOString(),
          xp: entry.xp,
          level: entry.level,
        }));
      setUsers(formattedUsers);
    }

    // Fetch feedback with usernames
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .select(`
        id,
        message,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false });

    console.log("Feedback data:", feedbackData, "Error:", feedbackError);

    if (feedbackData) {
      // Fetch usernames for each feedback entry
      const feedbackWithUsernames = await Promise.all(
        feedbackData.map(async (fb: any) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", fb.user_id)
            .single();
          
          return {
            id: fb.id,
            message: fb.message,
            created_at: fb.created_at,
            username: profileData?.username || "Unknown User",
          };
        })
      );
      setFeedback(feedbackWithUsernames);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="text-center text-foreground">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-main)] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{stats.total_users}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-3xl font-bold text-foreground">{stats.total_xp.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Level</p>
                <p className="text-3xl font-bold text-foreground">{stats.avg_level}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users List */}
        <Card className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            All Users
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user: any) => (
              <div
                key={user.id || user.username}
                className="glass-card p-4 rounded-xl flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">Level {user.level}</p>
                  <p className="text-xs text-muted-foreground">{user.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Feedback */}
        <Card className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            User Feedback
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feedback.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No feedback yet</p>
            ) : (
              feedback.map((fb) => (
                <div key={fb.id} className="glass-card p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-foreground">{fb.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(fb.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-foreground">{fb.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
