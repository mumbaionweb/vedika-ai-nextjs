export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🔷 [AI Chat API] Request received:', {
      conversation_id: body.conversation_id,
      messageCount: body.messages?.length || 0,
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
      message: userMessage.substring(0, 50),
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
      return new Response(
        JSON.stringify({ 
          error: errorData.error || `Backend returned ${response.status}`,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('✅ [AI Chat API] Backend response received:', {
      conversation_id: data.conversation_id,
      has_message: !!data.message,
      content_length: data.message?.content?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Convert your backend response to AI SDK streaming format
    const assistantMessage = data.message?.content || '';
    const conversationId = data.conversation_id || '';
    const messageId = data.message?.message_id || `msg-${Date.now()}`;

    // Create a streaming response in the format AI SDK expects
    // Format: data: {...}\n\n for each chunk
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the message as a single chunk (since backend doesn't stream yet)
        const chunk = `0:${JSON.stringify(assistantMessage)}\n`;
        controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });

    // Return streaming response with conversation_id in headers
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': conversationId,
        'X-Message-Id': messageId,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
