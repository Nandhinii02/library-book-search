import React, { useState, useRef, useEffect } from 'react';
import { Book, ChatMessage } from '../types/book';
import { sendChatMessage } from '../services/api';
import { MessageSquare, Send, Sparkles, BookOpen, Trash2, CheckCircle2, AlertCircle, ArrowUpRight, Cpu } from 'lucide-react';

interface ChatAssistantViewProps {
  onSelectBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  favorites: Book[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'intro-1',
    role: 'assistant',
    content: `Hello! I am **Smart Library AI**, your intelligent research and reading assistant powered by RAG (Retrieval-Augmented Generation).\n\nI can help you search our catalog, compare reading levels, check real shelf availability, or find books on specialized topics. How can I assist your reading journey today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isGrounded: true,
    suggestedQueries: [
      'Which Python books are best for complete beginners?',
      'Compare "Designing Data-Intensive Applications" and "Clean Code"',
      'What books on artificial intelligence are currently available to borrow?',
      'Recommend an epic sci-fi or fantasy adventure with high ratings',
    ],
  },
];

export const ChatAssistantView: React.FC<ChatAssistantViewProps> = ({
  onSelectBook,
  onToggleFavorite,
  favorites,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('library_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('library_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(textToSend, history);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        retrievedBooks: res.retrievedBooks,
        suggestedQueries: res.suggestedQueries,
        isGrounded: res.isGrounded,
        limitationsStated: res.limitationsStated,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `I encountered an issue processing your query (${err.message || 'Network error'}). Please try again or rephrase your question.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem('library_chat_history');
  };

  // Helper to format text with markdown-like styling
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="font-serif-title font-bold text-base text-slate-900 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="font-serif-title font-bold text-lg text-slate-900 mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-amber-500 pl-3 py-1 my-2 bg-amber-50/60 rounded-r-lg text-slate-700 italic text-xs">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 my-0.5 leading-relaxed">
            {renderBoldText(line.trim().substring(2))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="leading-relaxed my-1">
          {renderBoldText(line)}
        </p>
      );
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-title font-bold text-lg text-slate-900">
                Ask Library AI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-600" />
                RAG Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded library assistant &bull; Factual catalog citations &bull; Contextual memory
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm mt-1">
                  AI
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm shadow-sm ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedContent(msg.content)}
                    </div>
                  )}
                </div>

                {/* Grounded Retrieved Book Cards in Assistant response */}
                {!isUser && msg.retrievedBooks && msg.retrievedBooks.length > 0 && (
                  <div className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      Supporting Catalog Records Retrieved for Context:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.retrievedBooks.slice(0, 4).map((book) => {
                        const isAvailable = book.available && book.availableCopies > 0;
                        return (
                          <div
                            key={book.id}
                            onClick={() => onSelectBook(book)}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 cursor-pointer flex gap-2.5 items-center transition-all group shadow-2xs"
                          >
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded bg-slate-100 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-serif-title font-bold text-xs text-slate-900 group-hover:text-amber-700 truncate">
                                {book.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 truncate">
                                {book.author} &bull; {book.publicationYear}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-[10px] font-medium">
                                {isAvailable ? (
                                  <span className="text-emerald-700 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {book.availableCopies} available
                                  </span>
                                ) : (
                                  <span className="text-rose-700 flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    Checked out
                                  </span>
                                )}
                                <span className="text-slate-400">&bull;</span>
                                <span className="font-mono-code text-slate-500 truncate">{book.shelfLocation}</span>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Prompts */}
                {!isUser && msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.suggestedQueries.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm mt-1">
                  You
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
              AI
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
              <span className="text-xs text-slate-600">Retrieving catalog records and generating grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="pt-4 mt-2 border-t border-slate-200 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center shadow-md rounded-2xl bg-white border border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about our library catalog (e.g. 'Which book is best for learning data structures?')..."
            className="w-full py-3.5 pl-4 pr-14 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 rounded-xl bg-slate-900 hover:bg-amber-600 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
