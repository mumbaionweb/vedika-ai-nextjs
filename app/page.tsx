'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('search');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a mock conversation ID
  const generateConversationId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate new conversation ID
    const conversationId = generateConversationId();
    
    // Store the conversation data in localStorage for the mockup
    const conversationData = {
      id: conversationId,
      title: message.length > 50 ? message.substring(0, 50) + '...' : message,
      messages: [
        {
          id: '1',
          type: 'user',
          content: message,
          timestamp: 'Just now'
        },
        {
          id: '2',
          type: 'ai',
          content: generateMockResponse(message, selectedAgent),
          timestamp: 'Just now'
        }
      ],
      agent: selectedAgent,
      createdAt: new Date().toISOString()
    };

    // Store in localStorage (in real app, this would be sent to backend)
    const existingConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    existingConversations.unshift(conversationData);
    localStorage.setItem('conversations', JSON.stringify(existingConversations));

    // Redirect to the chat page
    router.push(`/chat/${conversationId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Generate mock AI response based on user message and selected agent
  const generateMockResponse = (userMessage: string, agent: string) => {
    const responses = {
      search: `I've analyzed your query: "${userMessage}". Here are the key insights I found:

**Search Results Summary:**
• Found 15 relevant documents related to your query
• Top matches show high relevance scores (85-95%)
• Most recent information updated 2 days ago

**Key Findings:**
1. **Primary Topic**: Your query aligns with current industry best practices
2. **Recommendations**: Based on the search results, I recommend focusing on the top 3 approaches
3. **Next Steps**: Consider implementing the suggested framework within the next 2 weeks

Would you like me to dive deeper into any specific aspect of these results?`,

      research: `Based on your research request: "${userMessage}", I've conducted a comprehensive analysis:

**Research Methodology:**
• Analyzed 50+ sources across academic journals and industry reports
• Cross-referenced data from multiple databases
• Applied statistical analysis to identify patterns

**Key Research Findings:**
1. **Market Trends**: The data shows a 23% growth trend in this area over the past year
2. **Competitive Analysis**: Top 5 companies are using similar strategies with varying success rates
3. **Risk Assessment**: Identified 3 potential challenges and mitigation strategies

**Detailed Insights:**
The research reveals that companies implementing this approach see an average 40% improvement in efficiency. However, success depends on proper execution and stakeholder alignment.

What specific aspect would you like me to research further?`,

      agents: `I understand you're looking for assistance with: "${userMessage}". Let me connect you with the right AI agents:

**Agent Specialists Available:**
🤖 **Data Analysis Agent**: Can help with metrics, KPIs, and data visualization
📊 **Strategy Agent**: Specializes in business planning and competitive analysis  
💼 **Operations Agent**: Expert in process optimization and workflow management
📈 **Growth Agent**: Focuses on scaling strategies and market expansion

**Recommended Agent Match:**
Based on your query, I recommend connecting with the **Strategy Agent** who has 95% success rate with similar requests.

**Agent Capabilities:**
• Real-time collaboration with multiple AI specialists
• Cross-agent knowledge sharing
• Integrated workflow management
• 24/7 availability for complex projects

Would you like me to activate the Strategy Agent or would you prefer to work with a different specialist?`
    };

    return responses[agent as keyof typeof responses] || responses.search;
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
  };
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      <div className="text-center space-y-8 p-8 max-w-4xl mx-auto w-full">
        {/* V.ai Logo */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 text-transparent bg-clip-text drop-shadow-lg">
            V.ai
          </h1>
        </div>

        {/* Chat Box */}
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business or get help with your tasks."
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
              </div>
            </div>
          </form>
        </div>

        {/* Quick Start Suggestions */}
        <div className="w-full max-w-2xl mx-auto mt-6">
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-3">Try asking:</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button 
                onClick={() => setMessage('Help me analyze sales data')}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200"
              >
                &ldquo;Help me analyze sales data&rdquo;
              </button>
              <button 
                onClick={() => setMessage('Create a project plan')}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200"
              >
                &ldquo;Create a project plan&rdquo;
              </button>
              <button 
                onClick={() => setMessage('Summarize this document')}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200"
              >
                &ldquo;Summarize this document&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

