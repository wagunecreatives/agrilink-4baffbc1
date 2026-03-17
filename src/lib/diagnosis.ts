export type DiagnosisRecord = Record<string, unknown>;

export type DiagnosisResult = {
  crop: string;
  disease: string;
  scientific_name: string;
  confidence: number;
  type: string;
  severity: string;
  spread_risk: string;
  recovery_outlook: string;
  recommended_review_window: string;
  analysis_details: string;
  nutrition_notes: string;
  key_indicators: string[];
  urgent_actions: string[];
  treatment: string[];
  organic_treatment: string[];
  conventional_treatment: string[];
  prevention: string[];
  monitoring_steps: string[];
  likely_causes: string[];
  risk_factors: string[];
};

export type DiagnosisRun = {
  id: string;
  createdAt: string;
  imageName: string;
  imageDataUrl: string | null;
  imageMeta: {
    fileSizeKb: number;
    width: number;
    height: number;
    orientation: "portrait" | "landscape" | "square";
    qualityScore: number;
  } | null;
  modelUsed: string;
  finishReason: string;
  diagnosis: DiagnosisResult;
  notes: string;
};

export const cleanText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const isRecord = (value: unknown): value is DiagnosisRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonLike = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const withoutFence = trimmed.replace(/^```(?:json)?\s*|\s*```$/g, "");
  const candidate = withoutFence.trim();

  if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return value;
  }
};

