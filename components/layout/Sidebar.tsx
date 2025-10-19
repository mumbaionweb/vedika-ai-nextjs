'use client';

import { useState } from 'react';
import type { SidebarProps, User } from '@/types';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Mock user data - will be replaced with real authentication later
  const [user] = useState<User>({
    isGuest: true,
    name: 'Guest User',
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static
          inset-y-0 left-0
          z-50
          w-64 lg:w-[3%]
          min-w-[240px] lg:min-w-[70px]
          bg-gradient-to-br from-primary-50 via-white to-primary-50
          text-secondary-900
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
          h-screen
        `}
      >
        {/* Top Section - Logo & New Chat */}
        <div className="p-4 border-b border-primary-300">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="text-3xl font-bold text-primary-400 drop-shadow-lg">
              V.ai
            </div>
          </div>

          {/* New Chat Button */}
          <button 
            className="w-full flex items-center justify-center p-3 bg-white hover:bg-primary-50 rounded-lg transition-colors group shadow-sm border border-primary-200"
            aria-label="New Chat"
            title="New Chat"
          >
            <svg
              className="w-6 h-6 text-primary-400 group-hover:text-primary-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Middle Section - Navigation/Chat History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-2">
            {/* Chat history will go here */}
            <p className="text-secondary-600 text-sm text-center mt-8">
              No chat history yet
            </p>
          </div>
        </div>

        {/* Bottom Section - Profile */}
        <div className="p-4 border-t border-primary-300">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-colors cursor-pointer border border-transparent hover:border-primary-200">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {user.isGuest ? 'G' : user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* User Info - Below Avatar */}
            <div className="text-center">
              <p className="text-xs text-secondary-600">
                {user.isGuest ? 'Guest' : 'Active'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

