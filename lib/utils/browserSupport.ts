/**
 * Browser Support Utility
 * Detects browser capabilities for dictation and voice features
 */

export const checkBrowserSupport = () => {
  const capabilities = {
    speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    mediaRecorder: !!window.MediaRecorder,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    audioContext: !!window.AudioContext,
    websockets: !!window.WebSocket
  };

  console.log('🔍 Browser capabilities:', capabilities);
  return capabilities;
};

export const testNoiseCancellation = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      }
    });
    
    const track = stream.getAudioTracks()[0];
    const settings = track.getSettings();
    
    console.log('🎤 Noise cancellation settings:', {
      noiseSuppression: settings.noiseSuppression,
      echoCancellation: settings.echoCancellation,
      autoGainControl: settings.autoGainControl
    });
    
    return settings.noiseSuppression === true;
  } catch (error) {
    console.error('🎤 Noise cancellation test failed:', error);
    return false;
  }
};

export const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getMobileCapabilities = () => {
  return {
    isMobile: isMobile(),
    hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    hasMediaRecorder: !!window.MediaRecorder,
    hasAudioContext: !!window.AudioContext
  };
};