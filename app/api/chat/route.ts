import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📤 [API Route] Chat request:', {
      message: body.message,
      device_id: body.device_id,
      session_id: body.session_id,
      model_id: body.model_id,
    });
    
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('📡 [API Route] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Route] Chat API Error:', errorText);
      return NextResponse.json(
        { error: `Chat API error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Forward the response headers
    const headers = new Headers();
    const conversationId = response.headers.get('x-conversation-id');
    if (conversationId) {
      headers.set('x-conversation-id', conversationId);
    }
    
    console.log('✅ [API Route] Chat success, conversation ID:', conversationId);
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('❌ [API Route] Error in chat route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
