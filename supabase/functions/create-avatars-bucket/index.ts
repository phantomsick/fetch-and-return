
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Check if the avatars bucket exists
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    // Create the bucket if it doesn't exist
    if (!avatarsBucketExists) {
      console.log('Creating avatars bucket...');
      const { error: createError } = await supabaseClient.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      });
      
      if (createError) {
        throw createError;
      }

      // Set bucket to public
      const { error: updateError } = await supabaseClient.storage.updateBucket('avatars', {
        public: true
      });
      
      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ message: 'Avatars bucket created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Avatars bucket already exists' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
