
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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log("Initializing admin functions");

    // Create or update get_items_with_user_details function
    const { error: itemsRpcError } = await supabase.rpc(
      'create_or_replace_function_for_admin',
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
    } else {
      console.log("Successfully created get_items_with_user_details function");
    }

    // Create or update get_reports_with_details function
    const { error: reportsRpcError } = await supabase.rpc(
      'create_or_replace_function_for_admin',
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
    } else {
      console.log("Successfully created get_reports_with_details function");
    }
    
    // Create or update handle_report_and_delete_item function
    const { error: handleReportError } = await supabase.rpc(
      'create_or_replace_function_for_admin',
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
    } else {
      console.log("Successfully created handle_report_and_delete_item function");
    }

    // Create or update create_or_replace_function_for_admin helper function if it doesn't exist
    const { error: createHelperFunctionError } = await supabase.from('_temp_code_execution').select().execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'create_or_replace_function_for_admin'
        ) THEN
          -- Create the helper function to create or replace functions
          CREATE OR REPLACE FUNCTION public.create_or_replace_function_for_admin(
            function_name TEXT,
            function_args TEXT DEFAULT '',
            function_definition TEXT
          )
          RETURNS VOID
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          DECLARE
            full_definition TEXT;
          BEGIN
            IF function_args = '' THEN
              full_definition := format('CREATE OR REPLACE FUNCTION public.%I %s', 
                function_name, function_definition);
            ELSE
              full_definition := format('CREATE OR REPLACE FUNCTION public.%I(%s) %s', 
                function_name, function_args, function_definition);
            END IF;
            
            EXECUTE full_definition;
          END;
          $func$;
        END IF;
      END;
      $$;
    `);
    
    if (createHelperFunctionError) {
      console.error("Error creating helper function:", createHelperFunctionError);
      return new Response(
        JSON.stringify({ error: "Failed to create helper function" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the existing create_admin_functions
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
