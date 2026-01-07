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

    const systemPrompt = `You are an expert agricultural plant pathologist with extensive knowledge of crop diseases, pests, and nutrient deficiencies. Analyze the provided crop image and provide a detailed diagnosis.

Your analysis should include:
1. **Crop Identification**: Identify the type of crop/plant if visible
2. **Health Assessment**: Overall health status (Healthy, Mild Issues, Moderate Issues, Severe Issues)
3. **Disease/Problem Identification**: Specific disease, pest, or deficiency identified (if any)
4. **Confidence Level**: Your confidence in the diagnosis (Low, Medium, High)
5. **Symptoms Observed**: List the visible symptoms in the image
6. **Cause**: The likely cause (fungal, bacterial, viral, pest, nutrient deficiency, environmental stress, etc.)
7. **Treatment Recommendations**: Specific actionable treatment steps
8. **Prevention Tips**: How to prevent this issue in the future
9. **Urgency**: How quickly action should be taken (Low, Medium, High)

If the image is unclear or doesn't show a crop, politely explain that you need a clearer image of the plant/crop to provide an accurate diagnosis.

Format your response in a clear, structured way that farmers can easily understand and act upon.`;

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
