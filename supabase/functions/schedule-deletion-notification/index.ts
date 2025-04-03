
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
      .select("*, profiles(email, name)")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error("Error fetching item:", itemError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch item details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email for notification
    const userEmail = item.profiles?.email;
    const userName = item.profiles?.name || "User";
    
    if (!userEmail) {
      console.error(`No email found for user ${item.user_id}`);
      return new Response(
        JSON.stringify({ error: "No email found for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scheduled notification for item ${itemId}. Will be deleted in 48 hours.`);
    console.log(`Would send email to ${userEmail} for user ${userName} about deletion of item: ${item.title}`);
    
    // In a real production environment, you would queue an email to be sent here
    // For demonstration purposes, we're just logging what would happen

    // Calculate the actual deletion time (48 hours from now)
    const deletionTime = new Date();
    deletionTime.setHours(deletionTime.getHours() + 48);
    const formattedDeletionTime = deletionTime.toLocaleString();

    // Log the email that would be sent
    const emailSubject = `Your ${item.category} item will be deleted soon`;
    const emailBody = `
      Dear ${userName},
      
      Your ${item.category} item "${item.title}" that was marked as resolved 
      will be automatically deleted on ${formattedDeletionTime}.
      
      If you need to keep this record, please log in and change its status back to "Open".
      
      Thank you for using our Lost & Found service.
    `;

    console.log("Email subject:", emailSubject);
    console.log("Email body:", emailBody);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deletion notification scheduled",
        scheduledDeletion: formattedDeletionTime
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
