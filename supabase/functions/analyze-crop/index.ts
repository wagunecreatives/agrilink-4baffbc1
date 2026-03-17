import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type DiagnosisRecord = Record<string, unknown>;

function extractJSON(text: string): DiagnosisRecord | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

const cleanText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const parseList = (value: unknown, splitOnComma = false): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(item))
      .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      return parseList(JSON.parse(trimmed), splitOnComma);
    } catch {
      // Fall back to line splitting.
    }
  }

  const splitter = splitOnComma ? /\r?\n|;\s*|,\s*/ : /\r?\n|;\s*/;

  return trimmed
    .split(splitter)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
};

const isWeakText = (
  value: string,
  minimumWords: number,
  genericPhrases: string[],
) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return (
    wordCount < minimumWords ||
    genericPhrases.some((phrase) => normalized.includes(phrase))
  );
};

const ensureMinimumList = (
  value: string[],
  fallback: string[],
  minimumItems = 1,
) => (value.length >= minimumItems ? value : fallback);

const extractCropFromDetails = (text: string): string | null => {
  if (!text || typeof text !== "string") return null;
  
  const normalized = text.toLowerCase();
  const cropPatterns = [
    'walnut', 'apple', 'tomato', 'corn', 'maize', 'wheat', 'rice', 'soy', 'soybean', 
    'potato', 'lettuce', 'cabbage', 'grape', 'strawberry', 'blueberry', 'cherry', 
    'peach', 'orange', 'lemon', 'pepper', 'eggplant', 'squash', 'cucumber', 'bean',
    'carrot', 'onion', 'garlic'
  ];
  
  for (const crop of cropPatterns) {
    if (normalized.includes(crop) && !normalized.includes(` ${crop} `)) {
      return crop.charAt(0).toUpperCase() + crop.slice(1);
    }
  }
  return null;
};

const buildFallbackContent = (
  crop: string,
  disease: string,
  type: string,
  severity: string,
  fallbackText?: string,
) => {
  const cropLabel = crop !== "Unknown crop" ? crop.toLowerCase() : "the crop";
  const issueLabel =
    disease !== "Possible plant disease" ? disease : `a likely ${type}`;
  const severityLabel = severity || "medium";
  const isHealthy =
    disease.toLowerCase() === "healthy" || type.toLowerCase() === "healthy";

  if (isHealthy) {
    return {
      analysis_details:
        cleanText(fallbackText) ||
        `The uploaded image appears to show a healthy ${cropLabel} specimen. I do not see strong visible evidence of an active disease, pest outbreak, or nutrient deficiency in the tissue shown.`,
      urgent_actions: [
        `Continue routine scouting across the ${cropLabel} block for new lesions, yellowing, or pest pressure.`,
        `Maintain balanced irrigation and avoid sudden crop stress while the crop remains healthy.`,
      ],
      treatment: [
        "No curative treatment is recommended at this stage.",
        "Maintain balanced nutrition, clean irrigation practices, and field sanitation.",
      ],
      organic_treatment: [
        "Support plant vigor with compost-based feeding and consistent soil moisture management.",
      ],
      conventional_treatment: [
        "No chemical intervention is recommended unless symptoms appear or field pressure increases.",
      ],
      prevention: [
        `Keep weeds and infected residue away from the ${cropLabel} field to lower disease pressure.`,
        "Rotate scouting across representative sections of the field at least twice per week.",
      ],
      monitoring_steps: [
        "Inspect upper and lower leaf surfaces every 3 to 5 days.",
        "Re-check after heavy rainfall, irrigation shifts, or visible stress events.",
      ],
      likely_causes: [
        "Current tissue looks visually healthy in the submitted image.",
      ],
      risk_factors: [
        "Future risk may rise after prolonged humidity, poor airflow, or sanitation lapses.",
      ],
      nutrition_notes:
        "No strong nutrient-linked visual stress pattern was isolated from the uploaded image alone.",
      recovery_outlook:
        "Outlook is strong if current crop management and scouting discipline are maintained.",
      recommended_review_window:
        "Review again in 3 to 5 days or sooner if new symptoms appear.",
      spread_risk: "low",
    };
  }

  return {
    analysis_details:
      cleanText(fallbackText) ||
      `The visible symptoms are consistent with ${issueLabel} in ${cropLabel}. Severity appears ${severityLabel}, so rapid field confirmation and treatment planning are advisable to reduce spread and crop stress.`,
    urgent_actions: [
      `Isolate or remove the most severely affected ${cropLabel} tissue where practical.`,
      "Reduce leaf wetness duration and avoid moving contaminated tools between plants.",
    ],
    treatment: [
      `Apply a crop-labeled control strategy appropriate for ${issueLabel} on ${cropLabel}.`,
      "Combine direct treatment with sanitation and environmental correction for better results.",
    ],
    organic_treatment: [
      "Use crop-safe biological or low-residue options where locally recommended and properly labeled.",
    ],
    conventional_treatment: [
      "Use a registered product labeled for the crop and condition, following local guidance and label timing.",
    ],
    prevention: [
      "Remove infected residue promptly and improve spacing or airflow where possible.",
      "Avoid repeated stress from overwatering, poor drainage, or uneven feeding.",
    ],
    monitoring_steps: [
      "Inspect new growth and neighboring plants every 24 to 48 hours.",
      "Track whether lesions enlarge, darken, or spread after treatment.",
    ],
    likely_causes: [
      "Favorable disease pressure from humidity, surface wetness, or contaminated residue.",
    ],
    risk_factors: [
      "High humidity or prolonged leaf wetness.",
      "Poor sanitation or movement of contaminated tools and hands.",
    ],
    nutrition_notes:
      "Visible symptoms should still be cross-checked with nutrient history so deficiency stress is not missed.",
    recovery_outlook:
      severityLabel === "high"
        ? "Recovery is possible, but delayed action could cause significant yield reduction."
        : "Recovery outlook is fair if treatment and monitoring begin immediately.",
    recommended_review_window:
      "Review within the next 24 to 48 hours to confirm whether symptoms are stabilizing.",
    spread_risk: severityLabel === "high" ? "high" : "medium",
  };
};

