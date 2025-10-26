import { NextResponse } from 'next/server';

// Environment-specific API endpoints
// Production: https://api.vedika.ai.in
// Preprod: https://preprod.api.vedika.ai.in
// UAT: https://uat.api.vedika.ai.in
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
    console.log('🔗 [API Route] Backend URL:', `${API_BASE_URL}/ai/chat`);
    
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
      console.error('❌ [API Route] Response status:', response.status);
      return NextResponse.json(
        { error: `Chat API error: ${response.statusText}`, details: errorText },
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
    
    // Check if it's a fetch error (network issue)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - backend may be unreachable');
      console.error('💡 Backend URL:', `${API_BASE_URL}/ai/chat`);
      return NextResponse.json(
        { error: 'Unable to connect to backend API', details: error.message },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
