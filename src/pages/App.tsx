import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, Home, ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PomodoroTimer from "@/components/PomodoroTimer";
import XPBar from "@/components/XPBar";
import TrackBrowser, { Track } from "@/components/TrackBrowser";
import MusicPlayer from "@/components/MusicPlayer";
import TaskManager from "@/components/TaskManager";
import CustomPlaylistManager, { addTrackToPlaylist } from "@/components/CustomPlaylistManager";
import Leaderboard from "@/components/Leaderboard";
import DailyChallenges from "@/components/DailyChallenges";
import ThemeToggle from "@/components/ThemeToggle";
import FeedbackButton from "@/components/FeedbackButton";
import { AchievementBadges } from "@/components/AchievementBadges";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AppPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [xpKey, setXpKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const handleSessionComplete = () => {
    setXpKey(prev => prev + 1);
  };

  const handleTaskComplete = () => {
    setXpKey(prev => prev + 1);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  const handleAddToPlaylist = (track: Track) => {
    addTrackToPlaylist(track);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Rhythmiq</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2 text-primary hover:text-primary"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/shop')}
              className="gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            {profile && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{profile.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground">
              {profile ? `Hey ${profile.username}! 👋` : "Focus & Flow Dashboard"}
            </h2>
            <p className="text-muted-foreground">
              Complete Pomodoro sessions, earn XP, and stay in the zone with curated music
            </p>
          </div>

          {/* XP Bar */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <XPBar key={xpKey} />
          </div>

          {/* Tabs for Dashboard and Daily Challenges */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 mt-8">
              {/* Three Column Layout */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Pomodoro Timer */}
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <PomodoroTimer onSessionComplete={handleSessionComplete} />
                </div>

                {/* Task Manager */}
                <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
                  <TaskManager onTaskComplete={handleTaskComplete} />
                </div>

                {/* Leaderboard */}
                <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <Leaderboard />
                </div>
              </div>

              {/* Now Playing Section */}
              <div className="glass-card p-8 rounded-3xl space-y-4 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                <h3 className="text-2xl font-bold text-foreground">Now Playing</h3>
                {selectedTrack ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl max-w-2xl mx-auto">
                      <img
                        src={selectedTrack.thumbnail}
                        alt={selectedTrack.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="font-bold text-white text-lg line-clamp-2 mb-1">
                          {selectedTrack.title}
                        </h4>
                        <p className="text-sm text-white/80">{selectedTrack.artist}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Use player controls below to manage playback
                    </p>
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-muted/50 flex items-center justify-center max-w-2xl mx-auto">
                    <div className="text-center space-y-2">
                      <Music className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Select a track below
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Playlists */}
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CustomPlaylistManager onPlayTrack={handleTrackSelect} />
              </div>

              {/* Track Browser */}
              <div className="animate-slide-up" style={{ animationDelay: '0.45s' }}>
                <TrackBrowser 
                  onTrackSelect={handleTrackSelect}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              </div>

              {/* Achievement Badges */}
              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <AchievementBadges />
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="mt-8">
              <DailyChallenges />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Feedback Button */}
      <FeedbackButton />

      {/* Music Player */}
      <MusicPlayer track={selectedTrack} />
    </div>
  );
};

export default AppPage;
