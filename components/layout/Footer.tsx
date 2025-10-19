'use client';

import { useState } from 'react';

export default function Footer() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: Implement chat functionality
      console.log('Message sent:', message);
      setMessage('');
    }
  };

  return (
    <footer className="bg-white border-t border-secondary-200 p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Vedika AI anything..."
            className="w-full px-4 py-3 pr-12 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="text-xs text-secondary-500 text-center mt-2">
          Vedika AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </footer>
  );
}

