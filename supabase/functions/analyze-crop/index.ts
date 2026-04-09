import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ------------------ UTILITIES ------------------ */

type DiagnosisRecord = Record<string, unknown>;

function extractJSON(text: string): DiagnosisRecord | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    return typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const cleanText = (val: unknown): string => {
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === "string" ? v.trim() : "")).join("\n");
  }
  return "";
};

const parseList = (val: unknown): string[] => {
  if (Array.isArray(val)) {
    return val.map(v => cleanText(v)).filter(Boolean);
  }

  if (typeof val === "string") {
    return val
      .split(/\r?\n|,|;/)
      .map(v => v.trim().replace(/^[-*\d.)\s]+/, ""))
      .filter(Boolean);
  }

  return [];
};

const ensureList = (val: string[], fallback: string[], min = 1) =>
  val.length >= min ? val : fallback;

/* ------------------ FALLBACK GENERATOR ------------------ */

function buildFallback(crop: string, disease: string, severity: string) {
  const cropName = crop !== "Unknown crop" ? crop.toLowerCase() : "the crop";
  const isHealthy = disease.toLowerCase() === "healthy";

  if (isHealthy) {
    return {
      analysis_details: `The ${cropName} appears healthy with no strong visible signs of disease or pest damage.`,
      urgent_actions: [
        "Continue regular crop monitoring",
        "Maintain proper irrigation and nutrition",
      ],
      treatment: [
        "No treatment required",
        "Maintain good farming practices",
      ],
      organic_treatment: [
        "Use compost and organic soil enrichment",
      ],
      conventional_treatment: [
        "No chemical treatment needed",
      ],
      prevention: [
        "Regular scouting",
        "Proper spacing and airflow",
      ],
      monitoring_steps: [
        "Check leaves every 3–5 days",
        "Monitor after weather changes",
      ],
      likely_causes: ["Healthy crop condition"],
      risk_factors: ["Future stress from weather or pests"],
      nutrition_notes: "No deficiency signs observed",
      recovery_outlook: "Crop is in good condition",
      recommended_review_window: "3–5 days",
      spread_risk: "low",
    };
  }

  return {
    analysis_details: `The image suggests ${cropName} may be affected by ${disease}. Symptoms should be verified in the field.`,
    urgent_actions: [
      "Remove affected leaves",
      "Avoid spreading contamination",
    ],
    treatment: [
      "Apply appropriate crop-specific treatment",
      "Improve field sanitation",
    ],
    organic_treatment: [
      "Use neem-based or biological treatments",
    ],
    conventional_treatment: [
      "Apply approved fungicide/pesticide",
    ],
    prevention: [
      "Practice crop rotation",
      "Maintain proper spacing",
    ],
    monitoring_steps: [
      "Inspect daily for spread",
      "Track symptom changes",
    ],
    likely_causes: ["High humidity or infection"],
    risk_factors: ["Poor airflow", "Wet conditions"],
    nutrition_notes: "Check soil nutrition levels",
    recovery_outlook:
      severity === "high"
        ? "Recovery may be difficult without fast action"
        : "Recovery possible with early treatment",
    recommended_review_window: "24–48 hours",
    spread_risk: severity === "high" ? "high" : "medium",
  };
}

/* ------------------ NORMALIZATION ------------------ */

function normalizeDiagnosis(raw: DiagnosisRecord, fallbackText?: string) {
  const crop = cleanText(raw.crop) || "Unknown crop";
  const disease = cleanText(raw.disease) || "Unknown issue";
  const severity = cleanText(raw.severity).toLowerCase() || "medium";

  const fallback = buildFallback(crop, disease, severity);

  return {
    crop,
    disease,
    scientific_name: cleanText(raw.scientific_name),
    confidence: Number(raw.confidence) || 70,
    type: cleanText(raw.type) || "unknown",
    severity,
    spread_risk: cleanText(raw.spread_risk) || fallback.spread_risk,
    recovery_outlook:
      cleanText(raw.recovery_outlook) || fallback.recovery_outlook,
    recommended_review_window:
      cleanText(raw.recommended_review_window) ||
      fallback.recommended_review_window,

    key_indicators: parseList(raw.key_indicators),

    analysis_details:
      cleanText(raw.analysis_details) ||
      fallback.analysis_details ||
      fallbackText ||
      "",

    urgent_actions: ensureList(
      parseList(raw.urgent_actions),
      fallback.urgent_actions,
      2,
    ),

    treatment: ensureList(
      parseList(raw.treatment),
      fallback.treatment,
      2,
    ),

    organic_treatment: ensureList(
      parseList(raw.organic_treatment),
      fallback.organic_treatment,
      1,
    ),

    conventional_treatment: ensureList(
      parseList(raw.conventional_treatment),
      fallback.conventional_treatment,
      1,
    ),

    prevention: ensureList(
      parseList(raw.prevention),
      fallback.prevention,
      2,
    ),

    monitoring_steps: ensureList(
      parseList(raw.monitoring_steps),
      fallback.monitoring_steps,
      2,
    ),

    likely_causes: ensureList(
      parseList(raw.likely_causes),
      fallback.likely_causes,
      1,
    ),

    risk_factors: ensureList(
      parseList(raw.risk_factors),
      fallback.risk_factors,
      1,
    ),

    nutrition_notes:
      cleanText(raw.nutrition_notes) || fallback.nutrition_notes,
  };
}

/* ------------------ MAIN FUNCTION ------------------ */

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const API_KEY =
      Deno.env.get("GEMINI_API_KEY") ||
      Deno.env.get("GOOGLE_API_KEY");

    if (!API_KEY) {
      throw new Error("Missing Gemini API key");
    }

    /* Detect mime */
    let mimeType = "image/jpeg";
    if (imageBase64.startsWith("iVBOR")) mimeType = "image/png";

    const prompt = `Analyze this crop image and return ONLY JSON:

{
  "crop": "",
  "disease": "",
  "scientific_name": "",
  "confidence": 90,
  "type": "disease|pest|nutrient|healthy",
  "severity": "low|medium|high",
  "spread_risk": "low|medium|high",
  "recovery_outlook": "",
  "recommended_review_window": "",
  "analysis_details": "",
  "key_indicators": [],
  "urgent_actions": [],
  "treatment": [],
  "organic_treatment": [],
  "conventional_treatment": [],
  "prevention": [],
  "monitoring_steps": [],
  "likely_causes": [],
  "risk_factors": [],
  "nutrition_notes": ""
}`;

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    let outputText = "";
    let usedModel = "";

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: imageBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          outputText = text;
          usedModel = model;
          break;
        }
      } catch (err) {
        console.error("Model error:", err);
      }
    }

    if (!outputText) throw new Error("All models failed");

    const parsed = extractJSON(outputText);
    const diagnosis = parsed
      ? normalizeDiagnosis(parsed)
      : normalizeDiagnosis({}, outputText);

    return new Response(
      JSON.stringify({
        diagnosis,
        model_used: usedModel,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});