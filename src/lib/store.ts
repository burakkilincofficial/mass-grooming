import { kv } from '@vercel/kv';
import { Room } from './types';

const PREFIX = 'room:';

export const getRoom = async (id: string): Promise<Room | null> => {
  try {
    const room = await kv.get<Room>(`${PREFIX}${id}`);
    return room;
  } catch (error) {
    console.error('Failed to get room from KV:', error);
    return null;
  }
};

export const createRoom = async (name: string): Promise<Room> => {
  const id = Math.random().toString(36).substring(2, 9);
  const newRoom: Room = {
    id,
    name,
    users: [],
    isRevealed: false,
    isVotingClosed: false,
    createdAt: Date.now(),
  };
  
  // Set room with 24-hour expiration (86400 seconds)
  await kv.set(`${PREFIX}${id}`, newRoom, { ex: 86400 });
  return newRoom;
};

export const updateRoom = async (id: string, room: Room): Promise<void> => {
  // Keep the same expiration (it resets to 24h on every update for simplicity, or we can just use normal set)
  await kv.set(`${PREFIX}${id}`, room, { ex: 86400 });
};
