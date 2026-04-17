"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, Users, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName }),
      });
      const room = await res.json();
      if (room.id) {
        router.push(`/room/${room.id}`);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 max-w-2xl mx-auto mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-6 border border-blue-500/20">
          <Rocket className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
          Mass Grooming
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed">
          Professional, real-time planning poker for agile teams. 
          Estimate user stories and groom your backlog efficiently.
        </p>

        <form onSubmit={createRoom} className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Enter room name (e.g. Sprint 42)"
            className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder:text-slate-500"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading || !roomName.trim()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/25"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Create Room"
            )}
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
      >
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-lg">
            <Zap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
            <p className="text-slate-400">Everyone sees the votes exactly at the same time. No page refreshes required.</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Spectator Mode</h3>
            <p className="text-slate-400">Join as a spectator if you are just observing the grooming session.</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
