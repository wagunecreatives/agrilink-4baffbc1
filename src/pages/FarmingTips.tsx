import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Send, Users, MessageCircle, Lightbulb, Trash2, MessageSquare } from "lucide-react";
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
  const { user, profile, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineUsers] = useState(Math.floor(Math.random() * 20) + 5);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    if (!user) return;

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

    const channel = supabase
      .channel("farming_tips_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "farming_tips_chat" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "farming_tips_chat" },
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
      console.error("Send error:", error);
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
      console.error("Delete error:", error);
      toast.error("Failed to delete message");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?";
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">Farming Tips Community</h1>
            </div>
            <p className="text-muted-foreground">
              Share knowledge, ask questions, and connect with fellow farmers
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="px-4 py-1.5 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {onlineUsers} farmers online
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {messages.length} messages
            </Badge>
            <Link to="/messages">
              <Badge
                variant="default"
                className="px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="h-4 w-4" />
                Direct Messages
              </Badge>
            </Link>
          </div>

          {/* Main Chat Card */}
          <Card className="flex flex-col h-[70vh] md:h-[680px] overflow-hidden">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-lg">Community Chat</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 px-4 pt-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <MessageCircle className="h-12 w-12 mb-4 opacity-60" />
                    <p className="text-center">No messages yet.<br />Be the first to share a tip!</p>
                  </div>
                ) : (
                  <div className="space-y-5 pb-6">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.user_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        {msg.user_id !== user.id && (
                          <Avatar className="h-9 w-9 mt-1">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(msg.user_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`max-w-[75%] group ${msg.user_id === user.id ? "text-right" : ""}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-sm font-medium">{msg.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                            {msg.user_id === user.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm break-words ${
                              msg.user_id === user.id
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted rounded-bl-none"
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>

                        {msg.user_id === user.id && (
                          <Avatar className="h-9 w-9 mt-1">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(msg.user_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Fixed Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="border-t px-4 py-3 flex items-center gap-2 bg-background sticky bottom-0 z-10"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share a farming tip or ask a question..."
                  className="flex-1 h-10 rounded-full px-4 text-sm focus-visible:ring-primary/70 border-input"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                  disabled={sending || !newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-green-50/60 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 text-lg">
                  🌱 Share Your Knowledge
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Help fellow farmers by sharing your experience and tips
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-lg">
                  💡 Ask Questions
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Get advice from experienced farmers in the community
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 text-lg">
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