import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, discoveryId } = await req.json();
    
    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to analyzing
    if (discoveryId) {
      await supabase
        .from("discoveries")
        .update({ status: "analyzing" })
        .eq("id", discoveryId);
    }

    // Call AI to analyze the image
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert satellite imagery analyst specializing in detecting unusual patterns and anomalies in Google Earth imagery. Your job is to analyze images for:

1. STRUCTURAL ANOMALIES: Unnatural geometric patterns, straight lines in nature, perfect circles, rectangular formations
2. SHADOWING: Unusual shadow patterns suggesting depth or hidden structures
3. COLOR ANOMALIES: Discoloration, unusual vegetation patterns, or thermal signatures
4. PATTERN RECOGNITION: Repetitive structures, grid patterns, or symmetrical formations
5. GEOLOGICAL ODDITIES: Unusual terrain formations, underwater structures, or landscape anomalies

Be dramatic but analytical. Score anomalies from 0-10 where:
- 0-2: Normal terrain, nothing unusual
- 3-4: Minor curiosity, could be natural
- 5-6: Notable anomaly worth investigating
- 7-8: Significant unexplained feature
- 9-10: Extraordinary discovery requiring attention

Respond with JSON only in this exact format:
{
  "anomaly_score": <number 0-10>,
  "anomaly_types": [<array of detected anomaly types>],
  "analysis": "<detailed analysis of what you see, 2-3 sentences>",
  "coordinates_estimate": "<if visible, otherwise 'Unknown'>",
  "mystery_level": "<Low/Medium/High/Extreme>"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this satellite/Google Earth image for anomalies. Look for anything unusual, unexplained, or mysterious. Be thorough and dramatic in your assessment."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (analysisResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add more credits.");
      }
      throw new Error("AI analysis failed");
    }

    const analysisData = await analysisResponse.json();
    const aiContent = analysisData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let parsedAnalysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      parsedAnalysis = {
        anomaly_score: 3,
        anomaly_types: ["Parsing Error"],
        analysis: "Unable to fully analyze the image. The terrain appears to show standard geographical features.",
        mystery_level: "Low"
      };
    }

    // Generate dramatic narration
    const narrationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a dramatic narrator for mystery/conspiracy content. Create SHORT, punchy narration (max 3 sentences) for social media reels about Google Earth discoveries. Use suspense, uncertainty, and intrigue. Never state facts - use phrases like "appears to be", "some believe", "unexplained". Channel the energy of viral mystery channels. Make it DRAMATIC.`
          },
          {
            role: "user",
            content: `Create dramatic reel narration for this discovery:
Anomaly Score: ${parsedAnalysis.anomaly_score}/10
Analysis: ${parsedAnalysis.analysis}
Anomaly Types: ${parsedAnalysis.anomaly_types?.join(", ")}
Mystery Level: ${parsedAnalysis.mystery_level}`
          }
        ],
      }),
    });

    let narration = "What lies hidden in the shadows of Google Earth? Some mysteries refuse to be explained...";
    
    if (narrationResponse.ok) {
      const narrationData = await narrationResponse.json();
      narration = narrationData.choices?.[0]?.message?.content || narration;
    }

    // Update the discovery in the database
    if (discoveryId) {
      await supabase
        .from("discoveries")
        .update({
          anomaly_score: parsedAnalysis.anomaly_score,
          anomaly_types: parsedAnalysis.anomaly_types || [],
          ai_analysis: parsedAnalysis.analysis,
          narration: narration,
          status: "complete"
        })
        .eq("id", discoveryId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: parsedAnalysis,
        narration: narration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("analyze-image error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});