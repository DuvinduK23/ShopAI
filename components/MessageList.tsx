import React, { useEffect, useRef } from 'react';
import { ChatMessage, Sender } from '../types';
import { User, Bot, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: ChatMessage[];
  isThinking: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isThinking }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-in fade-in duration-700">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-indigo-100 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <Sparkles size={32} className="text-indigo-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Welcome to ShopAI</h2>
          <p className="text-center text-gray-500 max-w-xs mt-2 mb-8 text-sm">
            I can help you explore our collection, check prices, and explain our store policies.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
             <div className="group bg-white hover:bg-indigo-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">Product Search</span>
                </div>
                <p className="text-xs text-gray-500">"Show me the latest electronics"</p>
             </div>
             <div className="group bg-white hover:bg-emerald-50 p-4 rounded-xl border border-gray-200 hover:border-emerald-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700">Store Policy</span>
                </div>
                <p className="text-xs text-gray-500">"What is your return policy?"</p>
             </div>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`group flex w-full animate-in slide-in-from-bottom-2 duration-300 ${
            msg.sender === Sender.USER ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`flex max-w-[90%] md:max-w-[80%] ${
              msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'
            } gap-3 items-end`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                msg.sender === Sender.USER
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                  : msg.isError
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-white text-indigo-600 border border-indigo-100'
              }`}
            >
              {msg.sender === Sender.USER ? (
                <User size={14} />
              ) : msg.isError ? (
                <AlertCircle size={14} />
              ) : (
                <Bot size={14} />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.sender === Sender.USER
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-sm shadow-md'
                  : msg.isError
                  ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]'
              }`}
            >
              {msg.sender === Sender.BOT ? (
                 <div className="prose prose-sm prose-slate max-w-none 
                    prose-p:my-1 prose-ul:my-1 prose-li:my-0
                    prose-headings:text-gray-800 prose-headings:font-bold prose-headings:my-2
                    prose-strong:text-indigo-600 prose-strong:font-bold
                    prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            style={{ maxWidth: '120px', height: 'auto', borderRadius: '8px', margin: '8px 0' }}
                          />
                        )
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                 </div>
              ) : (
                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
              )}
              
              <div
                className={`text-[10px] mt-2 text-right opacity-70 ${
                  msg.sender === Sender.USER ? 'text-indigo-100' : 'text-gray-400'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex w-full justify-start animate-in fade-in duration-300">
          <div className="flex max-w-[80%] flex-row gap-3 items-end">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Bot size={14} />
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2.5">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-gray-400 font-medium tracking-wide">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};