
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

    console.log("Initializing admin functions");

    // Create RPC function for getting items with user details
    const { error: itemsRpcError } = await supabase.rpc(
      'create_or_replace_function',
      {
        function_name: 'get_items_with_user_details',
        function_args: 'p_category text, p_status text, p_search text',
        function_definition: `
          RETURNS SETOF jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT
              jsonb_build_object(
                'id', i.id,
                'title', i.title,
                'description', i.description,
                'category', i.category,
                'location', i.location,
                'image_url', i.image_url,
                'date', i.date,
                'user_id', i.user_id,
                'status', i.status,
                'contact_info', i.contact_info,
                'created_at', i.created_at,
                'user', jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'email', p.email,
                  'role', p.role,
                  'banned', p.banned
                )
              )
            FROM
              public.items i
            LEFT JOIN
              public.profiles p ON i.user_id = p.id
            WHERE
              (p_category IS NULL OR i.category = p_category) AND
              (p_status IS NULL OR i.status = p_status) AND
              (p_search IS NULL OR 
                i.title ILIKE '%' || p_search || '%' OR 
                i.description ILIKE '%' || p_search || '%' OR 
                i.location ILIKE '%' || p_search || '%'
              )
            ORDER BY
              i.created_at DESC;
          END;
          $$;
        `
      }
    );
    
    if (itemsRpcError) {
      console.error("Error creating get_items_with_user_details function:", itemsRpcError);
    }

    // Create RPC function for getting reports with details
    const { error: reportsRpcError } = await supabase.rpc(
      'create_or_replace_function',
      {
        function_name: 'get_reports_with_details',
        function_definition: `
          RETURNS SETOF jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT
              jsonb_build_object(
                'id', r.id,
                'item_id', r.item_id,
                'reporter_id', r.reporter_id,
                'reason', r.reason,
                'status', r.status,
                'created_at', r.created_at,
                'item', jsonb_build_object(
                  'id', i.id,
                  'title', i.title,
                  'category', i.category
                ),
                'reporter', jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'email', p.email
                )
              )
            FROM
              public.reports r
            LEFT JOIN
              public.items i ON r.item_id = i.id
            LEFT JOIN
              public.profiles p ON r.reporter_id = p.id
            ORDER BY
              r.created_at DESC;
          END;
          $$;
        `
      }
    );
    
    if (reportsRpcError) {
      console.error("Error creating get_reports_with_details function:", reportsRpcError);
    }
    
    // Create function to handle report and delete item
    const { error: handleReportError } = await supabase.rpc(
      'create_or_replace_function',
      {
        function_name: 'handle_report_and_delete_item',
        function_args: 'p_report_id uuid, p_item_id uuid',
        function_definition: `
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Mark the report as reviewed
            UPDATE public.reports
            SET status = 'reviewed'
            WHERE id = p_report_id;
            
            -- Delete the item
            DELETE FROM public.items
            WHERE id = p_item_id;
          END;
          $$;
        `
      }
    );
    
    if (handleReportError) {
      console.error("Error creating handle_report_and_delete_item function:", handleReportError);
    }
    
    // Create or replace function that creates admin functions
    const { error: createAdminFunctionsError } = await supabase.rpc('create_admin_functions');
    
    if (createAdminFunctionsError) {
      console.error("Error creating admin functions:", createAdminFunctionsError);
      return new Response(
        JSON.stringify({ error: "Failed to create admin functions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Admin functions initialized successfully");
    
    return new Response(
      JSON.stringify({ message: "Admin functions initialized successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-functions edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
