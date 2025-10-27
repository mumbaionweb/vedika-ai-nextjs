# Chat History Styling Issue

## Problem
The chatbox on the streaming page (`app/chat/page.tsx`) is missing the full UI features that were present before WebSocket implementation.

## Root Cause
When implementing WebSocket streaming, the chatbox was replaced with a basic input/submit button, losing:
- Sources (Web, Attach)
- Model dropdown
- Interaction Modes (Type, Dictation, Voice)
- Full styling (bg-stone-50, rounded-2xl, etc.)

## Reference Implementation
The full UI is in `app/chat/[chatId]/page.tsx` (lines 520-720), including:
- Full chatbox with all features
- Model dropdown with smart positioning
- All interaction modes
- Complete styling

## Solution
Copy the complete chatbox UI from `app/chat/[chatId]/page.tsx` to `app/chat/page.tsx`

