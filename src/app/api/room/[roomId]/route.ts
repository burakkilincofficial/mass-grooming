import { NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/store';
import { Room, User } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await params;
  const room = await getRoom(resolvedParams.roomId);
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json(room);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await params;
  const room = await getRoom(resolvedParams.roomId);
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  try {
    const action = await request.json();
    
    if (action.type === 'JOIN') {
      const { user } = action.payload as { user: User };
      const existingUser = room.users.find(u => u.id === user.id);
      if (!existingUser) {
        room.users.push(user);
      } else {
        existingUser.name = user.name;
        existingUser.isSpectator = user.isSpectator;
      }
    }
    
    if (action.type === 'VOTE') {
      const { userId, vote } = action.payload as { userId: string, vote: string | null };
      const user = room.users.find(u => u.id === userId);
      if (user && !user.isSpectator && !room.isVotingClosed) {
        user.vote = vote;
      }
    }
    
    if (action.type === 'TOGGLE_VOTING') {
      room.isVotingClosed = !room.isVotingClosed;
    }
    
    if (action.type === 'REVEAL') {
      room.isRevealed = true;
    }
    
    if (action.type === 'RESET') {
      room.isRevealed = false;
      room.isVotingClosed = false;
      room.users.forEach(u => {
        u.vote = null;
      });
    }

    if (action.type === 'LEAVE') {
      const { userId } = action.payload as { userId: string };
      room.users = room.users.filter(u => u.id !== userId);
    }

    await updateRoom(resolvedParams.roomId, room);
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
