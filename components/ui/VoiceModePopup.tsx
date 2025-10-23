'use client';

import { useState } from 'react';
import { X, Mic, MicOff, Settings } from 'lucide-react';

interface VoiceModePopupProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onSettings: () => void;
}

export default function VoiceModePopup({
  isOpen,
  onClose,
  isRecording,
  onToggleRecording,
  onSettings
}: VoiceModePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Voice Mode</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close voice mode"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Voice Status */}
        <div className="text-center mb-8">
          <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-100 animate-pulse' 
              : 'bg-gray-100'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isRecording 
                ? 'bg-red-500' 
                : 'bg-gray-400'
            }`}>
              {isRecording ? (
                <Mic className="w-10 h-10 text-white" />
              ) : (
                <MicOff className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          
          <p className="text-lg font-medium text-gray-800 mb-2">
            {isRecording ? 'Listening...' : 'Voice Mode Ready'}
          </p>
          
          <p className="text-sm text-gray-600">
            {isRecording 
              ? 'Speak naturally, the AI will respond' 
              : 'Click the microphone to start voice conversation'
            }
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute Button */}
          <button
            onClick={onToggleRecording}
            className={`p-4 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isRecording ? 'Stop listening' : 'Start listening'}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettings}
            className="p-4 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
            title="Voice settings"
          >
            <Settings className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">How to use Voice Mode:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click the microphone to start listening</li>
            <li>• Speak naturally in a conversational tone</li>
            <li>• The AI will respond with voice</li>
            <li>• Click the microphone again to stop</li>
            <li>• Use settings to configure voice preferences</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
