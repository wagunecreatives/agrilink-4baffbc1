import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://perdmslbgykblhafzpxo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcmRtc2xiZ3lrYmxoYWZ6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODYyMzksImV4cCI6MjA4MzE2MjIzOX0.c2i3O_o4TGT8RqREtQXUSCKiZKehiyztK_mpQJN2eg8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
