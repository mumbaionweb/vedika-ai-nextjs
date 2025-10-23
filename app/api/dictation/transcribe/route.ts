import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio_data, audio_format, language_code, device_id, enable_noise_cancellation } = body;

    if (!audio_data) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // For now, return a mock response
    // In production, this would send the audio to AWS Transcribe or similar service
    console.log('🎤 Mobile dictation transcription request:', {
      audioFormat: audio_format,
      languageCode: language_code,
      deviceId: device_id,
      noiseCancellation: enable_noise_cancellation,
      audioDataLength: audio_data?.length || 0
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock transcription result
    const mockTranscriptions = [
      'Hello, this is a test transcription',
      'How are you doing today?',
      'This is the mobile dictation service',
      'Please speak clearly into your microphone',
      'Testing the enhanced dictation functionality'
    ];

    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    return NextResponse.json({
      status: 'completed',
      transcribed_text: randomTranscription,
      confidence: 0.95,
      language_code: language_code,
      processing_time_ms: 1000
    });

  } catch (error) {
    console.error('🎤 Mobile dictation transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
