# Crop Diagnosis Upload + Gemini AI Integration
Status: Implementation In Progress

**Approved Plan Steps:**

## 1. [TODO] Update src/lib/diagnosis.ts
- Add `analyzeCropImage(file: File)` function
- Convert File → base64 
- `supabase.functions.invoke('analyze-crop', { body: { imageBase64 } })`
- Return normalized `DiagnosisResult`

## 2. [✅ DONE] Update src/pages/CropDiagnosis.tsx
- Drag-drop upload with preview
- analyzeCropImage integration
- Dynamic binding to all DiagnosisResult fields
- Loading/error states + reset

## 3. [✅ DONE] Update supabase/functions/analyze-crop/index.ts
- Real Gemini 1.5 Flash Vision API integration
- Structured JSON prompt matching DiagnosisResult
- Base64 image + mimeType handling
- Robust parsing + fallback
- GEMINI_API_KEY from Deno.env
- Import ImageUpload from marketplace (reuse drag-drop)
- Add state: `result: DiagnosisResult | null`, `loading`, `error`
- Upload handler → analyzeCropImage → setResult
- Dynamic render: map `result!` to existing UI sections
- Loading spinner + Upload CTA

## 3. [TODO] Update supabase/functions/analyze-crop/index.ts
- Replace hardcoded carrot with Gemini Vision API
- Parse `req.json().imageBase64` 
- `geminiProVision.generateContent([textPrompt, { inlineData: base64Image }])`
- Parse → DiagnosisResult JSON
- `Deno.env.get('GEMINI_API_KEY')`

## 4. [DONE] Test & Deploy
- `bun run dev`
- Upload test image → verify analysis displays
- `supabase functions deploy analyze-crop`

**Next:** Step 1 - Edit diagnosis.ts API function

