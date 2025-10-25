'use client';

import { useState, useRef, useEffect } from 'react';
import { useDeepgramDictation } from '@/lib/services/deepgramDictationService';
import { Mic, MicOff, Square } from 'lucide-react';

export default function TestDictationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const { isListening, transcript: speechTranscript, startListening, stopListening, isSupported } = useDeepgramDictation();

  // Add log function
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Watch for transcript changes
  useEffect(() => {
    if (speechTranscript) {
      setTranscript(speechTranscript);
      addLog(`📝 Transcript: "${speechTranscript}"`);
    }
  }, [speechTranscript]);

  // Watch for listening state changes
  useEffect(() => {
    if (isListening) {
      addLog('🎤 Started listening');
      setIsRecording(true);
    } else {
      addLog('🛑 Stopped listening');
      setIsRecording(false);
    }
  }, [isListening]);

  const handleStart = async () => {
    try {
      addLog('🚀 Starting dictation...');
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      
      if (!isSupported()) {
        setError('Speech recognition not supported in this browser');
        addLog('❌ Browser not supported');
        return;
      }

      await startListening();
      addLog('✅ Dictation started successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      addLog(`❌ Error: ${errorMsg}`);
    }
  };

  const handleStop = () => {
    addLog('🛑 Stopping dictation...');
    stopListening();
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎤 Deepgram Speech-to-Text Test
        </h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${isRecording ? 'bg-red-100 border-red-300' : 'bg-gray-100 border-gray-300'} border-2`}>
            <div className="flex items-center gap-2">
              {isRecording ? <Mic className="w-5 h-5 text-red-500" /> : <MicOff className="w-5 h-5 text-gray-500" />}
              <span className="font-medium">
                {isRecording ? 'Recording' : 'Not Recording'}
              </span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-100 border-2 border-blue-300">
            <div className="flex items-center gap-2">
              <Square className="w-5 h-5 text-blue-500" />
              <span className="font-medium">
                {isListening ? 'Listening' : 'Not Listening'}
              </span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-green-100 border-2 border-green-300">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="font-medium">
                {isSupported() ? 'Supported' : 'Not Supported'}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleStart}
            disabled={isRecording}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isRecording 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <Mic className="w-5 h-5 inline mr-2" />
            Start Recording
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isRecording}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !isRecording 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <MicOff className="w-5 h-5 inline mr-2" />
            Stop Recording
          </button>
          
          <button
            onClick={clearLogs}
            className="px-6 py-3 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all"
          >
            Clear Logs
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <span className="font-medium text-red-700">Error:</span>
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Transcript</h2>
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 min-h-[100px]">
            {transcript ? (
              <p className="text-lg text-gray-900">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">No transcript yet. Click "Start Recording" and speak clearly.</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🧪 Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Start Recording" button</li>
            <li>Allow microphone access when prompted</li>
            <li>Speak clearly into your microphone</li>
            <li>Watch the transcript appear in real-time</li>
            <li>Check the logs below for detailed information</li>
          </ol>
        </div>

        {/* Debug Logs */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📊 Debug Logs</h2>
            <span className="text-sm text-gray-500">{logs.length} entries</span>
          </div>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Start recording to see activity.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Browser Info */}
        <div className="p-6 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Browser Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong>
              <p className="text-gray-600 break-all">{navigator.userAgent}</p>
            </div>
            <div>
              <strong>Media Devices:</strong>
              <p className="text-gray-600">
                {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}
              </p>
            </div>
            <div>
              <strong>WebSocket:</strong>
              <p className="text-gray-600">
                {typeof WebSocket !== 'undefined' ? '✅ Available' : '❌ Not Available'}
              </p>
            </div>
            <div>
              <strong>MediaRecorder:</strong>
              <p className="text-gray-600">
                {typeof MediaRecorder !== 'undefined' ? '✅ Available' : '❌ Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
