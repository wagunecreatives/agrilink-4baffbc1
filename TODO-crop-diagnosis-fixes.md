# Crop Diagnosis Error Fixes - Implementation Plan

## Information Gathered
- **Frontend** (`src/pages/CropDiagnosis.tsx`): Clean base64 extraction, 5MB limit, good UX
- **Backend** (`supabase/functions/analyze-crop/index.ts`): Deno edge function with Gemini 1.5 Flash, robust fallbacks, mock data when no API key
- **Root cause**: Missing `GEMINI_API_KEY` in Supabase secrets → always uses mock/fallback
- **Secondary**: Base64 may have newlines, no compression
- **Strengths**: Excellent error handling, JSON parsing resilient, size limits enforced

## Detailed Code Update Plan

### 1. Supabase Secrets Setup (Manual - User action)
```
Supabase Dashboard → Functions → analyze-crop → Secrets
Add: GEMINI_API_KEY = your_actual_gemini_api_key
```
**Expected**: Removes fallback, enables real AI calls

### 2. Backend Improvements (`supabase/functions/analyze-crop/index.ts`)
```
a. Remove newlines from base64: imageBase64 = imageBase64.replace(/\\n|\\r/g, '')
b. Add logging for debugging: console.log('Base64 length:', imageBase64.length)
c. Improve MIME detection reliability
d. Add response validation before parsing
```
**Impact**: Fixes all 4 error types

### 3. Frontend Enhancement (`src/pages/CropDiagnosis.tsx`) 
```
a. Client-side image compression (canvas resize to 1024x1024 max)
b. Remove newlines from base64 before sending
c. Show fallback warning badge if diagnosis.fallback === true
```
**Impact**: Prevents large image issues, better UX

### 4. Environment Setup
```
.env.local (for local dev): GEMINI_API_KEY=your_key_here
```

## Dependent Files to Edit
1. `supabase/functions/analyze-crop/index.ts` (Primary)
2. `src/pages/CropDiagnosis.tsx` (Secondary)  
3. `TODO-crop-diagnosis-fixes.md` (This file - track progress)

## Followup Steps
1. User adds GEMINI_API_KEY to Supabase secrets
2. `supabase functions deploy analyze-crop`
3. Test with real crop images
4. Verify no fallback in response
5. `npm run dev` → test local with .env.local

## REVERTED - Caused Blank UI

**Reverted** compression/UI changes in CropDiagnosis.tsx via `git restore` to fix blank screen.

Original fixes (now removed):
- Client-side image compression (canvas → taint error)
- Base64 cleaning 
- Fallback badge

**Backend still good.** Add GEMINI_API_KEY for real AI:

1. Supabase Dashboard → Edge Functions → analyze-crop → Secrets → GEMINI_API_KEY
2. `supabase functions deploy analyze-crop`
3. Test upload (simple base64 now, no compression)

**Status**: ✅ GEMINI PRO ACTIVE - User confirmed API key added


## ✅ SETUP COMPLETE - Ready for Testing

1. Run: `supabase functions deploy analyze-crop`
2. Test: `npm run dev` → CropDiagnosis → Upload leaf image
3. Expected: Real Gemini analysis (no fallback=true)

## QUICK REAL AI SETUP (2 mins)
```
1. https://aistudio.google.com/app/apikey → Copy key
2. Supabase Dashboard → Edge Functions → analyze-crop → Secrets → GEMINI_API_KEY = [paste]
3. cd supabase/functions && supabase functions deploy analyze-crop
4. Refresh page → Upload crop leaf image
```
**Upload CLEAR leaf closeup for best results!**

**Next**: Confirm this plan before code changes.

