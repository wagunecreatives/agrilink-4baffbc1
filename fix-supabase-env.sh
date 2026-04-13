#!/bin/bash
echo "Creating .env.local with Supabase vars - UPDATE WITH YOUR PROJECT VALUES!"
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://perdmslbgykblhafzpxo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcmRtc2xiZ3lrYmxoYWZ6cHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODYyMzksImV4cCI6MjA4MzE2MjIzOX0.c2i3O_o4TGT8RqREtQXUSCKiZKehiyztK_mpQJN2eg8
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Hs1vIcTgbS2tAoN-KRWOdg_JQxTIyL_
EOF
echo "✅ .env.local created. EDIT with your Supabase project URL/key:"
echo "Supabase Dashboard → Settings → API → URL/anont key → paste above"
echo "Then npm run dev -- --force"

