import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { condition, features } = await req.json();

    // Calculate risk score (simplified ML prediction)
    const score = (features.eye_contact + features.social_interaction +
      features.sensory_sensitivity + features.communication_delay +
      features.repetitive_behaviour) / 5;

    const risk_score = 100 - score * 10;

    let risk_level = "low";
    let risk_label = "Low Risk";

    if (risk_score >= 75) {
      risk_level = "high";
      risk_label = "High Risk";
    } else if (risk_score >= 55) {
      risk_level = "moderate";
      risk_label = "Moderate Risk";
    } else if (risk_score >= 35) {
      risk_level = "mild";
      risk_label = "Mild Risk";
    }

    const requires_level2 = risk_score >= 55;

    return new Response(JSON.stringify({ risk_score, risk_level, risk_label, requires_level2 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
