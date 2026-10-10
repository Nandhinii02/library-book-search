import React, { useState } from 'react';
import { Book } from '../types/book';
import { sendChatMessage } from '../services/api';
import { MessageSquare, X, Send, Sparkles, BookOpen, Minimize2 } from 'lucide-react';

interface FloatingChatDrawerProps {
  onSelectBook: (book: Book) => void;
}

export const FloatingChatDrawer: React.FC<FloatingChatDrawerProps> = ({ onSelectBook }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; books?: Book[] }[]>([
    {
      role: 'assistant',
      content: 'Hi! Need quick help checking a shelf location, comparing books, or finding beginner titles? Ask me here.',
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(q, history);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          books: res.retrievedBooks,
        },
      ]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message || 'Unable to connect to assistant'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 rounded-full bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 hover:scale-105 transition-all group"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-pulse"></span>
          </div>
          <span>Ask Library Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div>
                <h4 className="font-serif-title text-xs font-bold text-white">Smart Library Assistant</h4>
                <p className="text-[10px] text-slate-400">RAG Grounded &bull; Active</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                {m.books && m.books.length > 0 && (
                  <div className="mt-2 space-y-1 w-full">
                    {m.books.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBook(b)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 cursor-pointer flex items-center justify-between text-[11px] shadow-2xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-slate-900 truncate block">{b.title}</span>
                          <span className="text-slate-500 text-[10px] font-mono-code">{b.shelfLocation}</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-semibold flex-shrink-0">View &rarr;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                <span>Checking catalog...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
            <button
              onClick={() => handleSend('Which book is easiest for a beginner?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-amber-800 whitespace-nowrap"
            >
              Beginner pick?
            </button>
            <button
              onClick={() => handleSend('What books are currently available to borrow?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-amber-800 whitespace-nowrap"
            >
              In-stock now?
            </button>
            <button
              onClick={() => handleSend('Recommend something like Harry Potter')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-amber-800 whitespace-nowrap"
            >
              Fantasy like Harry Potter?
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 py-2 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-amber-600 text-white disabled:bg-slate-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
