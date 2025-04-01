
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Item ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the item details
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*, profiles(*)")
      .eq("id", itemId)
      .single();

    if (itemError) {
      console.error("Error fetching item:", itemError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch item details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Schedule a background task to send notification after 24 hours
    // In a real implementation, you would use a proper job scheduler
    // For now, we'll log the information that would be sent
    console.log(`Scheduled notification for item ${itemId}. Will be deleted in 48 hours.`);
    console.log(`Would notify user ${item.user_id} about deletion of item: ${item.title}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deletion notification scheduled" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in schedule-deletion-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
