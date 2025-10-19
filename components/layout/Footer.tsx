'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('search');

  // Check if we're on a chat page
  const isChatPage = pathname?.startsWith('/chat/');
  const chatId = isChatPage ? pathname?.split('/chat/')[1] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isChatPage && chatId) {
      // Handle follow-up question on chat page
      await handleFollowUp(chatId);
    } else {
      // Handle new conversation (redirect to homepage)
      router.push('/');
    }

    setMessage('');
    setIsSubmitting(false);
  };

  const handleFollowUp = async (chatId: string) => {
    // Get existing conversations
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const conversationIndex = conversations.findIndex((conv: any) => conv.id === chatId);
    
    if (conversationIndex !== -1) {
      const conversation = conversations[conversationIndex];
      
      // Create new message objects
      const userMessage = {
        id: (conversation.messages.length + 1).toString(),
        type: 'user',
        content: message,
        timestamp: 'Just now'
      };

      const aiMessage = {
        id: (conversation.messages.length + 2).toString(),
        type: 'ai',
        content: generateFollowUpResponse(message, conversation.agent),
        timestamp: 'Just now'
      };

      // Add new messages to conversation
      conversation.messages.push(userMessage, aiMessage);
      
      // Update conversation in localStorage
      conversations[conversationIndex] = conversation;
      localStorage.setItem('conversations', JSON.stringify(conversations));
      
      // Reload the page to show updated conversation
      window.location.reload();
    }
  };

  // Generate follow-up response based on user message and agent type
  const generateFollowUpResponse = (userMessage: string, agent: string) => {
    const responses = {
      search: `Great follow-up question! Based on your previous query and this new question: "${userMessage}", here's what I found:

**Updated Search Results:**
• Expanded search to include 25 additional relevant sources
• Found 3 new notable insights related to your follow-up
• Cross-referenced with your original query for comprehensive analysis

**Additional Findings:**
1. **New Perspective**: This follow-up reveals an important angle we hadn't explored
2. **Enhanced Recommendations**: Updated strategy based on your specific clarification
3. **Next Steps**: Here are the refined action items considering both queries

Would you like me to dive deeper into any of these new insights or explore a different aspect?`,

      research: `Excellent follow-up! This additional question: "${userMessage}" has revealed some fascinating connections to your original research request.

**Extended Research Analysis:**
• Conducted deeper analysis across 75+ additional sources
• Identified 5 new patterns that weren't apparent in the initial research
• Found correlations between your original query and this follow-up

**Enhanced Research Insights:**
1. **Pattern Recognition**: The combination of both questions reveals a significant trend
2. **Risk Mitigation**: New strategies identified based on your clarification
3. **Opportunity Assessment**: Found 3 additional opportunities not visible before

**Updated Recommendations:**
Based on this expanded research, I recommend a modified approach that addresses both your original and follow-up concerns.

What other aspects would you like me to research in relation to these findings?`,

      agents: `Perfect! Your follow-up question: "${userMessage}" helps me better understand your needs. Let me connect you with additional specialist agents.

**Enhanced Agent Network:**
🤖 **Original Strategy Agent**: Still active and analyzing your follow-up
📊 **New: Data Visualization Agent**: Specialized in presenting complex insights
💼 **New: Implementation Agent**: Expert in executing multi-step strategies
📈 **New: Monitoring Agent**: Tracks progress and provides real-time updates

**Agent Collaboration Update:**
• Your original Strategy Agent is now collaborating with 3 additional specialists
• Cross-agent analysis shows 40% improvement in solution quality
• Integrated workflow now covers both your original and follow-up requirements

**Recommended Next Steps:**
1. Activate the Implementation Agent for immediate action
2. Set up Monitoring Agent for progress tracking
3. Schedule cross-agent review session

Which agent would you like to engage with first, or should I activate the full collaborative team?`
    };

    return responses[agent as keyof typeof responses] || responses.search;
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <footer className="bg-white p-4 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a Follow-up"
              className="w-full px-6 pt-6 pb-20 pr-16 rounded-2xl border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-secondary-400 placeholder:opacity-70"
              disabled={isSubmitting}
            />
            
            {/* Agent Selection Buttons - Left Bottom */}
            <div className="absolute left-3 bottom-3 flex gap-1">
              <button 
                type="button"
                onClick={() => handleAgentSelect('search')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'search' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                }`}
                aria-label="Search Agent"
                title="Search"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'search' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleAgentSelect('research')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'research' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                }`}
                aria-label="Research Agent"
                title="Research"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'research' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleAgentSelect('agents')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'agents' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                }`}
                aria-label="Agents"
                title="Agents"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'agents' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>

            {/* Submit Button - Right Bottom */}
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {isSubmitting ? (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
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
              )}
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}

