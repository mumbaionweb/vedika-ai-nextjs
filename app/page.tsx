export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      <div className="text-center space-y-8 p-8 max-w-4xl mx-auto w-full">
        {/* V.ai Logo */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-primary-400 drop-shadow-lg">
            V.ai
          </h1>
        </div>

        {/* Chat Box */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask me anything about your business or get help with your tasks."
                className="w-full px-6 pt-6 pb-20 pr-16 rounded-2xl border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-secondary-400 placeholder:opacity-70"
              />
              
              {/* Agent Selection Buttons - Left Bottom */}
              <div className="absolute left-3 bottom-3 flex gap-1">
                <button 
                  className="p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
                  aria-label="Search Agent"
                  title="Search"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button 
                  className="p-1.5 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors"
                  aria-label="Research Agent"
                  title="Research"
                >
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button 
                  className="p-1.5 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors"
                  aria-label="Agents"
                  title="Agents"
                >
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              </div>

              {/* Submit Button - Right Bottom */}
              <button
                className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
                aria-label="Send message"
              >
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
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start Suggestions */}
        <div className="w-full max-w-2xl mx-auto mt-6">
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-3">Try asking:</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200">
                "Help me analyze sales data"
              </button>
              <button className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200">
                "Create a project plan"
              </button>
              <button className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200">
                "Summarize this document"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

