-- Create AI model configuration table for admin management
CREATE TABLE public.ai_model_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name text NOT NULL,
    model_id text NOT NULL,
    is_active boolean DEFAULT true,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create diagnosis logs table for monitoring
CREATE TABLE public.diagnosis_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    model_used text NOT NULL,
    diagnosis_result text,
    image_url text,
    confidence_level text,
    status text DEFAULT 'completed',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_model_config (admin only)
CREATE POLICY "Admins can manage AI config"
ON public.ai_model_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view AI config"
ON public.ai_model_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for diagnosis_logs (admin can view all, users can view own)
CREATE POLICY "Admins can view all diagnosis logs"
ON public.diagnosis_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own diagnosis logs"
ON public.diagnosis_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnosis logs"
ON public.diagnosis_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default AI model config
INSERT INTO public.ai_model_config (model_name, model_id, is_active, description)
VALUES 
    ('Gemini 2.5 Flash', 'google/gemini-2.5-flash', true, 'Fast and efficient model for crop disease diagnosis'),
    ('Gemini 2.5 Pro', 'google/gemini-2.5-pro', false, 'High accuracy model for complex diagnosis cases'),
    ('Gemini 3 Flash Preview', 'google/gemini-3-flash-preview', false, 'Next-gen fast model (preview)');