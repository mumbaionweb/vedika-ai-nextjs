export default function ChatPage() {
  return (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Chat with Vedika AI
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          {/* Sample chat messages */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs">
              You
            </div>
            <div className="flex-1 bg-secondary-100 rounded-lg p-3">
              <p className="text-secondary-900">
                Hello! How can you help me today?
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs">
              AI
            </div>
            <div className="flex-1 bg-primary-50 rounded-lg p-3 border border-primary-200">
              <p className="text-secondary-900">
                Hello! I'm Vedika AI, your enterprise AI assistant. I can help you with:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-secondary-700">
                <li>Answering questions about your business data</li>
                <li>Analyzing documents and reports</li>
                <li>Providing insights and recommendations</li>
                <li>Automating workflows and tasks</li>
              </ul>
              <p className="mt-2 text-secondary-900">
                What would you like to explore?
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-primary-50 border-2 border-primary-300 rounded-lg p-4">
          <p className="text-sm text-secondary-700">
            💡 <strong>Tip:</strong> Use the chatbox at the bottom to continue the conversation. The footer with chatbox appears on all pages except the homepage.
          </p>
        </div>
      </div>
    </div>
  );
}

