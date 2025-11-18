import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAchievementTracker } from "@/hooks/useAchievementTracker";


interface PomodoroTimerProps {
  onSessionComplete: () => void;
}

const PomodoroTimer = ({ onSessionComplete }: PomodoroTimerProps) => {
  const { trackFocusSession } = useAchievementTracker();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isBreak) {
      interval = setInterval(async () => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer complete
            onSessionComplete();
            toast.success("Focus session complete! +50 XP", {
              description: "Time for a break!",
            });
            trackFocusSession();
            setIsBreak(true);
            setMinutes(5);
            setIsActive(false);
            setFocusMinutes(0);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
            const newFocusMinutes = focusMinutes + 1;
            setFocusMinutes(newFocusMinutes);
            
            // Add 5 XP every 5 minutes
            if (newFocusMinutes % 5 === 0 && newFocusMinutes > 0) {
              try {
                await supabase.rpc("add_user_xp", { amount: 5 });
                toast.success("+5 XP for 5 minutes of focus!", {
                  description: "Keep going!",
                });
              } catch (error) {
                console.error("Failed to add XP:", error);
              }
            }
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (isActive && isBreak) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            toast.success("Break complete!", {
              description: "Ready for another session?",
            });
            setIsBreak(false);
            setMinutes(25);
            setIsActive(false);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, isBreak, focusMinutes, onSessionComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
    setFocusMinutes(0);
  };

  const progress = isBreak 
    ? ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100
    : ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100;

  return (
    <>
      
      <div className="glass-card p-8 rounded-3xl space-y-6">
        <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {isBreak ? "Break Time" : "Focus Session"}
        </h2>
        <p className="text-muted-foreground">
          {isBreak ? "Relax and recharge" : "Stay focused and productive"}
        </p>
      </div>

      {/* Circular Timer Display */}
      <div className="relative flex items-center justify-center">
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(338, 100%, 70%)" />
              <stop offset="100%" stopColor="hsl(270, 100%, 69%)" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {isBreak ? "Break Time" : "Focus Time"}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          size="lg"
          onClick={toggleTimer}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start
            </>
          )}
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={resetTimer}
          className="border-border/50 hover:bg-muted/50"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
      </div>
    </div>
    </>
  );
};

export default PomodoroTimer;
