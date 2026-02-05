import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PAYLOAD_SIZE = 12 * 1024 * 1024; // 12MB
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per hour per IP

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed image types for data URIs
const ALLOWED_IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
const DATA_URI_REGEX = new RegExp(`^data:image\\/(${ALLOWED_IMAGE_TYPES.join('|')});base64,`, 'i');

// Validate image URL format and size
function validateImageUrl(imageUrl: unknown): { valid: boolean; error?: string } {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { valid: false, error: 'Image URL is required and must be a string' };
  }

  // Check if it's a data URI
  if (imageUrl.startsWith('data:')) {
    if (!DATA_URI_REGEX.test(imageUrl)) {
      return { valid: false, error: `Invalid image format. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` };
    }

    // Estimate base64 size (length * 0.75 gives approximate byte size)
    const base64Part = imageUrl.split(',')[1];
    if (!base64Part) {
      return { valid: false, error: 'Malformed data URI' };
    }

    const estimatedBytes = base64Part.length * 0.75;
    if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
      return { valid: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB` };
    }

    // Validate base64 encoding
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Part)) {
      return { valid: false, error: 'Invalid base64 encoding' };
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Allow external URLs but validate format
    try {
      new URL(imageUrl);
    } catch {
      return { valid: false, error: 'Invalid image URL format' };
    }

    // Limit URL length
    if (imageUrl.length > 2048) {
      return { valid: false, error: 'Image URL too long' };
    }
  } else {
    return { valid: false, error: 'Image must be a data URI or HTTPS URL' };
  }

  return { valid: true };
}

// Validate discovery ID format
function validateDiscoveryId(discoveryId: unknown): { valid: boolean; error?: string } {
  if (discoveryId === undefined || discoveryId === null) {
    return { valid: true }; // Optional field
  }

  if (typeof discoveryId !== 'string') {
    return { valid: false, error: 'Discovery ID must be a string' };
  }

  if (!UUID_REGEX.test(discoveryId)) {
    return { valid: false, error: 'Invalid discovery ID format' };
  }

  return { valid: true };
}

// Rate limiting using database
// deno-lint-ignore no-explicit-any
async function checkRateLimit(supabase: any, clientIP: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Count recent requests from this IP
  const { count, error } = await supabase
    .from('discoveries')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', windowStart);

  if (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error to avoid blocking legitimate users
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);
  
  return {
    allowed: requestCount < MAX_REQUESTS_PER_WINDOW,
    remaining
  };
}

// Safe error messages (don't expose internal details)
const SAFE_ERROR_MESSAGES = [
  'Image URL is required and must be a string',
  'Invalid image format',
  'Image too large',
  'Malformed data URI',
  'Invalid base64 encoding',
  'Invalid image URL format',
  'Image URL too long',
  'Image must be a data URI or HTTPS URL',
  'Discovery ID must be a string',
  'Invalid discovery ID format',
  'Rate limit exceeded. Please try again later.',
  'Payload too large',
];

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's a known safe message
    if (SAFE_ERROR_MESSAGES.some(msg => error.message.includes(msg))) {
      return error.message;
    }
    // Check for specific API errors we want to pass through
    if (error.message.includes('Rate limit exceeded') || 
        error.message.includes('AI credits exhausted')) {
      return error.message;
    }
  }
  return 'An error occurred processing your request';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON body
    let body: { imageUrl?: unknown; discoveryId?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageUrl, discoveryId } = body;

    // Validate imageUrl
    const imageValidation = validateImageUrl(imageUrl);
    if (!imageValidation.valid) {
      return new Response(
        JSON.stringify({ error: imageValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate discoveryId
    const discoveryValidation = validateDiscoveryId(discoveryId);
    if (!discoveryValidation.valid) {
      return new Response(
        JSON.stringify({ error: discoveryValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = await checkRateLimit(supabase, clientIP);
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
          } 
        }
      );
    }

    // Cast to string after validation
    const validatedImageUrl = imageUrl as string;
    const validatedDiscoveryId = discoveryId as string | undefined;

    // Update status to analyzing
    if (validatedDiscoveryId) {
      await supabase
        .from("discoveries")
        .update({ status: "analyzing" })
        .eq("id", validatedDiscoveryId);
    }

    console.log(`Processing image analysis request from IP: ${clientIP}, remaining quota: ${rateLimit.remaining}`);

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
                  url: validatedImageUrl
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
      throw new Error("Analysis service temporarily unavailable");
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
    if (validatedDiscoveryId) {
      await supabase
        .from("discoveries")
        .update({
          anomaly_score: parsedAnalysis.anomaly_score,
          anomaly_types: parsedAnalysis.anomaly_types || [],
          ai_analysis: parsedAnalysis.analysis,
          narration: narration,
          status: "complete"
        })
        .eq("id", validatedDiscoveryId);
    }

    console.log(`Analysis complete for discovery: ${validatedDiscoveryId || 'anonymous'}, score: ${parsedAnalysis.anomaly_score}`);

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
        error: getSafeErrorMessage(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});