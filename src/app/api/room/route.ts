import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      console.log('Room creation failed: No name provided in body', body);
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    
    const room = await createRoom(name);
    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Room creation FATAL error:', error);
    // Return the actual error message so we can see it in the Network tab
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: error?.message || String(error) 
    }, { status: 400 });
  }
}
