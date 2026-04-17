import { Redis } from '@upstash/redis';
import { Room } from './types';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const PREFIX = 'room:';

export const getRoom = async (id: string): Promise<Room | null> => {
  try {
    const room = await redis.get<Room>(`${PREFIX}${id}`);
    return room;
  } catch (error) {
    console.error('Failed to get room from Upstash Redis:', error);
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
  await redis.set(`${PREFIX}${id}`, newRoom, { ex: 86400 });
  return newRoom;
};

export const updateRoom = async (id: string, room: Room): Promise<void> => {
  await redis.set(`${PREFIX}${id}`, room, { ex: 86400 });
};
