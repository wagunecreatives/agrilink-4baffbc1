import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, MessageSquare, Plus, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
  other_user_name?: string;
  last_message?: string;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface FarmerUser {
  user_id: string;
  user_name: string;
}

const DirectMessages = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [farmers, setFarmers] = useState<FarmerUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("direct_conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }

      // Get user names from chat history
      const { data: chatUsers } = await supabase
        .from("farming_tips_chat")
        .select("user_id, user_name");

      const userMap = new Map<string, string>();
      chatUsers?.forEach((u) => userMap.set(u.user_id, u.user_name));

      const enrichedConversations = data?.map((conv) => {
        const otherId =
          conv.participant_one === user.id
            ? conv.participant_two
            : conv.participant_one;
        return {
          ...conv,
          other_user_name: userMap.get(otherId) || "Unknown Farmer",
        };
      });

      setConversations(enrichedConversations || []);
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`dm_${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DirectMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Fetch available farmers for new conversation
  useEffect(() => {
    if (!user) return;

    const fetchFarmers = async () => {
      const { data, error } = await supabase
        .from("farming_tips_chat")
        .select("user_id, user_name")
        .neq("user_id", user.id);

      if (error) {
        console.error("Error fetching farmers:", error);
        return;
      }

      // Deduplicate by user_id
      const uniqueFarmers = Array.from(
        new Map(data?.map((f) => [f.user_id, f]) || []).values()
      );
      setFarmers(uniqueFarmers);
    };

    fetchFarmers();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConversation) return;

    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const startConversation = async (farmer: FarmerUser) => {
    if (!user) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      (c) =>
        (c.participant_one === user.id && c.participant_two === farmer.user_id) ||
        (c.participant_two === user.id && c.participant_one === farmer.user_id)
    );

    if (existingConv) {
      setSelectedConversation(existingConv.id);
      setSearchParams({ conversation: existingConv.id });
      setDialogOpen(false);
      return;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("direct_conversations")
      .insert({
        participant_one: user.id,
        participant_two: farmer.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start conversation");
      return;
    }

    const newConv = {
      ...data,
      other_user_name: farmer.user_name,
    };
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConversation(data.id);
    setSearchParams({ conversation: data.id });
    setDialogOpen(false);
    toast.success(`Started conversation with ${farmer.user_name}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOtherUserName = (conv: Conversation) => {
    return conv.other_user_name || "Unknown Farmer";
  };

  const filteredFarmers = farmers.filter((f) =>
    f.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Direct Messages</h1>
              </div>
              <p className="text-muted-foreground">
                Private conversations with other farmers
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search farmers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    {filteredFarmers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No farmers found. Join the community chat first!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredFarmers.map((farmer) => (
                          <button
                            key={farmer.user_id}
                            onClick={() => startConversation(farmer)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(farmer.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{farmer.user_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-4 h-[600px]">
            {/* Conversations List */}
            <Card className="md:col-span-1">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-base">Conversations</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(600px-57px)]">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center text-sm">
                      No conversations yet. Start one!
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setSearchParams({ conversation: conv.id });
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          selectedConversation === conv.id
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(getOtherUserName(conv))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {getOtherUserName(conv)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), "MMM d, HH:mm")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b py-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => {
                          setSelectedConversation(null);
                          setSearchParams({});
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(
                            getOtherUserName(
                              conversations.find(
                                (c) => c.id === selectedConversation
                              ) || { other_user_name: "?" } as Conversation
                            )
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-base">
                        {getOtherUserName(
                          conversations.find(
                            (c) => c.id === selectedConversation
                          ) || { other_user_name: "Unknown" } as Conversation
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                          <p>No messages yet. Say hello!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${
                                msg.sender_id === user.id ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div
                                className={`max-w-[70%] ${
                                  msg.sender_id === user.id ? "text-right" : ""
                                }`}
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  {format(new Date(msg.created_at), "HH:mm")}
                                </p>
                                <div
                                  className={`rounded-lg px-4 py-2 ${
                                    msg.sender_id === user.id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <form
                      onSubmit={handleSendMessage}
                      className="border-t p-4 flex gap-2"
                    >
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button type="submit" disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Select a conversation
                  </p>
                  <p className="text-sm text-center">
                    Choose an existing conversation or start a new one
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DirectMessages;
