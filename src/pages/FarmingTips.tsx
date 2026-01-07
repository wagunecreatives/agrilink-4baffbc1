import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Users, MessageCircle, Lightbulb, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

const FarmingTips = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineUsers] = useState(Math.floor(Math.random() * 20) + 5);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("farming_tips_chat")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("farming_tips_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "farming_tips_chat",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "farming_tips_chat",
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    setSending(true);
    const { error } = await supabase.from("farming_tips_chat").insert({
      user_id: user.id,
      user_name: profile.full_name || "Anonymous Farmer",
      message: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("farming_tips_chat")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Farming Tips Community</h1>
            </div>
            <p className="text-muted-foreground">
              Share knowledge, ask questions, and connect with fellow farmers
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-4 mb-6">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Users className="h-4 w-4" />
              <span>{onlineUsers} farmers online</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <MessageCircle className="h-4 w-4" />
              <span>{messages.length} messages</span>
            </Badge>
          </div>

          {/* Chat Card */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Community Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.user_id === user.id ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(msg.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[70%] ${
                            msg.user_id === user.id ? "text-right" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {msg.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {msg.user_id === user.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              msg.user_id === user.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="border-t p-4 flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share a tip or ask a question..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  🌱 Share Your Knowledge
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Help fellow farmers by sharing your experience and tips
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  💡 Ask Questions
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Get advice from experienced farmers in the community
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <CardContent className="p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  🤝 Build Connections
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Network with farmers and grow together
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FarmingTips;
