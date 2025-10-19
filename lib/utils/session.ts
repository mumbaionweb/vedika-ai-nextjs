/**
 * Session Management Utility
 * Handles device sessions for anonymous users
 */

import type { DeviceSession } from '../types/api';

const DEVICE_ID_KEY = 'vedika_device_id';
const SESSION_ID_KEY = 'vedika_session_id';

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `device_${random}_${timestamp}`;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create device session for anonymous users
 */
export function getOrCreateDeviceSession(): DeviceSession {
  // Check if running in browser
  if (typeof window === 'undefined') {
    // Server-side: return temporary session
    return {
      device_id: generateDeviceId(),
      session_id: generateUUID(),
    };
  }

  // Get existing device_id or create new one
  let device_id = localStorage.getItem(DEVICE_ID_KEY);
  if (!device_id) {
    device_id = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, device_id);
  }

  // Get existing session_id or create new one
  let session_id = localStorage.getItem(SESSION_ID_KEY);
  if (!session_id) {
    session_id = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, session_id);
  }

  return {
    device_id,
    session_id,
  };
}

/**
 * Clear device session (for logout or reset)
 */
export function clearDeviceSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
  }
}

/**
 * Get device ID only
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEVICE_ID_KEY);
}

/**
 * Get session ID only
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

