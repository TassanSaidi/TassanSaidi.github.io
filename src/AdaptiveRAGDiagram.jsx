import React, { useState } from 'react';

const AdaptiveRAGDiagram = () => {
  const [activeView, setActiveView] = useState('pipeline');
  
  const views = {
    pipeline: 'RAG Pipeline',
    multilingual: 'Multilingual Flow',
    evolution: 'Project Evolution',
    architecture: 'Architecture'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold text-center mb-2">Adaptive RAG System</h1>
      <p className="text-slate-400 text-center mb-8">Interactive Architecture Diagrams</p>
      
      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {Object.entries(views).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeView === key 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* RAG Pipeline View */}
      {activeView === 'pipeline' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">RAG Pipeline Flow</h2>
            
            <div className="space-y-4">
              {/* User Query */}
              <div className="flex items-center gap-4">
                <div className="w-40 bg-green-600 rounded-lg p-3 text-center font-medium">
                  User Query
                </div>
                <div className="text-2xl">→</div>
                <div className="flex-1 bg-slate-700 rounded-lg p-3 text-sm">
                  "What is the capital of France?"
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-slate-500">↓</div>
              </div>

              {/* Embedding */}
              <div className="flex items-center gap-4">
                <div className="w-40 bg-purple-600 rounded-lg p-3 text-center font-medium">
                  Embed Query
                </div>
                <div className="text-2xl">→</div>
                <div className="flex-1 bg-slate-700 rounded-lg p-3 text-sm font-mono">
                  [0.023, -0.156, 0.892, ... ] <span className="text-slate-400">(384 dims)</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-slate-500">↓</div>
              </div>

              {/* FAISS Search */}
              <div className="flex items-center gap-4">
                <div className="w-40 bg-orange-600 rounded-lg p-3 text-center font-medium">
                  FAISS Search
                </div>
                <div className="text-2xl">→</div>
                <div className="flex-1 bg-slate-700 rounded-lg p-3">
                  <div className="text-sm text-slate-400 mb-2">Top 3 matches from 130K vectors:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>📄 "Paris is the capital of France..."</span>
                      <span className="text-green-400">0.12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📄 "France is a country in Europe..."</span>
                      <span className="text-yellow-400">0.34</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📄 "The Eiffel Tower is located..."</span>
                      <span className="text-orange-400">0.45</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-slate-500">↓</div>
              </div>

              {/* LLM Generation */}
              <div className="flex items-center gap-4">
                <div className="w-40 bg-blue-600 rounded-lg p-3 text-center font-medium">
                  LLM + Context
                </div>
                <div className="text-2xl">→</div>
                <div className="flex-1 bg-slate-700 rounded-lg p-3 text-sm">
                  <div className="text-slate-400 mb-1">Prompt includes retrieved context</div>
                  <div className="text-green-400">"The capital of France is Paris."</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-400">
                <strong className="text-white">Key Insight:</strong> The LLM doesn't need to "remember" facts. 
                We give it the facts at query time, and it synthesizes a response.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multilingual View */}
      {activeView === 'multilingual' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">Adaptive Multilingual Pipeline</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Input Column */}
              <div className="space-y-4">
                <div className="text-center text-slate-400 text-sm font-medium">INPUT LAYER</div>
                <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                  <div className="text-green-400 text-sm mb-2">Shona Query</div>
                  <div className="font-medium">"Guta guru reFrance nderipi?"</div>
                </div>
                <div className="flex justify-center">
                  <div className="text-2xl text-slate-500">↓</div>
                </div>
                <div className="bg-purple-600/20 border border-purple-600 rounded-lg p-4">
                  <div className="text-purple-400 text-sm mb-2">Language Detected</div>
                  <div className="font-mono">sn (Shona)</div>
                </div>
                <div className="flex justify-center">
                  <div className="text-2xl text-slate-500">↓</div>
                </div>
                <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
                  <div className="text-blue-400 text-sm mb-2">Translate → English</div>
                  <div className="font-medium">"What is the capital of France?"</div>
                </div>
              </div>

              {/* Processing Column */}
              <div className="space-y-4">
                <div className="text-center text-slate-400 text-sm font-medium">PROCESSING LAYER</div>
                <div className="bg-orange-600/20 border border-orange-600 rounded-lg p-4 h-full flex flex-col justify-center">
                  <div className="text-orange-400 text-sm mb-2 text-center">English Knowledge Base</div>
                  <div className="text-center text-4xl mb-2">🗄️</div>
                  <div className="text-center text-sm text-slate-400">130K Wikipedia passages</div>
                  <div className="mt-4 space-y-2">
                    <div className="bg-slate-700 rounded p-2 text-xs">
                      Embed query in English
                    </div>
                    <div className="bg-slate-700 rounded p-2 text-xs">
                      Search FAISS index
                    </div>
                    <div className="bg-slate-700 rounded p-2 text-xs">
                      Retrieve top-k contexts
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Column */}
              <div className="space-y-4">
                <div className="text-center text-slate-400 text-sm font-medium">OUTPUT LAYER</div>
                <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
                  <div className="text-blue-400 text-sm mb-2">English Context</div>
                  <div className="text-sm">"Paris is the capital of France, located on the Seine river..."</div>
                </div>
                <div className="flex justify-center">
                  <div className="text-2xl text-slate-500">↓</div>
                </div>
                <div className="bg-purple-600/20 border border-purple-600 rounded-lg p-4">
                  <div className="text-purple-400 text-sm mb-2">LLM Generation</div>
                  <div className="text-sm">"Answer in Shona using context"</div>
                </div>
                <div className="flex justify-center">
                  <div className="text-2xl text-slate-500">↓</div>
                </div>
                <div className="bg-green-600/20 border border-green-600 rounded-lg p-4">
                  <div className="text-green-400 text-sm mb-2">Shona Response</div>
                  <div className="font-medium">"Guta guru reFrance ndiParis..."</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-400">
                <strong className="text-white">Key Insight:</strong> Use English as the internal "lingua franca". 
                This gives access to massive English knowledge bases while serving users in their native language.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolution View */}
      {activeView === 'evolution' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">Project Evolution</h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-600"></div>
              
              <div className="space-y-8">
                {/* Phase 1 */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center font-bold text-xl z-10">1</div>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4">
                    <div className="text-red-400 font-medium mb-2">Simple Chat (50 lines)</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Terminal-based interface</li>
                      <li>• Direct Gemini API calls</li>
                      <li>• Shona system prompt</li>
                      <li>• No retrieval, no persistence</li>
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">Files: app.py (50 lines)</div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center font-bold text-xl z-10">2</div>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4">
                    <div className="text-yellow-400 font-medium mb-2">RAG with Fikira Dataset</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Added FAISS vector store</li>
                      <li>• Used vamboai/fikira (5K Shona examples)</li>
                      <li>• Multilingual embeddings</li>
                      <li>• Streamlit UI</li>
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">Files: 8 Python modules</div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center font-bold text-xl z-10">3</div>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4">
                    <div className="text-green-400 font-medium mb-2">SQuAD + Translation Pipeline</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Switched to SQuAD 2.0 (130K examples)</li>
                      <li>• Added translation layer (Shona ↔ English)</li>
                      <li>• Lightweight embeddings (all-MiniLM-L6-v2)</li>
                      <li>• Multi-provider support</li>
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">26x more knowledge coverage</div>
                  </div>
                </div>

                {/* Phase 4 */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl z-10">4</div>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4">
                    <div className="text-blue-400 font-medium mb-2">Project Reorganization</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Proper src/ structure</li>
                      <li>• Separated concerns (core, ui, data)</li>
                      <li>• CLI flags for configuration</li>
                      <li>• Terminal + Web interfaces</li>
                    </ul>
                    <div className="mt-2 text-xs text-slate-500">Production-ready structure</div>
                  </div>
                </div>

                {/* Future */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl z-10">?</div>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4 border-2 border-dashed border-purple-600">
                    <div className="text-purple-400 font-medium mb-2">Future: SA Languages</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Zulu, Xhosa, Afrikaans, Sesotho...</li>
                      <li>• Automatic language detection</li>
                      <li>• Per-language response generation</li>
                      <li>• 35M+ additional potential users</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architecture View */}
      {activeView === 'architecture' && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-400">System Architecture</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Local Components */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-center font-medium text-green-400 mb-4 flex items-center justify-center gap-2">
                  <span className="text-2xl">💻</span> Your Machine
                </div>
                
                <div className="space-y-3">
                  <div className="bg-slate-600 rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">Python Orchestrator</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-700 rounded p-2">📊 FAISS Index</div>
                      <div className="bg-slate-700 rounded p-2">🔢 Embeddings</div>
                      <div className="bg-slate-700 rounded p-2">🔄 Pipeline</div>
                      <div className="bg-slate-700 rounded p-2">💬 Chat Service</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center text-slate-500">↕️</div>
                  
                  <div className="bg-purple-600/30 border border-purple-600 rounded-lg p-3">
                    <div className="font-medium text-sm mb-2 text-purple-300">LM Studio (Optional)</div>
                    <div className="text-xs text-slate-400">
                      localhost:1234 • Qwen 2.5 7B • Free & Private
                    </div>
                  </div>
                </div>
              </div>

              {/* Cloud Components */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-center font-medium text-blue-400 mb-4 flex items-center justify-center gap-2">
                  <span className="text-2xl">☁️</span> Cloud (Optional)
                </div>
                
                <div className="space-y-3">
                  <div className="bg-green-600/30 border border-green-600 rounded-lg p-3">
                    <div className="font-medium text-sm mb-1 text-green-300">OpenAI API</div>
                    <div className="text-xs text-slate-400">GPT-4o-mini • Best quality • Paid</div>
                  </div>
                  
                  <div className="bg-blue-600/30 border border-blue-600 rounded-lg p-3">
                    <div className="font-medium text-sm mb-1 text-blue-300">Google Gemini</div>
                    <div className="text-xs text-slate-400">Gemini 2.5 Flash Lite • Free tier</div>
                  </div>
                  
                  <div className="bg-orange-600/30 border border-orange-600 rounded-lg p-3">
                    <div className="font-medium text-sm mb-1 text-orange-300">HuggingFace</div>
                    <div className="text-xs text-slate-400">SQuAD 2.0 Dataset • 130K examples</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">~15ms</div>
                <div className="text-xs text-slate-400">Embedding</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">~5ms</div>
                <div className="text-xs text-slate-400">FAISS Search</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">1-5s</div>
                <div className="text-xs text-slate-400">LLM Generation</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">130K</div>
                <div className="text-xs text-slate-400">Indexed Passages</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-400">
                <strong className="text-white">Flexibility:</strong> Switch between local (free, private) and cloud (higher quality) 
                with a single CLI flag. No code changes required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-slate-500 text-sm">
        Interactive diagrams for "I Built an Adaptive RAG Chatbot" blog post
      </div>
    </div>
  );
};

export default AdaptiveRAGDiagram;
