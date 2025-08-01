"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles, User, BrainCircuit } from "lucide-react";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/common/Footer";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


function ChatComponent() {
  const searchParams = useSearchParams();
  const moduleTitle = searchParams.get("title") || "Loading title...";
  const moduleContent = searchParams.get("content") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moduleContent && moduleTitle !== "Loading title...") {
      const systemMessage: Message = {
        role: "system",
        content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
      };
      setMessages([systemMessage, {role: 'assistant', content: ''}]); // Add placeholder for AI loading
      setLoading(true);
      generateModuleTasks({ moduleContent, moduleTitle })
        .then((result) => {
          setMessages([
            systemMessage,
            {
              role: "assistant",
              content: result.introductoryMessage,
            },
          ]);
        })
        .catch(() => setError("Failed to generate initial tasks and applications."))
        .finally(() => setLoading(false));
    }
  }, [moduleContent, moduleTitle]);

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages: Message[] = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setLoading(true);
    setError(null);
    
    try {
      const chatHistory = currentMessages.filter((m): m is { role: 'user' | 'assistant', content: string } => m.role !== 'system');
      const result = await chatWithSyllabus({ history: chatHistory, message: input });
      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages(msgs => [...msgs, assistantMessage]);

    } catch (e: any) {
      console.error("Error getting AI response:", e);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="w-full py-3 px-4 bg-card/80 backdrop-blur-lg border-b shadow-sm sticky top-0 z-10">
        <h1 className="text-lg md:text-xl font-bold text-center text-foreground truncate">
          AI Chat: <span className="text-primary">{moduleTitle}</span>
        </h1>
      </header>
      <main className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
          <AnimatePresence>
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback className="bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                {msg.content ? (
                   <div
                   className={`max-w-md md:max-w-lg rounded-2xl px-4 py-3 text-base shadow-md prose prose-sm dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 ${
                     msg.role === "user"
                       ? "bg-primary text-primary-foreground rounded-br-none"
                       : "bg-card text-card-foreground rounded-bl-none border"
                   }`}
                 >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                 </div>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-card rounded-2xl px-4 py-3 border shadow-md">
                        <Loader2 className="h-5 w-5 animate-spin" /> Thinking...
                    </div>
                )}
                 {msg.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && messages[messages.length-1]?.role === 'user' && (
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-center gap-3"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-muted-foreground bg-card rounded-2xl px-4 py-3 border shadow-md">
                <Loader2 className="h-5 w-5 animate-spin" /> Thinking...
              </div>
            </motion.div>
          )}
          {error && (
            <div className="text-center text-destructive py-4">{error}</div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="mt-4 sticky bottom-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 w-full bg-card/90 backdrop-blur-xl p-2 rounded-2xl shadow-lg border"
          >
            <input
              className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-0 disabled:opacity-70"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI about this module..."
              disabled={loading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="rounded-xl w-12 h-12 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-background text-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              Loading Chat...
          </div>
        }>
            <ChatComponent />
        </Suspense>
    )
}
