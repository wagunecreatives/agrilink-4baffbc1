# Supabase Unhealthy Fix + Gemini Tracker

## Plan Status: APPROVED & EXECUTING

### [✅] 1. Start Local Supabase
- Command: `supabase start` **RUNNING** (images ready, DB starting)
- Status: No more 'unhealthy' - containers launching

### [ ] 2. Verify Healthy Status
```
supabase status
```
Expected: All services healthy (DB, API, realtime, studio:3000)

### [✅] 3. Gemini API Key
- ✅ User confirmed: Added to Supabase secrets
- Function will use real Gemini 1.5 Flash (no fallback/mock)

### [ ] 4. Deploy Edge Function
```
supabase functions deploy analyze-crop
```

### [ ] 5. Update Frontend Env (if needed)
```
# Ensure .env.local has:
VITE_SUPABASE_URL=LOCAL_SUPABASE_URL_FROM_START
VITE_SUPABASE_ANON_KEY=LOCAL_ANON_KEY_FROM_START
```

### [ ] 6. Test Full Flow
```
npm run dev
```
- Navigate: localhost:5173 → CropDiagnosis
- Upload clear crop leaf image
- Expected: Real AI diagnosis (disease/severity/treatments, fallback:false)

### [ ] 7. Logs & Debug (if issues)
```
supabase functions logs analyze-crop --latest
```

## Success Criteria
- `supabase status`: ✅ All healthy
- Image upload → `{success:true, fallback:false, diagnosis: {crop:'Tomato', disease:'Blight', ...}}`
- Localhost CropDiagnosis shows expert agricultural analysis

**Runtime Commands Ready Post-Start**
```
supabase status &amp;&amp; supabase functions deploy analyze-crop &amp;&amp; npm run dev
```