const toText = (value: unknown): string => {
  const parsed = parseJsonLike(value);

  if (typeof parsed === "string") return parsed.trim();

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join("\n");
  }

  if (isRecord(parsed)) {
    const preferredKeys = [
      "analysis_details",
      "details",
      "summary",
      "description",
      "message",
      "value",
    ] as const;

    for (const key of preferredKeys) {
      const candidate = parsed[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return "";
};

const toList = (value: unknown): string[] => {
  const parsed = parseJsonLike(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(/\r?\n|;\s*|,\s*/)
      .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return [];
};

const fallbackText = (
  crop: string,
  disease: string,
  type: string,
  severity: string,
) => {
  const cropLabel = crop.toLowerCase() !== "unknown crop" ? crop : "the uploaded crop";
  const diseaseLabel = disease.toLowerCase() !== "unknown" ? disease : type;
  const severityLabel = severity || "medium";

  return {
    analysis:
      `The uploaded image shows visual patterns consistent with ${diseaseLabel} in ${cropLabel}. ` +
      `The symptom pattern should still be confirmed against field conditions, recent weather, and nearby plants, but the visible signals support this working diagnosis. ` +
      `Severity is currently estimated as ${severityLabel}, so action should be prioritized based on how quickly symptoms are spreading in the field.`,
    outlook:
      severityLabel === "high"
        ? "Recovery is possible, but delayed intervention could lead to significant yield loss."
        : "Recovery outlook is fair if treatment and monitoring begin immediately.",
  };
};

export const normalizeDiagnosis = (value: unknown): DiagnosisResult => {
  const parsedValue = parseJsonLike(value);
  const diagnosis = isRecord(parsedValue) ? parsedValue : {};
  const nestedAnalysis = parseJsonLike(diagnosis.analysis_details);
  const merged = isRecord(nestedAnalysis)
    ? {
        ...nestedAnalysis,
        ...diagnosis,
      }
    : diagnosis;

  const crop = cleanText(merged.crop) || "Unknown crop";
  const disease = cleanText(merged.disease) || "Unknown disease";
  const type = cleanText(merged.type).toLowerCase() || "disease";
  const severity = cleanText(merged.severity).toLowerCase() || "medium";
  const fallback = fallbackText(crop, disease, type, severity);

  return {
    crop,
    disease,
    scientific_name: toText(merged.scientific_name),
    confidence:
      typeof merged.confidence === "number"
        ? merged.confidence
        : Number(merged.confidence) || 0,
    type,
    severity,
    spread_risk: toText(merged.spread_risk) || severity,
    recovery_outlook: toText(merged.recovery_outlook) || fallback.outlook,
    recommended_review_window:
      toText(merged.recommended_review_window) || "Review within the next 24 to 48 hours.",
    analysis_details: toText(merged.analysis_details) || fallback.analysis,
    nutrition_notes:
      toText(merged.nutrition_notes) ||
      "No clear nutrient-linked stress was isolated from the visible symptoms alone.",
    key_indicators: toList(merged.key_indicators),
    urgent_actions: toList(merged.urgent_actions),
    treatment: toList(merged.treatment),
    organic_treatment: toList(merged.organic_treatment),
    conventional_treatment: toList(merged.conventional_treatment),
    prevention: toList(merged.prevention),
    monitoring_steps: toList(merged.monitoring_steps),
    likely_causes: toList(merged.likely_causes),
    risk_factors: toList(merged.risk_factors),
  };
};

export const buildDiagnosisReport = (run: DiagnosisRun): string => {
  const { diagnosis, createdAt, imageName, modelUsed, finishReason, imageMeta, notes } = run;

  const sections = [
    `Agrilink AI Crop Report`,
    `Generated: ${new Date(createdAt).toLocaleString()}`,
    `Image: ${imageName || "Unnamed upload"}`,
    imageMeta
      ? `Image quality: ${imageMeta.qualityScore}/100 | ${imageMeta.width}x${imageMeta.height} | ${imageMeta.fileSizeKb} KB`
      : "",
    `Model: ${modelUsed || "Unknown"}`,
    `Finish reason: ${finishReason || "Unknown"}`,
    "",
    `Crop: ${diagnosis.crop}`,
    `Diagnosis: ${diagnosis.disease}`,
    diagnosis.scientific_name ? `Scientific name: ${diagnosis.scientific_name}` : "",
    `Confidence: ${diagnosis.confidence}%`,
    `Type: ${diagnosis.type}`,
    `Severity: ${diagnosis.severity}`,
    `Spread risk: ${diagnosis.spread_risk}`,
    `Recovery outlook: ${diagnosis.recovery_outlook}`,
    `Review window: ${diagnosis.recommended_review_window}`,
    "",
    `Analysis details:`,
    diagnosis.analysis_details,
    "",
    diagnosis.key_indicators.length ? `Key indicators:\n- ${diagnosis.key_indicators.join("\n- ")}` : "",
    diagnosis.urgent_actions.length ? `Urgent actions:\n- ${diagnosis.urgent_actions.join("\n- ")}` : "",
    diagnosis.treatment.length ? `Treatment:\n- ${diagnosis.treatment.join("\n- ")}` : "",
    diagnosis.organic_treatment.length
      ? `Organic treatment:\n- ${diagnosis.organic_treatment.join("\n- ")}`
      : "",
    diagnosis.conventional_treatment.length
      ? `Conventional treatment:\n- ${diagnosis.conventional_treatment.join("\n- ")}`
      : "",
    diagnosis.prevention.length ? `Prevention:\n- ${diagnosis.prevention.join("\n- ")}` : "",
    diagnosis.monitoring_steps.length
      ? `Monitoring steps:\n- ${diagnosis.monitoring_steps.join("\n- ")}`
      : "",
    diagnosis.likely_causes.length
      ? `Likely causes:\n- ${diagnosis.likely_causes.join("\n- ")}`
      : "",
    diagnosis.risk_factors.length
      ? `Risk factors:\n- ${diagnosis.risk_factors.join("\n- ")}`
      : "",
    diagnosis.nutrition_notes ? `Nutrition notes:\n${diagnosis.nutrition_notes}` : "",
    notes ? `Farmer notes:\n${notes}` : "",
  ];

  return sections.filter(Boolean).join("\n");
};

import { supabase } from "@/integrations/supabase/client";

export async function analyzeCropImage(file: File, fieldNotes = ''): Promise<DiagnosisResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      try {
        const { data, error } = await supabase.functions.invoke('analyze-crop', {
 body: { 
            imageBase64: base64, 
            fileName: file.name,
            mimeType: file.type,
            notes: fieldNotes
          }
        });

        if (error) throw error;
        const rawDiagnosis = data?.diagnosis || data;
        resolve(normalizeDiagnosis(rawDiagnosis));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

