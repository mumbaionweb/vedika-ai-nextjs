'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agent: string;
  createdAt: string;
}

export default function ChatHistoryPage({ params }: ChatPageProps) {
  const { chatId } = params;
  const [chat, setChat] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load conversation from localStorage
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const foundChat = conversations.find((conv: Conversation) => conv.id === chatId);
    
    if (foundChat) {
      setChat(foundChat);
    } else {
      // Fallback to mock data for demo purposes
      const mockData = {
        '1': {
          id: '1',
          title: 'Sales Analysis Report',
          messages: [
            {
              id: '1',
              type: 'user' as const,
              content: 'Can you analyze our Q3 sales data and provide insights?',
              timestamp: '2 hours ago'
            },
            {
              id: '2',
              type: 'ai' as const,
              content: 'I\'ll analyze your Q3 sales data. Based on the data provided, I can see several key trends:\n\n1. **Revenue Growth**: 15% increase compared to Q2\n2. **Top Products**: Product A and Product C are leading performers\n3. **Geographic Performance**: North America region shows strongest growth\n\nWould you like me to dive deeper into any specific area?',
              timestamp: '2 hours ago'
            }
          ],
          agent: 'search',
          createdAt: new Date().toISOString()
        },
        '2': {
          id: '2',
          title: 'Project Planning Discussion',
          messages: [
            {
              id: '1',
              type: 'user' as const,
              content: 'Help me create a project timeline for our new product launch',
              timestamp: 'Yesterday'
            },
            {
              id: '2',
              type: 'ai' as const,
              content: 'I\'ll help you create a comprehensive project timeline for your product launch. Here\'s a suggested timeline:\n\n**Phase 1: Planning (Weeks 1-4)**\n- Market research and analysis\n- Define product requirements\n- Create project charter\n\n**Phase 2: Development (Weeks 5-12)**\n- Prototype development\n- Testing and iterations\n- Quality assurance\n\n**Phase 3: Launch Preparation (Weeks 13-16)**\n- Marketing campaign setup\n- Distribution channels\n- Final testing and bug fixes\n\nWould you like me to expand on any of these phases?',
              timestamp: 'Yesterday'
            }
          ],
          agent: 'research',
          createdAt: new Date().toISOString()
        }
      };
      
      const mockChat = mockData[chatId as keyof typeof mockData];
      if (mockChat) {
        setChat(mockChat);
      }
    }
    
    setLoading(false);
  }, [chatId]);

  // Auto-scroll to the latest message when chat loads or updates
  useEffect(() => {
    if (chat && messagesEndRef.current) {
      // Use setTimeout to ensure the DOM has been updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest' 
        });
      }, 100);
    }
  }, [chat]);

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Chat Not Found
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-secondary-600">
              The chat with ID "{chatId}" could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            {chat.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-secondary-600">
            <span>Agent: {chat.agent.charAt(0).toUpperCase() + chat.agent.slice(1)}</span>
            <span>•</span>
            <span>Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          {chat.messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs ${
                message.type === 'user' 
                  ? 'bg-gradient-to-br from-secondary-500 to-secondary-700' 
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}>
                {message.type === 'user' ? 'You' : 'AI'}
              </div>
              <div className={`flex-1 rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-secondary-100'
                  : 'bg-primary-50 border border-primary-200'
              }`}>
                <p className="text-secondary-900 whitespace-pre-line">
                  {message.content}
                </p>
                <p className="text-xs text-secondary-400 mt-2">
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
          {/* Invisible div at the end for scroll target */}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-6 bg-primary-50 border-2 border-primary-300 rounded-lg p-4">
          <p className="text-sm text-secondary-700">
            💡 <strong>Tip:</strong> Use the chatbox at the bottom to continue this conversation or start a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
