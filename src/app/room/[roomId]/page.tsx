"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import RoomBoard from "@/components/RoomBoard";
import useSWR from "swr";
import { Room } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'An error occurred');
  return data;
});

const AVATARS = [
  ...Array.from({ length: 151 }).map((_, i) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i + 1}.png`),
  ...Array.from({ length: 50 }).map((_, i) => `https://rickandmortyapi.com/api/character/avatar/${i + 1}.jpeg`),
];

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  
  const [hasJoined, setHasJoined] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: room } = useSWR<Room>(!hasJoined ? `/api/room/${roomId}` : null, fetcher, {
    refreshInterval: 1000,
  });

  const takenAvatars = room?.users?.map(u => u.avatar).filter(Boolean) || [];

  const [userName, setUserName] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [avatarPage, setAvatarPage] = useState(0);
  const AVATARS_PER_PAGE = 12;
  const totalPages = Math.ceil(AVATARS.length / AVATARS_PER_PAGE);

  // Default to first available avatar if current is taken
  useEffect(() => {
    if (takenAvatars.includes(avatar)) {
      const firstAvailable = AVATARS.find(a => !takenAvatars.includes(a));
      if (firstAvailable) setAvatar(firstAvailable);
    }
  }, [takenAvatars, avatar]);

  const displayedAvatars = AVATARS.slice(
    avatarPage * AVATARS_PER_PAGE, 
    (avatarPage + 1) * AVATARS_PER_PAGE
  );

  useEffect(() => {
    // Check local storage for existing user info in this room
    const storedInfo = localStorage.getItem(`room_${roomId}_user`);
    if (storedInfo) {
      const parsed = JSON.parse(storedInfo);
      setUserName(parsed.name);
      setUserId(parsed.id);
      setIsSpectator(parsed.isSpectator);
      if (parsed.avatar) setAvatar(parsed.avatar);
      setHasJoined(true);
    }
  }, [roomId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const newUserId = userId || Math.random().toString(36).substring(2, 9);
    const userInfo = {
      id: newUserId,
      name: userName,
      isSpectator,
      avatar,
      vote: null
    };

    try {
      await fetch(`/api/room/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "JOIN",
          payload: { user: userInfo }
        })
      });

      localStorage.setItem(`room_${roomId}_user`, JSON.stringify(userInfo));
      setUserId(newUserId);
      setHasJoined(true);
    } catch (error) {
      console.error("Failed to join room", error);
    }
  };

  if (!hasJoined) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Join Room</h2>
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-blue-500 outline-none transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-400">Select Avatar</label>
                <div className="flex gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => setAvatarPage(p => Math.max(0, p - 1))}
                    disabled={avatarPage === 0}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-medium transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-500 font-medium w-10 text-center">{avatarPage + 1} / {totalPages}</span>
                  <button 
                    type="button" 
                    onClick={() => setAvatarPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={avatarPage === totalPages - 1}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 min-h-[120px] content-start">
                {displayedAvatars.map((a) => {
                  const isTaken = takenAvatars.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => !isTaken && setAvatar(a)}
                      disabled={isTaken}
                      className={`w-12 h-12 p-1 flex items-center justify-center rounded-xl transition-all overflow-hidden ${
                        isTaken ? 'opacity-20 cursor-not-allowed grayscale' :
                        avatar === a 
                          ? 'bg-blue-600 shadow-lg shadow-blue-500/30 scale-110 border border-blue-400' 
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <img src={a} alt="Avatar" className="w-full h-full object-contain drop-shadow-md" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="spectator"
                checked={isSpectator}
                onChange={(e) => setIsSpectator(e.target.checked)}
                className="w-5 h-5 rounded bg-black/20 border-white/10 text-blue-500 focus:ring-blue-500/20"
              />
              <label htmlFor="spectator" className="text-sm font-medium text-slate-300">
                Join as Spectator
              </label>
            </div>
            <button
              type="submit"
              disabled={!userName.trim()}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              Enter Room
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  return <RoomBoard roomId={roomId} userId={userId!} />;
}
