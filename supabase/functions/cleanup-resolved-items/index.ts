
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

    // Calculate the timestamp for 48 hours ago
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 48);
    const cutoffTimeString = cutoffTime.toISOString();

    console.log(`Looking for items resolved before ${cutoffTimeString}`);

    // Find items that have been resolved for more than 48 hours
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("items")
      .select("id, title, user_id, category")
      .eq("status", "Resolved")
      .lt("resolved_at", cutoffTimeString);

    if (fetchError) {
      console.error("Error fetching items to delete:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch items for deletion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!itemsToDelete || itemsToDelete.length === 0) {
      console.log("No items to delete at this time");
      return new Response(
        JSON.stringify({ message: "No items to delete" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${itemsToDelete.length} items to delete:`, itemsToDelete);

    // Delete the items
    const itemIds = itemsToDelete.map(item => item.id);
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .in("id", itemIds);

    if (deleteError) {
      console.error("Error deleting items:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications to users about the deletions
    for (const item of itemsToDelete) {
      try {
        // Get user email for notification
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", item.user_id)
          .single();

        if (userError || !userData || !userData.email) {
          console.error(`Could not find user ${item.user_id} for notification:`, userError);
          continue;
        }

        console.log(`Would send deletion confirmation email to: ${userData.email} for item: ${item.title}`);
        // In a real app, you would send an actual email notification here
      } catch (err) {
        console.error(`Error processing notification for item ${item.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${itemIds.length} resolved items`,
        deletedItems: itemsToDelete
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in cleanup-resolved-items function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
