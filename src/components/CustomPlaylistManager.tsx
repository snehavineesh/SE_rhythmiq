import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Music, Plus, Trash2, Play, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Track } from "./TrackBrowser";

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

interface CustomPlaylistManagerProps {
  onPlayTrack: (track: Track) => void;
}

const CustomPlaylistManager = ({ onPlayTrack }: CustomPlaylistManagerProps) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPlaylists = async () => {
      // Fetch user's custom playlists
      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch liked tracks
      const { data: likedTracksData } = await supabase
        .from("liked_tracks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const allPlaylists: Playlist[] = [];

      // Add "Liked Playlists" as first playlist
      if (likedTracksData && likedTracksData.length > 0) {
        allPlaylists.push({
          id: "liked",
          name: "Liked Playlists",
          tracks: likedTracksData.map((track) => ({
            id: track.track_id,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail,
            duration: "3:00",
          })),
        });
      }

      // Add custom playlists
      if (playlistsData) {
        const playlistsWithTracks = await Promise.all(
          playlistsData.map(async (playlist) => {
            const { data: tracksData } = await supabase
              .from("playlist_tracks")
              .select("*")
              .eq("playlist_id", playlist.id)
              .order("created_at", { ascending: false });

            return {
              id: playlist.id,
              name: playlist.name,
              tracks: tracksData
                ? tracksData.map((track) => ({
                    id: track.track_id,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    duration: "3:00",
                  }))
                : [],
            };
          })
        );

        allPlaylists.push(...playlistsWithTracks);
      }

      setPlaylists(allPlaylists);
    };

    fetchPlaylists();

    // Subscribe to playlist changes
    const playlistChannel = supabase
      .channel("playlist_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlists",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPlaylists();
        }
      )
      .subscribe();

    const trackChannel = supabase
      .channel("playlist_track_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist_tracks",
        },
        () => {
          fetchPlaylists();
        }
      )
      .subscribe();

    const likedChannel = supabase
      .channel("liked_tracks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "liked_tracks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPlaylists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playlistChannel);
      supabase.removeChannel(trackChannel);
      supabase.removeChannel(likedChannel);
    };
  }, [user]);

  const createPlaylist = async () => {
    if (!user || !newPlaylistName.trim()) {
      toast.error("Playlist name cannot be empty!");
      return;
    }

    const { error } = await supabase.from("playlists").insert({
      user_id: user.id,
      name: newPlaylistName.trim(),
    });

    if (!error) {
      setNewPlaylistName("");
      toast.success("Playlist created!");
    } else {
      toast.error("Failed to create playlist");
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!user || id === "liked") return; // Can't delete liked playlist

    const { error } = await supabase.from("playlists").delete().eq("id", id);

    if (!error) {
      toast.success("Playlist deleted!");
      if (selectedPlaylist === id) {
        setSelectedPlaylist(null);
      }
    } else {
      toast.error("Failed to delete playlist");
    }
  };

  const removeTrack = async (playlistId: string, trackId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId);

    if (!error) {
      toast.success("Track removed!");
    } else {
      toast.error("Failed to remove track");
    }
  };

  const selected = playlists.find(p => p.id === selectedPlaylist);

  return (
    <Card className="glass-card p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <ListMusic className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Liked Playlists</h3>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New playlist name..."
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && createPlaylist()}
          className="glass-card border-border/50"
        />
        <Button
          onClick={createPlaylist}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {playlists.map((playlist) => (
          <Card
            key={playlist.id}
            className={`glass-card p-4 cursor-pointer hover:scale-105 transition-all duration-200 group ${
              selectedPlaylist === playlist.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedPlaylist(playlist.id)}
          >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">
                    {playlist.name}
                  </span>
                </div>
                {playlist.id !== "liked" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(playlist.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            <p className="text-xs text-muted-foreground">
              {playlist.tracks.length} tracks
            </p>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          <h4 className="font-semibold text-foreground">
            {selected.name} - Tracks
          </h4>
          {selected.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tracks yet. Browse tracks below to add some!
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {selected.tracks.map((track) => (
                <div
                  key={track.id}
                  className="glass-card p-3 rounded-xl flex items-center gap-3 group hover:scale-[1.02] transition-all"
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist} • {track.duration}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onPlayTrack(track)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => removeTrack(selected.id, track.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CustomPlaylistManager;

export const addTrackToPlaylist = async (track: Track) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get first playlist or create one
  let { data: playlists } = await supabase
    .from("playlists")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  let playlistId: string;

  if (!playlists || playlists.length === 0) {
    const { data: newPlaylist, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name: "My Playlist",
      })
      .select()
      .single();

    if (error || !newPlaylist) {
      toast.error("Failed to create playlist");
      return;
    }
    playlistId = newPlaylist.id;
  } else {
    playlistId = playlists[0].id;
  }

  // Add track to playlist
  const { error } = await supabase.from("playlist_tracks").insert({
    playlist_id: playlistId,
    track_id: track.id,
    title: track.title,
    artist: track.artist,
    thumbnail: track.thumbnail,
  });

  if (!error) {
    toast.success(`Added to playlist!`);
  } else {
    toast.error("Track already in playlist or failed to add");
  }
};
