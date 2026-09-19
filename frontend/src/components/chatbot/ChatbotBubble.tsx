import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { askChatbot } from "@/services/chatService";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  isError?: boolean;
}

export const ChatbotBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I'm your SACCO Assistant. How can I help you today?",
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await askChatbot(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.reply,
        isError: !response.success && !response.is_fallback,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Sorry, something went wrong while connecting to the assistant.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic sizing based on expanded state
  const panelClasses = isExpanded
    ? "w-[90vw] sm:w-[600px] md:w-[700px] h-[85vh]"
    : "w-80 sm:w-96 h-[500px] max-h-[70vh]";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            layout
            className={`bg-white dark:bg-slate-900 ${panelClasses} rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-4 flex flex-col overflow-hidden transition-all duration-300`}
          >
            {/* Header */}
            <div className="bg-[#0B6B3A] text-white p-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">SACCO Assistant</h3>
                  <p className="text-xs text-white/70">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label={isExpanded ? "Collapse Chat" : "Expand Chat"}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.sender === "user"
                        ? "bg-[#0B6B3A] text-white rounded-br-none"
                        : msg.isError
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 rounded-bl-none border border-rose-200 dark:border-rose-800/50"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                        {msg.isError ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] uppercase tracking-wider font-bold">
                          Assistant
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#0B6B3A] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#0B6B3A] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#0B6B3A] rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 relative"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B3A]/30 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-[#0B6B3A] hover:bg-[#09572e] text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-[#0B6B3A]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0B6B3A] text-white p-4 rounded-full shadow-xl shadow-[#0B6B3A]/30 flex items-center justify-center hover:bg-[#09572e] transition-colors z-50"
        aria-label="Toggle Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};
