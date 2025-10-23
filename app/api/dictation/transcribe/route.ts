import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio_data, audio_format, language_code, device_id, enable_noise_cancellation, is_final } = body;

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
      isFinal: is_final,
      audioDataLength: audio_data?.length || 0
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock transcription result with different responses for interim vs final
    const mockTranscriptions = {
      interim: [
        'Hello...',
        'Hello, this...',
        'Hello, this is...',
        'Hello, this is a test...',
        'How are...',
        'How are you...',
        'How are you doing...',
        'Please speak...',
        'Please speak clearly...',
        'Testing the...',
        'Testing the enhanced...'
      ],
      final: [
        'Hello, this is a test transcription',
        'How are you doing today?',
        'This is the mobile dictation service',
        'Please speak clearly into your microphone',
        'Testing the enhanced dictation functionality'
      ]
    };

    const transcriptionArray = is_final ? mockTranscriptions.final : mockTranscriptions.interim;
    const randomTranscription = transcriptionArray[Math.floor(Math.random() * transcriptionArray.length)];

    // Faster response for interim results
    const processingDelay = is_final ? 1000 : 500;

    return NextResponse.json({
      status: 'completed',
      transcribed_text: randomTranscription,
      confidence: is_final ? 0.95 : 0.85,
      language_code: language_code,
      processing_time_ms: processingDelay,
      is_final: is_final
    });

  } catch (error) {
    console.error('🎤 Mobile dictation transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
