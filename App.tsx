import React, { useState, useCallback } from 'react';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { ChatMessage, Sender } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (text: string) => {
    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: Sender.USER,
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Call Gemini Service (Handles tools internally)
      const botResponseText = await sendMessageToGemini(text);

      // 3. Add Bot Message
      const botMsg: ChatMessage = {
        id: uuidv4(),
        sender: Sender.BOT,
        text: botResponseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      // Error handling
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        sender: Sender.BOT,
        text: error instanceof Error ? error.message : "An unexpected error occurred.",
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3 transition-all duration-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <ShoppingBag size={20} className="text-indigo-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">ShopAI</h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Virtual Assistant</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
             <Sparkles size={12} />
             <span>Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative max-w-4xl w-full mx-auto md:border-x md:border-gray-200/50 md:bg-white/50 md:shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
        <MessageList messages={messages} isThinking={isLoading} />
        
        {/* Helper gradient for scroll indication */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none md:hidden" />
      </main>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}