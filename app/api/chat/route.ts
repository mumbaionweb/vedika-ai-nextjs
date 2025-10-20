import { StreamingTextResponse } from 'ai';
import { DeviceManager } from '@/lib/utils/deviceManager';

export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🔷 [AI Chat API] Request received:', {
      conversation_id: body.conversation_id,
      message: body.messages?.[body.messages.length - 1]?.content?.substring(0, 50),
      timestamp: new Date().toISOString(),
    });

    // Extract the latest user message from AI SDK format
    const messages = body.messages || [];
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';

    // Prepare request for your backend
    const backendRequest = {
      message: userMessage,
      conversation_id: body.conversation_id || undefined,
      device_id: body.device_id,
      session_id: body.session_id,
      request_type: body.request_type || 'anonymous',
      model_id: body.model_id || 'best',
      query_type: body.query_type || 'general',
    };

    console.log('📤 [AI Chat API] Sending to backend:', {
      url: `${BACKEND_URL}/ai/chat`,
      conversation_id: backendRequest.conversation_id,
      timestamp: new Date().toISOString(),
    });

    // Call your backend
    const response = await fetch(`${BACKEND_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      console.error('❌ [AI Chat API] Backend error:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [AI Chat API] Backend response received:', {
      conversation_id: data.conversation_id,
      has_message: !!data.message,
      timestamp: new Date().toISOString(),
    });

    // Convert your backend response to AI SDK format
    const aiSdkMessage = {
      id: data.message?.message_id || `msg-${Date.now()}`,
      role: 'assistant' as const,
      content: data.message?.content || '',
      createdAt: new Date(data.message?.timestamp || Date.now()),
    };

    // Create a ReadableStream for AI SDK (even though not streaming from backend yet)
    const stream = new ReadableStream({
      start(controller) {
        // Send the message content as a single chunk
        controller.enqueue(new TextEncoder().encode(aiSdkMessage.content));
        controller.close();
      },
    });

    // Return streaming response with conversation_id in headers
    return new StreamingTextResponse(stream, {
      headers: {
        'X-Conversation-Id': data.conversation_id || '',
        'X-Message-Id': aiSdkMessage.id,
      },
    });
  } catch (error: any) {
    console.error('❌ [AI Chat API] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

