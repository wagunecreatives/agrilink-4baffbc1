import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural plant pathologist.

Analyze the uploaded crop image carefully and provide a clear diagnosis.

Return the result in structured text with the following sections:

**Crop Type:**
[Identify the crop/plant type]

**Detected Disease:**
[Name of disease or "No disease detected"]

**Confidence Level:** [Low / Medium / High]

**Visible Symptoms:**
[List observable symptoms]

**Likely Cause:**
[Fungal, bacterial, viral, pest, nutrient deficiency, environmental stress, etc.]

**Recommended Treatment:**
- **Organic treatment options:** [List organic treatments]
- **Chemical treatment options (if necessary):** [List chemical treatments or "Not required"]

**Prevention Tips:**
[List prevention measures]

**Is the crop healthy?** [Yes / No]

Important rules:
- If the crop is healthy, clearly say "Healthy crop – no disease detected".
- If the image is unclear, say "Image unclear – unable to diagnose confidently".
- Be practical, concise, and easy for farmers to understand.
- Do NOT give extreme or unsafe advice.
- Assume the user may be a small-scale farmer.

End with this disclaimer:
"This diagnosis is AI-assisted and does not replace advice from a certified agronomist."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this crop image and provide a comprehensive disease diagnosis and treatment recommendations."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    const diagnosis = data.choices?.[0]?.message?.content;

    if (!diagnosis) {
      throw new Error("No diagnosis received from AI");
    }

    return new Response(
      JSON.stringify({ diagnosis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing crop:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze crop image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
