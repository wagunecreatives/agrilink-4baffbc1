-- Create farming tips chat table
CREATE TABLE public.farming_tips_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.farming_tips_chat ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view all messages
CREATE POLICY "Authenticated users can view all messages" 
ON public.farming_tips_chat 
FOR SELECT 
TO authenticated
USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages" 
ON public.farming_tips_chat 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.farming_tips_chat 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for the chat table
ALTER PUBLICATION supabase_realtime ADD TABLE public.farming_tips_chat;