const normalizeDiagnosis = (
  raw: DiagnosisRecord,
  fallbackText?: string,
) => {
  let cropText = cleanText(raw.crop);
  let crop = cropText || "Unknown crop";

  if (!cropText || cropText === "Unknown crop") {
    const detailsCrop = extractCropFromDetails(cleanText(raw.analysis_details || ''));
    if (detailsCrop) {
      crop = detailsCrop;
    }
  }

  const disease = cleanText(raw.disease) || "Possible plant disease";
  const type = cleanText(raw.type).toLowerCase() || "disease";
  const severity = cleanText(raw.severity).toLowerCase() || "medium";
  const fallback = buildFallbackContent(
    crop,
    disease,
    type,
    severity,
    fallbackText,
  );

  const analysisDetails = cleanText(raw.analysis_details);

  const treatment = parseList(raw.treatment);
  const prevention = parseList(raw.prevention);
  const urgentActions = parseList(raw.urgent_actions);
  const monitoringSteps = parseList(raw.monitoring_steps);
  const likelyCauses = parseList(raw.likely_causes);
  const riskFactors = parseList(raw.risk_factors);
  const organicTreatment = parseList(raw.organic_treatment);
  const conventionalTreatment = parseList(raw.conventional_treatment);
  const nutritionNotes = cleanText(raw.nutrition_notes);

  return {
    crop,
    disease,
    scientific_name: cleanText(raw.scientific_name),
    confidence:
      typeof raw.confidence === "number"
        ? raw.confidence
        : Number(raw.confidence) || 70,
    type,
    severity,
    spread_risk: cleanText(raw.spread_risk).toLowerCase() || fallback.spread_risk,
    recovery_outlook:
      cleanText(raw.recovery_outlook) || fallback.recovery_outlook,
    recommended_review_window:
      cleanText(raw.recommended_review_window) ||
      fallback.recommended_review_window,
    key_indicators: parseList(raw.key_indicators, true),
    analysis_details: isWeakText(analysisDetails, 12, [
      "ai analysis completed",
      "consult local agronomist",
    ])
      ? fallback.analysis_details
      : analysisDetails,
    treatment: ensureMinimumList(treatment, fallback.treatment, 2),
    organic_treatment: ensureMinimumList(
      organicTreatment,
      fallback.organic_treatment,
      1,
    ),
    conventional_treatment: ensureMinimumList(
      conventionalTreatment,
      fallback.conventional_treatment,
      1,
    ),
    prevention: ensureMinimumList(prevention, fallback.prevention, 2),
    urgent_actions: ensureMinimumList(urgentActions, fallback.urgent_actions, 2),
    monitoring_steps: ensureMinimumList(
      monitoringSteps,
      fallback.monitoring_steps,
      2,
    ),
    likely_causes: ensureMinimumList(likelyCauses, fallback.likely_causes, 1),
    risk_factors: ensureMinimumList(riskFactors, fallback.risk_factors, 1),
    nutrition_notes:
      isWeakText(nutritionNotes, 7, ["not available", "unknown"])
        ? fallback.nutrition_notes
        : nutritionNotes,
  };
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const GEMINI_API_KEY =
      Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key missing" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let mimeType = "image/jpeg";
    if (imageBase64.startsWith("/9j/")) mimeType = "image/jpeg";
    else if (imageBase64.startsWith("iVBOR")) mimeType = "image/png";
    else if (imageBase64.startsWith("R0lGOD")) mimeType = "image/gif";
    else if (imageBase64.startsWith("UklGR")) mimeType = "image/webp";

    const prompt = `You are an advanced agricultural diagnostics assistant. Analyze the submitted crop image and return only a valid JSON object with this exact schema:
{
  "crop": "common crop name",
  "disease": "specific disease, pest, nutrient deficiency, or Healthy",
  "scientific_name": "scientific pathogen or condition name if known",
  "confidence": 92,
  "type": "disease/pest/nutrient deficiency/healthy",
  "severity": "low/medium/high",
  "spread_risk": "low/medium/high",
  "recovery_outlook": "2 to 3 sentences on likely recovery if action is taken now",
  "recommended_review_window": "when the farmer should inspect again",
  "key_indicators": ["specific visible symptom", "specific visible symptom"],
  "analysis_details": "4 to 6 full sentences explaining the visible evidence in this exact image, why it matches the diagnosis, and what uncertainty remains",
  "urgent_actions": ["2 to 4 immediate next actions for the farmer"],
  "treatment": ["3 to 6 crop-specific treatment steps"],
  "organic_treatment": ["1 to 3 organic or low-residue treatment options if applicable"],
  "conventional_treatment": ["1 to 3 conventional treatment options if applicable"],
  "prevention": ["3 to 6 crop-specific prevention actions"],
  "monitoring_steps": ["2 to 4 follow-up monitoring steps"],
  "likely_causes": ["1 to 3 probable contributing causes or triggers"],
  "risk_factors": ["1 to 4 environmental or management risk factors"],
  "nutrition_notes": "1 to 3 sentences on whether nutrient stress seems relevant"
}

Rules:
- Identify the crop first, then the issue.
- Be specific to the exact uploaded image instead of generic farming advice.
- Return treatment and prevention as arrays, not paragraphs.
- If the plant appears healthy, clearly say Healthy and provide monitoring-focused guidance.
- Do not include markdown.
- Do not repeat the JSON structure in the explanation.
- Return only the JSON object.`;

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-pro",
    ];

    let lastError: unknown = null;
    let responseText = "";
    let usedModel = "";
    let finishReason = "";

    for (const model of modelsToTry) {
      try {
        const apiUrl =
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: imageBase64 } },
                ],
              },
            ],
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1536 },
          }),
        });

        const result = await response.json();
        if (result.error) {
          lastError = result.error;
          continue;
        }

        const candidate = result?.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== "STOP") {
          finishReason = candidate.finishReason;
        }

        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          responseText = text;
          usedModel = model;
          break;
        }

        lastError = { finishReason: candidate?.finishReason };
      } catch (error) {
        lastError = error;
      }
    }

    if (!responseText) {
      throw new Error(
        `All models failed. Last error: ${JSON.stringify(lastError)}`,
      );
    }

    const parsed = extractJSON(responseText);
    const diagnosis = parsed
      ? normalizeDiagnosis(parsed)
      : normalizeDiagnosis({}, responseText.slice(0, 900));

    return new Response(
      JSON.stringify({
        diagnosis,
        model_used: usedModel,
        finish_reason: finishReason || "unknown",
        generated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Edge function error:", message);

    return new Response(
      JSON.stringify({ error: "Analysis failed: " + message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
