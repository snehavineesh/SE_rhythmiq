import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Zap, Target, ArrowRight, User, BookOpen, Trophy, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthDialog from "@/components/AuthDialog";

const Home = () => {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-pink">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Rhythmiq</h1>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAuthOpen(true)}
          className="gap-2 border-border/50 hover:bg-primary/10"
        >
          <User className="w-4 h-4" />
          Login / Sign Up
        </Button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl w-full mx-auto text-center space-y-12 animate-fade-in flex-1 flex flex-col items-center justify-center py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-pink">
            <Music className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold gradient-text">Rhythmiq</h1>
        </div>

        {/* Tagline */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Where focus meets flow — <br />
            <span className="gradient-text">AI-assisted study music</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Curated YouTube playlists, Pomodoro timers, and an XP-based motivation system 
            to help you stay in the zone.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg"
            onClick={() => setAuthOpen(true)}
            className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 glow-pink hover:glow-purple"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/app')}
            className="px-8 py-6 text-lg font-semibold border-border/50 hover:bg-primary/10"
          >
            Try Without Account
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 pt-12 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-2xl space-y-3 hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Adaptive Playlists</h3>
            <p className="text-muted-foreground">
              AI-curated YouTube music that adapts to your focus needs
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Pomodoro Focus Timer</h3>
            <p className="text-muted-foreground">
              25-minute focus sessions with 5-minute breaks for optimal productivity
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">XP & Leveling System</h3>
            <p className="text-muted-foreground">
              Earn XP for every completed session and level up your focus
            </p>
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="grid md:grid-cols-2 gap-6 pt-12 max-w-4xl mx-auto">
          <div className="glass-card p-8 rounded-2xl space-y-4 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Custom Playlists</h3>
            </div>
            <p className="text-muted-foreground">
              Build your perfect study playlists from our curated music library. Save your favorites and create multiple playlists for different moods and tasks.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-4 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Redeem Rewards</h3>
            </div>
            <p className="text-muted-foreground">
              Exchange your hard-earned XP for exclusive Rhythmiq merchandise in our shop. The more you focus, the more you earn!
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="pt-16 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 gradient-text">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto glow-pink">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="font-semibold text-foreground">Sign Up</h4>
              <p className="text-sm text-muted-foreground">Create your free account in seconds</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto" style={{ animationDelay: '0.1s' }}>
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-semibold text-foreground">Choose Music</h4>
              <p className="text-sm text-muted-foreground">Browse curated tracks for focus</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto" style={{ animationDelay: '0.2s' }}>
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-semibold text-foreground">Start Session</h4>
              <p className="text-sm text-muted-foreground">Use Pomodoro timer to focus</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto glow-purple" style={{ animationDelay: '0.3s' }}>
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h4 className="font-semibold text-foreground">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">Gain XP and redeem merch</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="pt-16 max-w-4xl mx-auto">
          <div className="glass-card p-12 rounded-3xl">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <Coffee className="w-8 h-8 mx-auto text-primary" />
                <div className="text-4xl font-bold gradient-text">25 min</div>
                <div className="text-sm text-muted-foreground">Perfect Focus Sessions</div>
              </div>
              <div className="space-y-2">
                <Music className="w-8 h-8 mx-auto text-accent" />
                <div className="text-4xl font-bold gradient-text">1000+</div>
                <div className="text-sm text-muted-foreground">Curated Study Tracks</div>
              </div>
              <div className="space-y-2">
                <Zap className="w-8 h-8 mx-auto text-primary" />
                <div className="text-4xl font-bold gradient-text">∞</div>
                <div className="text-sm text-muted-foreground">Productivity Potential</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Home;
