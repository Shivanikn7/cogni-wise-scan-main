import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowLeft, Send, Bot, User, Paperclip, FileText, Loader2, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const Chatbot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuthAndLoadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(buildApiUrl(`/api/chat/history?user_id=${session.user.id}`));
        if (res.ok) {
          const history = await res.json();
          if (Array.isArray(history) && history.length > 0) {
            setMessages(history.map((msg: any) => ({
              id: msg.id || Date.now().toString(),
              role: msg.role,
              content: msg.content
            })));
          } else {
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: "Hello! I'm CogniWise AI. I can explain your assessment results, answer questions about symptoms (ADHD, ASD, Dementia), or analyze PDF reports. How can I help?"
            }]);
          }
        }
      } catch (error) {
        console.error("Failed to load history", error);
      }
    };

    checkAuthAndLoadHistory();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(buildApiUrl("/api/chat/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })).slice(-10)
        })
      });

      if (!response.ok) {
        let errorMessage = "Failed to get response";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to communicate with AI.",
        variant: "destructive",
      });

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ Error: ${error.message || "I encountered an issue connecting to the server. Please try again."}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", session.user.id);

      const response = await fetch(buildApiUrl("/api/chat/upload"), {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      // Add a system-like message to UI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "user",
        content: `📄 Uploaded: ${file.name}\n\nAnalysis context added.`
      }]);

      toast({
        title: "Success",
        description: "PDF processed successfully. You can now ask questions about it.",
      });

    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload PDF.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Speech Recognition Setup
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Could not access microphone or conversion failed.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "default"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now.",
        duration: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full p-2">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-blue-600">
                  CogniWise Assistant
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Health Companion</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl h-[calc(100vh-80px)]">
        <ScrollArea className="flex-1 pr-4 mb-4 space-y-6">
          {/* Custom Scroll Area logic handled by div overflow for now if ScrollArea component not available,
               assuming standard div for simplicity unless project has ScrollArea */}
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] relative group ${message.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`
                        p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                        ${message.role === "user"
                        ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"}
                      `}
                  >
                    {message.content}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1 opacity-70">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="mt-auto bg-white rounded-xl border shadow-lg p-3 flex items-end gap-2 relative">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-purple-600"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>

          {/* Microphone Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`${isListening ? "text-red-500 animate-pulse bg-red-50" : "text-gray-400 hover:text-purple-600"}`}
            onClick={toggleMic}
            disabled={loading || uploading}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening..." : "Type or speak your health questions..."}
            disabled={loading}
            className="border-0 focus-visible:ring-0 px-2 py-3 h-auto text-base bg-transparent max-h-32"
          />

          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md h-10 w-10 p-0 flex items-center justify-center"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </main>
    </div>
  );
};

// Simple ScrollArea wrapper if shadcn ScrollArea is not standard
const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden flex flex-col ${className}`}>
    {children}
  </div>
);

export default Chatbot;
