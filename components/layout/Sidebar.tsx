'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/lib/services/api';
import type { Conversation } from '@/lib/types/api';
import type { SidebarProps, User } from '@/types';
import VaiLogo from '../ui/VaiLogo';


export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Mock user data - will be replaced with real authentication later
  const [user] = useState<User>({
    isGuest: true,
    name: 'Guest User',
  });

  const [showChatHistory, setShowChatHistory] = useState(false);
  const [activeOptionsMenu, setActiveOptionsMenu] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadChatHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const result = await apiService.listConversations(5); // Load latest 5 conversations
      
      if (result.success) {
        setChatHistory(result.data.conversations);
        console.log('✅ Loaded chat history:', result.data.conversations.length, 'conversations');
      } else {
        console.error('Failed to load chat history:', result.error);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-options-menu]') && !target.closest('[data-three-dots]')) {
        setActiveOptionsMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Load chat history on initial component mount
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Format timestamp with relative time display
  function formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      // Handle future dates (shouldn't happen but just in case)
      if (diffMs < 0) {
        return 'Just now';
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // For older dates, show the actual date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid Date';
    }
  }

  const handleNewChat = () => {
    router.push('/');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleViewAll = () => {
    router.push('/chat/history');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const result = await apiService.deleteConversation(chatId);
      
      if (result.success) {
        // Remove from local state
        setChatHistory(prev => prev.filter(chat => chat.conversation_id !== chatId));
        console.log('✅ Chat deleted successfully');
      } else {
        console.error('Failed to delete chat:', result.error);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setActiveOptionsMenu(null);
    }
  };

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
          w-full lg:w-[3%]
          min-w-[100vw] lg:min-w-[70px]
          bg-gradient-to-br from-primary-50 via-white to-primary-50
          text-secondary-900
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
          h-screen main-layout
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden p-4 flex justify-between items-center border-b border-primary-200">
          <div className="text-xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 text-transparent bg-clip-text">
            V.ai
          </div>
          <button onClick={onClose} className="p-2" aria-label="Close menu">
            <svg
              className="w-6 h-6 text-secondary-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        {/* Top Section - Logo & New Chat */}
        <div className="p-4">
          {/* Logo - Desktop */}
          <div className="hidden lg:flex items-center justify-center mb-6">
            <div className="text-xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 text-transparent bg-clip-text drop-shadow-lg">
              V.ai
            </div>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={handleNewChat}
            className="w-full lg:w-7 h-7 mx-auto mt-4 lg:mt-16 flex items-center justify-center lg:justify-center p-1 bg-white hover:bg-primary-50 rounded-lg transition-colors group shadow-sm border border-primary-200"
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
            <span className="ml-3 text-sm font-semibold lg:hidden">New Chat</span>
          </button>

          {/* Chat Button with Submenu */}
          <div 
            className="relative"
            onMouseEnter={() => {
              console.log('🖱️ Mouse entered chat button area');
              setShowChatHistory(true);
            }}
            onMouseLeave={() => {
              console.log('🖱️ Mouse left chat button area');
              setShowChatHistory(false);
              setActiveOptionsMenu(null); // Close options menu when leaving submenu
            }}
          >
            <button 
              className="w-full lg:w-7 h-7 mx-auto mt-4 flex items-center justify-center lg:justify-center p-1 bg-white hover:bg-primary-50 rounded-lg transition-colors group shadow-sm border border-primary-200"
              aria-label="Chat"
              title="Chat"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="ml-3 text-sm font-semibold lg:hidden">Chat History</span>
            </button>

            {/* Chat History Submenu - DESKTOP */}
            {showChatHistory && (
              <div className="absolute left-full top-0 -ml-1 w-56 bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden hidden lg:block">
                {/* Submenu Header */}
                <div className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                  <h3 className="text-[10px] font-semibold text-secondary-600 uppercase tracking-wider">History</h3>
                </div>

                {/* Chat History List */}
                <div className="py-0 max-h-64 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="px-3 py-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <p className="text-[10px] text-secondary-400 mt-2">Loading...</p>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-[10px] text-secondary-400">No conversations yet</p>
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.conversation_id}
                        className="relative group/item px-3 py-1.5 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all cursor-pointer border-l-2 border-transparent hover:border-primary-400"
                        onClick={() => handleChatClick(chat.conversation_id)}
                      >
                        <div className="pr-5">
                          <p className="text-xs font-medium text-secondary-900 truncate leading-tight">{chat.title || chat.topic || 'Untitled'}</p>
                          <p className="text-[10px] text-secondary-400 mt-0.5 leading-none">{formatTimestamp(chat.updated_at)}</p>
                        </div>

                        {/* Three Dots Menu */}
                        <button
                          data-three-dots
                          className="absolute right-1 top-1.5 p-0.5 rounded hover:bg-white opacity-0 group-hover/item:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveOptionsMenu(activeOptionsMenu === chat.conversation_id ? null : chat.conversation_id);
                          }}
                          aria-label="Chat options"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-secondary-400 hover:text-secondary-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {/* Options Submenu - Slides out from three dots */}
                        {activeOptionsMenu === chat.conversation_id && (
                          <div 
                            data-options-menu
                            className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-30 min-w-[100px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.conversation_id);
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* View All Link */}
                <div className="border-t border-gray-100 px-3 py-1.5 bg-gray-50">
                  <button
                    onClick={handleViewAll}
                    className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
                  >
                    View All →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat History Submenu - MOBILE */}
        <div className="lg:hidden mt-2 w-full px-4">
          <div className="w-full bg-white rounded-lg shadow-inner border border-gray-100 z-50 overflow-hidden">
            {/* Submenu Header */}
            <div className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
              <h3 className="text-[10px] font-semibold text-secondary-600 uppercase tracking-wider">History</h3>
            </div>
            {/* Chat History List */}
            <div className="py-0 max-h-64 overflow-y-auto">
              {loadingHistory ? (
                <div className="px-3 py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <p className="text-[10px] text-secondary-400 mt-2">Loading...</p>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[10px] text-secondary-400">No conversations yet</p>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.conversation_id}
                    className="relative group/item px-3 py-1.5 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all cursor-pointer border-l-2 border-transparent hover:border-primary-400"
                    onClick={() => handleChatClick(chat.conversation_id)}
                  >
                    <div className="pr-5">
                      <p className="text-xs font-medium text-secondary-900 truncate leading-tight">{chat.title || chat.topic || 'Untitled'}</p>
                      <p className="text-[10px] text-secondary-400 mt-0.5 leading-none">{formatTimestamp(chat.updated_at)}</p>
                    </div>
                    {/* Options menu for mobile can be added here if needed */}
                  </div>
                ))
              )}
            </div>
            {/* View All Link */}
            <div className="border-t border-gray-100 px-3 py-1.5 bg-gray-50">
              <button
                onClick={handleViewAll}
                className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
              >
                View All →
              </button>
            </div>
          </div>
        </div>

        {/* Middle Section - Navigation/Chat History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-2">
            {/* Chat history will go here */}
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

