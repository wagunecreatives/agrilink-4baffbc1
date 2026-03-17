import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64, fileName, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this crop image for disease/health status.

Return VALID JSON only (no other text) with this EXACT structure:

{
  "crop": "Crop name",
  "disease": "Disease name or 'Healthy'",
  "scientific_name": "Scientific name (if applicable)",
  "confidence": 95,
  "type": "disease|healthy|pest|nutrient|other",
  "severity": "low|medium|high|critical",
  "spread_risk": "low|medium|high",
  "recovery_outlook": "Brief recovery summary (1-2 sentences)",
  "recommended_review_window": "Timeframe like '24-48 hours'",
  "analysis_details": "Detailed visual analysis (3-5 sentences)",
  "nutrition_notes": "Nutrition/deficiency notes (optional)",
  "key_indicators": ["bullet 1", "bullet 2"],
  "urgent_actions": ["action 1"],
  "treatment": ["general treatments"],
  "organic_treatment": ["organic options"],
  "conventional_treatment": ["chemical options"],
  "prevention": ["preventive measures"]
}

Be specific about visual symptoms, causes, and actionable recommendations.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response (Gemini should return clean JSON)
    let diagnosis;
    try {
      diagnosis = JSON.parse(text.trim());
    } catch {
      // Fallback parse if fenced
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      diagnosis = jsonMatch ? JSON.parse(jsonMatch[0]) : fallbackDiagnosis(fileName);
    }

    // Ensure all required fields
    const fullDiagnosis = {
      crop: diagnosis.crop || "Unknown crop",
      disease: diagnosis.disease || "Unknown",
      scientific_name: diagnosis.scientific_name || "",
      confidence: Math.max(0, Math.min(100, diagnosis.confidence || 50)),
      type: diagnosis.type || "unknown",
      severity: diagnosis.severity || "medium",
      spread_risk: diagnosis.spread_risk || "medium",
      recovery_outlook: diagnosis.recovery_outlook || "Further field verification recommended.",
      recommended_review_window: diagnosis.recommended_review_window || "24-48 hours",
      analysis_details: diagnosis.analysis_details || "AI analysis completed. Review symptoms with local conditions.",
      nutrition_notes: diagnosis.nutrition_notes || "",
      key_indicators: Array.isArray(diagnosis.key_indicators) ? diagnosis.key_indicators : [],
      urgent_actions: Array.isArray(diagnosis.urgent_actions) ? diagnosis.urgent_actions : [],
      treatment: Array.isArray(diagnosis.treatment) ? diagnosis.treatment : [],
      organic_treatment: Array.isArray(diagnosis.organic_treatment) ? diagnosis.organic_treatment : [],
      conventional_treatment: Array.isArray(diagnosis.conventional_treatment) ? diagnosis.conventional_treatment : [],
      prevention: Array.isArray(diagnosis.prevention) ? diagnosis.prevention : [],
      monitoring_steps: Array.isArray(diagnosis.monitoring_steps) ? diagnosis.monitoring_steps : [],
      likely_causes: Array.isArray(diagnosis.likely_causes) ? diagnosis.likely_causes : [],
      risk_factors: Array.isArray(diagnosis.risk_factors) ? diagnosis.risk_factors : []
    };

    return new Response(JSON.stringify({
      diagnosis: fullDiagnosis,
      model_used: "gemini-1.5-flash",
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Diagnosis error:', error);

    // Graceful fallback
    return new Response(JSON.stringify({
      diagnosis: fallbackDiagnosis('uploaded-crop'),
      model_used: "fallback-v1",
      error: error.message,
      generated_at: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function fallbackDiagnosis(fileName: string) {
  return {
    crop: "Unknown crop",
    disease: "Analysis unavailable",
    confidence: 0,
    severity: "low",
    spread_risk: "low",
    recovery_outlook: "Upload a clear image for accurate diagnosis.",
    recommended_review_window: "Immediate",
    analysis_details: `Fallback response for ${fileName}. Set GEMINI_API_KEY secret or check image quality.`,
    nutrition_notes: "",
    type: "unknown",
    key_indicators: [],
    urgent_actions: [],
    treatment: [],
    organic_treatment: [],
    conventional_treatment: [],
    prevention: [],
    monitoring_steps: [],
    likely_causes: [],
    risk_factors: []
  };
}

