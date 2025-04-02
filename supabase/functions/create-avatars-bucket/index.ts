
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if the avatars bucket already exists
    const { data: existingBuckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (bucketError) {
      throw bucketError
    }

    const avatarsBucketExists = existingBuckets.some(bucket => bucket.name === 'avatars')

    if (!avatarsBucketExists) {
      // Create the avatars bucket
      const { error: createError } = await supabaseAdmin
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024, // 1MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        })

      if (createError) {
        throw createError
      }

      // Set up public access for the bucket
      const { error: policyError } = await supabaseAdmin
        .storage
        .from('avatars')
        .createSignedUrl('dummy.txt', 1) // This is just to initialize the bucket

      if (policyError && !policyError.message.includes('The resource was not found')) {
        throw policyError
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Avatars bucket is ready" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
