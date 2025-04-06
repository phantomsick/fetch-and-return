
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function ensures that the avatars bucket exists and is properly configured
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Create a Supabase client with the Admin key
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

    // Check if avatars bucket already exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError)
      return new Response(
        JSON.stringify({ error: 'Failed to list buckets' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars')
    
    if (!avatarsBucketExists) {
      console.log('Creating avatars bucket...')
      const { error: createError } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      })
      
      if (createError) {
        console.error('Error creating avatars bucket:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create avatars bucket' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      // Set bucket public
      const { error: updateError } = await supabaseAdmin.storage.updateBucket('avatars', {
        public: true
      })
      
      if (updateError) {
        console.error('Error making avatars bucket public:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to make avatars bucket public' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Avatars bucket created and made public' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: true, message: 'Avatars bucket already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error handling request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
