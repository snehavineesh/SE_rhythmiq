import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import type { Track } from "./TrackBrowser";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MusicPlayerProps {
  track: Track | null;
}

const MusicPlayer = ({ track }: MusicPlayerProps) => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!track) {
      if (player) {
        player.destroy();
        setPlayer(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initPlayer();
      } else {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      }
    };

    const initPlayer = () => {
      // Destroy existing player if it exists
      if (player) {
        player.destroy();
      }

      const newPlayer = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: track.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
      setPlayer(newPlayer);
    };

    const onPlayerReady = (event: any) => {
      setDuration(event.target.getDuration());
      event.target.playVideo();
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    };

    const onPlayerStateChange = (event: any) => {
      if (event.data === window.YT.PlayerState.ENDED) {
        setIsPlaying(false);
      }
    };

    loadYouTubeAPI();

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.log("Error destroying player:", e);
        }
      }
    };
  }, [track]);

  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        const current = player.getCurrentTime();
        setCurrentTime(current);
        if (duration > 0) {
          setProgress((current / duration) * 100);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlaying, duration]);

  useEffect(() => {
    if (player && player.setVolume) {
      player.setVolume(volume);
    }
  }, [volume, player]);

  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!track) return null;

  return (
    <>
      <div id="youtube-player" className="hidden" />
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-border/50 z-50">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative group">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent rounded-lg opacity-50" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate">
                {track.title}
              </h4>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-pink"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
