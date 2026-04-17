import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    const room = await createRoom(name);
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
