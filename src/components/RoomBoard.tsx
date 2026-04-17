"use client";

import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Users, Eye, RotateCcw, Check, LogOut, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Room } from "@/lib/types";
import { useRouter } from "next/navigation";
import { AVATARS } from "@/lib/constants";

const FIBONACCI = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"];

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'An error occurred');
  return data;
});

const TaskNameInput = ({ roomId, initialTaskName, mutate }: { roomId: string, initialTaskName: string, mutate: any }) => {
  const [localTaskName, setLocalTaskName] = useState(initialTaskName);
  const [isEditing, setIsEditing] = useState(false);

  // Sync external changes when not editing
  useEffect(() => {
    if (initialTaskName !== undefined && !isEditing) {
      setLocalTaskName(initialTaskName);
    }
  }, [initialTaskName, isEditing]);

  const handleSave = async () => {
    if (localTaskName === initialTaskName) {
      setIsEditing(false);
      return;
    }
    
    setIsEditing(false);
    await fetch(`/api/room/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "UPDATE_TASK", payload: { taskName: localTaskName } }),
    });
    mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalTaskName(initialTaskName);
      setIsEditing(false);
    }
  };

  const hasChanges = localTaskName !== initialTaskName;

  return (
    <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
      <div className="relative w-full flex items-center justify-center">
        <input
          type="text"
          id="task-input"
          placeholder="Enter task / story name here..."
          value={localTaskName}
          onChange={(e) => {
            setLocalTaskName(e.target.value);
            setIsEditing(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-b-2 border-white/10 hover:border-white/30 focus:border-blue-500 text-center text-xl md:text-3xl font-medium outline-none py-3 transition-colors text-white placeholder:text-slate-600"
        />
        {hasChanges && (
          <button
            onClick={handleSave}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
          >
            <Check className="w-4 h-4" /> Save
          </button>
        )}
      </div>
      {hasChanges && (
        <span className="text-xs text-amber-400/80 mt-2 font-medium tracking-wide">
          Unsaved changes. Press Enter or click Save.
        </span>
      )}
    </div>
  );
};

export default function RoomBoard({ roomId, userId }: { roomId: string, userId: string }) {
  const router = useRouter();
  const { data: room, error, mutate } = useSWR<Room>(`/api/room/${roomId}`, fetcher, {
    refreshInterval: 1000, // Poll every second for real-time feel
  });
  const [copied, setCopied] = useState(false);
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarPage, setAvatarPage] = useState(0);
  const [cardSetString, setCardSetString] = useState("");

  const currentUser = room?.users?.find((u) => u.id === userId);
  const myVote = currentUser?.vote;

  const currentCards = room?.cardSet || FIBONACCI;

  const AVATARS_PER_PAGE = 12;
  const totalPages = Math.ceil(AVATARS.length / AVATARS_PER_PAGE);
  const displayedAvatars = AVATARS.slice(
    avatarPage * AVATARS_PER_PAGE,
    (avatarPage + 1) * AVATARS_PER_PAGE
  );

  const takenAvatars = room?.users?.filter(u => u.id !== userId).map(u => u.avatar).filter(Boolean) || [];

  const handleAvatarChange = async (newAvatar: string) => {
    if (takenAvatars.includes(newAvatar)) return;
    
    // Optimistically update localStorage
    const storedInfo = localStorage.getItem(`room_${roomId}_user`);
    if (storedInfo) {
      const parsed = JSON.parse(storedInfo);
      parsed.avatar = newAvatar;
      localStorage.setItem(`room_${roomId}_user`, JSON.stringify(parsed));
    }

    await handleAction("UPDATE_AVATAR", { userId, avatar: newAvatar });
    setIsEditingAvatar(false);
  };

  const handleOwnAvatarClick = () => {
    if (room?.isRevealed) return;
    const currentIndex = AVATARS.indexOf(currentUser?.avatar || "");
    if (currentIndex !== -1) {
      setAvatarPage(Math.floor(currentIndex / AVATARS_PER_PAGE));
    }
    setIsEditingAvatar(true);
    setIsEditingCards(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (type: string, payload?: any) => {
    // Optimistic UI update could be added here
    await fetch(`/api/room/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
    mutate(); // re-fetch immediately
  };

  const handleLeave = async () => {
    await handleAction("LEAVE", { userId });
    localStorage.removeItem(`room_${roomId}_user`);
    router.push("/");
  };

  const handleKick = async (targetUserId: string) => {
    await handleAction("LEAVE", { userId: targetUserId });
  };

  const [wasInRoom, setWasInRoom] = useState(false);

  useEffect(() => {
    if (!room?.users) return;
    
    const isCurrentlyInRoom = room.users.some(u => u.id === userId);
    
    if (isCurrentlyInRoom) {
      setWasInRoom(true);
    } else if (wasInRoom) {
      // Current user was kicked or removed
      localStorage.removeItem(`room_${roomId}_user`);
      router.push("/");
    }
  }, [room?.users, roomId, userId, router, wasInRoom]);

  const saveCardSet = async () => {
    const newCards = cardSetString
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
      
    if (newCards.length > 0) {
      await handleAction("UPDATE_CARD_SET", { cardSet: newCards });
    }
    setIsEditingCards(false);
  };

  if (error) {
    if (error.message === 'Room not found') {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
          <div className="text-xl font-semibold text-slate-300">Room not found</div>
          <p className="text-slate-500">The room you are looking for does not exist or has expired.</p>
          <button 
            onClick={() => {
              localStorage.removeItem(`room_${roomId}_user`);
              router.push('/');
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
          >
            Go back home
          </button>
        </div>
      );
    }
    return <div className="flex h-screen items-center justify-center">Failed to load room</div>;
  }
  if (!room) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <div className="text-slate-400 font-medium animate-pulse">Loading room...</div>
    </div>
  );

  const activeUsers = room.users.filter(u => !u.isSpectator);
  const spectators = room.users.filter(u => u.isSpectator);
  
  // Sort users if revealed
  let displayUsers = [...activeUsers];
  if (room.isRevealed) {
    displayUsers.sort((a, b) => {
      const valA = a.vote === "?" || a.vote === "☕" ? 999 : parseInt(a.vote || "0");
      const valB = b.vote === "?" || b.vote === "☕" ? 999 : parseInt(b.vote || "0");
      return valA - valB;
    });
  }

  // Calculate average (round up if .5 or higher)
  const votes = activeUsers.map(u => u.vote).filter(v => v !== null && v !== "?" && v !== "☕") as string[];
  const average = votes.length > 0 
    ? Math.round(votes.reduce((acc, val) => acc + parseInt(val), 0) / votes.length)
    : null;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 glass-panel p-4 px-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
            {room.name}
          </h1>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <Users className="w-4 h-4" /> {activeUsers.length} Voters | {spectators.length} Spectators
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Invite Players"}
          </button>
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 flex flex-col items-center">
        
        {/* Task Name Input Area */}
        <TaskNameInput roomId={roomId} initialTaskName={room.taskName || ""} mutate={mutate} />

        {/* Table/Board */}
        <div className="relative w-full max-w-4xl min-h-[400px] flex flex-col items-center justify-center mb-16">
          
          {/* Top Row Players */}
          <div className="flex justify-center gap-6 mb-8 flex-wrap">
            {displayUsers.slice(0, Math.ceil(displayUsers.length / 2)).map(user => (
              <PlayerCard key={user.id} user={user} isRevealed={room.isRevealed} currentUser={currentUser} onKick={handleKick} onAvatarClick={handleOwnAvatarClick} />
            ))}
          </div>

          {/* Center Table */}
          <div className="w-full max-w-2xl h-32 md:h-48 bg-blue-500/5 border border-blue-500/20 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.1)] flex items-center justify-center relative">
            {room.isRevealed ? (
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-white mb-2"
                >
                  {average || "-"}
                </motion.div>
                <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Average</div>
              </div>
            ) : (
              <button
                onClick={() => handleAction("REVEAL")}
                disabled={activeUsers.every(u => !u.vote) || room.isVotingClosed}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {room.isVotingClosed ? "Voting Closed" : "Reveal Cards"}
              </button>
            )}

            <div className="absolute -bottom-6 flex gap-3 z-10">
              {room.isRevealed && (
                <button
                  onClick={() => handleAction("RESET")}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-2 rounded-full flex items-center gap-2 transition-all shadow-xl"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Board
                </button>
              )}
              
              {/* Only show Toggle Voting if not revealed */}
              {!room.isRevealed && (
                <button
                  onClick={() => handleAction("TOGGLE_VOTING")}
                  className={`border px-6 py-2 rounded-full flex items-center gap-2 transition-all shadow-xl
                    ${room.isVotingClosed 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                >
                  {room.isVotingClosed ? "Resume Voting" : "Stop Voting"}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row Players */}
          <div className="flex justify-center gap-6 mt-12 flex-wrap">
            {displayUsers.slice(Math.ceil(displayUsers.length / 2)).map(user => (
              <PlayerCard key={user.id} user={user} isRevealed={room.isRevealed} currentUser={currentUser} onKick={handleKick} onAvatarClick={handleOwnAvatarClick} />
            ))}
          </div>

        </div>

        {/* Card Selection */}
        {!currentUser?.isSpectator && (
          <div className="w-full max-w-4xl mt-auto relative">
            <div className="flex justify-center items-center gap-3 mb-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                {isEditingCards ? "Edit Cards" : isEditingAvatar ? "Select New Avatar" : "Choose your card"}
              </h3>
              {!room.isRevealed && !isEditingCards && !isEditingAvatar && (
                <button
                  onClick={() => {
                    setCardSetString(currentCards.join(", "));
                    setIsEditingCards(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Edit Deck
                </button>
              )}
            </div>

            {isEditingAvatar ? (
              <div className="flex flex-col items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center w-full mb-2">
                  <div className="flex gap-2 items-center mx-auto">
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
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full content-start">
                  {displayedAvatars.map((a) => {
                    const isTaken = takenAvatars.includes(a);
                    const isCurrent = currentUser?.avatar === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleAvatarChange(a)}
                        disabled={isTaken || isCurrent}
                        className={`w-12 h-12 p-1 flex items-center justify-center rounded-xl transition-all overflow-hidden ${
                          isCurrent ? 'bg-blue-600 shadow-lg shadow-blue-500/30 scale-110 border border-blue-400' :
                          isTaken ? 'opacity-20 cursor-not-allowed grayscale' :
                          'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <img src={a} alt="Avatar" className="w-full h-full object-contain drop-shadow-md" />
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setIsEditingAvatar(false)}
                  className="mt-4 px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : isEditingCards ? (
              <div className="flex flex-col items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full max-w-2xl mx-auto">
                <p className="text-xs text-slate-400 text-center">
                  Enter cards separated by commas (e.g. 1, 2, 3, S, M, L)
                </p>
                <input
                  type="text"
                  value={cardSetString}
                  onChange={(e) => setCardSetString(e.target.value)}
                  placeholder="0, 1, 2, 3, 5, 8, 13, 21, ?, ☕"
                  className="w-full bg-black/30 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditingCards(false)}
                    className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCardSet}
                    disabled={!cardSetString.trim()}
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Save & Reset Votes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {currentCards.map((val: string) => (
                  <button
                    key={val}
                    onClick={() => handleAction("VOTE", { userId, vote: myVote === val ? null : val })}
                    disabled={room.isRevealed || room.isVotingClosed}
                    className={`
                      w-12 h-16 md:w-16 md:h-24 rounded-xl text-lg md:text-xl font-bold transition-all
                      flex items-center justify-center border-2 shadow-lg px-1 overflow-hidden
                      ${myVote === val 
                        ? 'bg-blue-600 border-blue-400 text-white -translate-y-4 shadow-blue-500/50' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:-translate-y-2'}
                      ${(room.isRevealed || room.isVotingClosed) ? 'opacity-50 cursor-not-allowed transform-none' : ''}
                    `}
                  >
                    <span className="truncate">{val}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      {spectators.length > 0 && (
        <div className="fixed bottom-4 left-4 flex gap-2">
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-400 flex items-center gap-2 backdrop-blur">
            <Eye className="w-3 h-3" />
            {spectators.length} Spectators
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ user, isRevealed, currentUser, onKick, onAvatarClick }: { user: any, isRevealed: boolean, currentUser?: any, onKick?: (userId: string) => void, onAvatarClick?: () => void }) {
  const hasVoted = user.vote !== null;
  const isCurrentUser = currentUser?.id === user.id;
  const canKick = currentUser?.name?.toLowerCase() === 'bk' && !isCurrentUser;

  return (
    <div className="flex flex-col items-center gap-3 relative group">
      {canKick && onKick && (
        <button
          onClick={(e) => { e.stopPropagation(); onKick(user.id); }}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
          title="Kick Player"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <div 
        onClick={() => {
          if (isCurrentUser && onAvatarClick && !isRevealed) {
            onAvatarClick();
          }
        }}
        className={`
        relative w-16 h-24 md:w-20 md:h-28 rounded-xl flex items-center justify-center shadow-lg transition-all overflow-hidden
        ${!hasVoted ? 'bg-slate-800/50 border-2 border-dashed border-slate-700' : 
          isRevealed ? 'bg-blue-600 border-2 border-blue-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400'}
        ${isCurrentUser && !isRevealed ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-105' : ''}
      `}
      >
        {/* Avatar positioned inside the card */}
        {user.avatar && (
          <div className="absolute inset-0 z-0 flex items-end justify-center p-1 pt-8 pointer-events-none">
            {user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-contain drop-shadow-2xl" />
            ) : (
              <span className="text-4xl">{user.avatar}</span>
            )}
          </div>
        )}

        {/* Vote positioned at the top */}
        <div className="absolute top-1 left-0 right-0 flex justify-center z-10">
          {isRevealed && hasVoted ? (
            <span className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{user.vote}</span>
          ) : hasVoted ? (
            <span className="w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse mt-2" />
          ) : null}
        </div>
      </div>
      <span className="text-sm font-medium text-slate-300 max-w-[100px] truncate text-center">
        {user.name}
      </span>
    </div>
  );
}
