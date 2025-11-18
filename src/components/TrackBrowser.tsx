import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Music2, Play, Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
}

interface TrackBrowserProps {
  onTrackSelect: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

const API_KEY = "AIzaSyC0PqzCghROcMT9PNS7cEPEjasSmCvtCms";

const TrackBrowser = ({ onTrackSelect, onAddToPlaylist }: TrackBrowserProps) => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTracks();
    if (user) {
      loadLikedTracks();
    }
  }, [user]);

  const loadLikedTracks = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("liked_tracks")
        .select("track_id")
        .eq("user_id", user.id);
      
      if (data) {
        setLikedTracks(new Set(data.map(t => t.track_id)));
      }
    } catch (error) {
      console.error("Error loading liked tracks:", error);
    }
  };

  const toggleLike = async (track: Track) => {
    if (!user) {
      toast.error("Please login to like tracks");
      return;
    }

    const isLiked = likedTracks.has(track.id);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from("liked_tracks")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", track.id);
        
        setLikedTracks(prev => {
          const newSet = new Set(prev);
          newSet.delete(track.id);
          return newSet;
        });
        toast.success("Removed from liked tracks");
      } else {
        // Like
        await supabase
          .from("liked_tracks")
          .insert({
            user_id: user.id,
            track_id: track.id,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail,
          });
        
        setLikedTracks(prev => new Set(prev).add(track.id));
        toast.success("Added to liked tracks");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update liked tracks");
    }
  };

  const loadTracks = async () => {
    try {
      // Default tracks to show when API quota is exceeded
      const defaultTracks: Track[] = [
        {
          id: "jfKfPfyJRdk",
          title: "lofi hip hop radio 📚 - beats to relax/study to",
          artist: "Lofi Girl",
          thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg",
          duration: "LIVE"
        },
        {
          id: "lTRiuFIWV54",
          title: "Deep Focus - Music For Studying, Concentration and Work",
          artist: "Study Music Project",
          thumbnail: "https://i.ytimg.com/vi/lTRiuFIWV54/mqdefault.jpg",
          duration: "3:00:00"
        },
        {
          id: "5qap5aO4i9A",
          title: "Lofi Hip Hop Mix - Beats to Relax/Study to",
          artist: "ChilledCow",
          thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg",
          duration: "1:30:00"
        },
        {
          id: "DWcJFNfaw9c",
          title: "Peaceful Piano - Relaxing Music for Study & Work",
          artist: "Peaceful Piano",
          thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg",
          duration: "2:00:00"
        },
        {
          id: "1ZYbU82GVz4",
          title: "Jazz Music for Work & Study - Smooth Jazz Cafe",
          artist: "Cafe Music BGM channel",
          thumbnail: "https://i.ytimg.com/vi/1ZYbU82GVz4/mqdefault.jpg",
          duration: "2:30:00"
        },
        {
          id: "Dx5qFachd3A",
          title: "Lofi Hip Hop Radio - Calm Study Beats",
          artist: "Lofi Hip Hop",
          thumbnail: "https://i.ytimg.com/vi/Dx5qFachd3A/mqdefault.jpg",
          duration: "LIVE"
        },
        {
          id: "7NOSDKb0HlU",
          title: "Deep Focus - Ambient Music for Concentration",
          artist: "Relaxing Music",
          thumbnail: "https://i.ytimg.com/vi/7NOSDKb0HlU/mqdefault.jpg",
          duration: "2:15:00"
        },
        {
          id: "2OEL4P1Rz04",
          title: "Chill Study Beats - Lofi Hip Hop Mix",
          artist: "ChillHop Music",
          thumbnail: "https://i.ytimg.com/vi/2OEL4P1Rz04/mqdefault.jpg",
          duration: "1:45:00"
        },
        {
          id: "kgx4WGK0oNU",
          title: "Classical Music for Brain Power",
          artist: "Classical Music",
          thumbnail: "https://i.ytimg.com/vi/kgx4WGK0oNU/mqdefault.jpg",
          duration: "3:30:00"
        },
        {
          id: "5yx6BWlEVcY",
          title: "Ambient Study Music - Focus Flow",
          artist: "Ambient Music",
          thumbnail: "https://i.ytimg.com/vi/5yx6BWlEVcY/mqdefault.jpg",
          duration: "2:00:00"
        },
        {
          id: "EcEMX-63PKY",
          title: "Coffee Shop Ambience with Jazz Music",
          artist: "Cozy Coffee Shop",
          thumbnail: "https://i.ytimg.com/vi/EcEMX-63PKY/mqdefault.jpg",
          duration: "1:30:00"
        },
        {
          id: "4xDzrJKXOOY",
          title: "Lofi Beats - Study & Relax",
          artist: "Lofi Fruits Music",
          thumbnail: "https://i.ytimg.com/vi/4xDzrJKXOOY/mqdefault.jpg",
          duration: "1:00:00"
        },
      ];

      const queries = [
        "lofi hip hop study",
        "ambient study music",
        "focus piano music",
        "chill beats study",
      ];
      const allTracks: Track[] = [];

      for (const query of queries) {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=8&key=${API_KEY}`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.code === 403) {
            console.warn("YouTube API quota exceeded, using default tracks");
            setTracks(defaultTracks);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch tracks: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          continue;
        }
        
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
        );
        
        if (!detailsResponse.ok) {
          throw new Error("Failed to fetch video details");
        }
        
        const detailsData = await detailsResponse.json();

        const trackData: Track[] = data.items.map((item: any, index: number) => {
          const duration = detailsData.items[index]?.contentDetails?.duration || 'PT0S';
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            duration: parseDuration(duration),
          };
        });

        allTracks.push(...trackData);
      }

      setTracks(allTracks.slice(0, 24));
      setLoading(false);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast.error("Failed to load tracks. Showing default tracks.");
      // Show default tracks on error
      setTracks([
        {
          id: "jfKfPfyJRdk",
          title: "lofi hip hop radio 📚 - beats to relax/study to",
          artist: "Lofi Girl",
          thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg",
          duration: "LIVE"
        },
        {
          id: "lTRiuFIWV54",
          title: "Deep Focus - Music For Studying, Concentration and Work",
          artist: "Study Music Project",
          thumbnail: "https://i.ytimg.com/vi/lTRiuFIWV54/mqdefault.jpg",
          duration: "3:00:00"
        },
        {
          id: "5qap5aO4i9A",
          title: "Lofi Hip Hop Mix - Beats to Relax/Study to",
          artist: "ChilledCow",
          thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg",
          duration: "1:30:00"
        },
        {
          id: "DWcJFNfaw9c",
          title: "Peaceful Piano - Relaxing Music for Study & Work",
          artist: "Peaceful Piano",
          thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg",
          duration: "2:00:00"
        },
        {
          id: "1ZYbU82GVz4",
          title: "Jazz Music for Work & Study - Smooth Jazz Cafe",
          artist: "Cafe Music BGM channel",
          thumbnail: "https://i.ytimg.com/vi/1ZYbU82GVz4/mqdefault.jpg",
          duration: "2:30:00"
        },
        {
          id: "Dx5qFachd3A",
          title: "Lofi Hip Hop Radio - Calm Study Beats",
          artist: "Lofi Hip Hop",
          thumbnail: "https://i.ytimg.com/vi/Dx5qFachd3A/mqdefault.jpg",
          duration: "LIVE"
        },
      ]);
      setLoading(false);
    }
  };

  const parseDuration = (duration: string): string => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass-card p-4 animate-pulse">
            <div className="aspect-square bg-muted rounded-xl mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Music2 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Focus Tracks</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <Card
            key={track.id}
            className="glass-card p-4 cursor-pointer hover:scale-105 transition-all duration-300 group"
          >
            <div
              className="relative aspect-square rounded-xl overflow-hidden mb-3"
              onClick={() => onTrackSelect(track)}
            >
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center glow-pink">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                {track.duration}
              </div>
            </div>
            <h3 className="font-semibold text-foreground line-clamp-2 mb-1 text-sm">
              {track.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {track.artist}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className={`flex-1 gap-2 text-xs ${likedTracks.has(track.id) ? 'text-primary' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(track);
                }}
              >
                <Heart className={`w-3 h-3 ${likedTracks.has(track.id) ? 'fill-current' : ''}`} />
                {likedTracks.has(track.id) ? 'Liked' : 'Like'}
              </Button>
              {onAddToPlaylist && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 gap-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist(track);
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Playlist
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackBrowser;
