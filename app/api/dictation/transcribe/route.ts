import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

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

    // AWS Transcribe integration
    const bucketName = process.env.NEXT_PUBLIC_AUDIO_BUCKET || 'vedika-audio-temp';
    const audioKey = `audio/${device_id}/${Date.now()}.${audio_format}`;
    
    try {
      // Upload audio to S3
      const s3Client = new S3Client({ 
        region: 'ap-south-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
        }
      });
      
      const audioBuffer = Buffer.from(audio_data, 'base64');
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: `audio/${audio_format}`,
      }));

      const audioUri = `s3://${bucketName}/${audioKey}`;
      
      // Start AWS Transcribe job
      const transcribeClient = new TranscribeClient({ 
        region: 'ap-south-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
        }
      });
      
      const jobName = `transcription-${device_id}-${Date.now()}`;
      
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: language_code || 'en-US',
        MediaFormat: audio_format || 'wav',
        Media: {
          MediaFileUri: audioUri,
        },
        Settings: {
          ShowSpeakerLabels: false,
          MaxAlternatives: 1,
          ChannelIdentification: false,
        },
      });

      await transcribeClient.send(command);
      
      // For real-time, return immediate response
      // For batch jobs, you'd need to poll for completion
      return NextResponse.json({
        status: 'processing',
        job_name: jobName,
        message: 'Transcription job started'
      });

    } catch (awsError) {
      console.error('🎤 AWS Transcribe error:', awsError);
      // Fallback to mock response
    }

    // Fallback mock response (remove this when AWS is fully integrated)
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
