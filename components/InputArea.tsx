import React, { useState, KeyboardEvent } from 'react';
import { Send, Loader2, Command } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 w-full z-20 bg-slate-50/80 backdrop-blur-sm p-4 border-t border-gray-200/50">
      <div className="max-w-4xl mx-auto relative">
        <div className="relative flex items-center shadow-lg shadow-indigo-900/5 rounded-full bg-white border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-300">
           
           <div className="pl-4 text-gray-400">
             <Command size={18} />
           </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, policies, or help..."
            disabled={isLoading}
            className="w-full bg-transparent text-gray-800 placeholder-gray-400 border-0 rounded-full py-4 pl-3 pr-14 focus:ring-0 focus:outline-none text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2.5 rounded-full transition-all duration-300 ease-out ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transform'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
            )}
          </button>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">
            Powered by Google Gemini & Fake Store API
          </p>
        </div>
      </div>
    </div>
  );
};