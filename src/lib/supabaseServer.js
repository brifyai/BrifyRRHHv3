import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (no browser dependencies)
// Environment variables will be read lazily when the client is used

// Create server-side Supabase client with lazy validation
let _supabaseServer = null;

export      console.log('- SUPABASE_URL:', SUPABASE_URL ? 'Present' : 'Missing');
      console.log('- SUPABASE_KEY:', SUPABASE_KEY ? 'Present' : 'Missing');

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Missing Supabase configuration. Please check your environment variables.')
      }

      _supabaseServer = createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
          auth: {
            persistSession: false, // No session persistence on server
            autoRefreshToken: false, // No auto refresh on server
            detectSessionInUrl: false, // No URL detection on server
            flow: 'pkce'
          },
          global: {
            headers: {
              'X-Client-Info': 'StaffHub/1.0.0 (server)',
              'X-Forced-Project': 'tmqglnycivlcjijoymwe'
            }
          },
          db: {
            schema: 'public'
          },
          realtime: {
            disabled: true // Disable realtime on server
          }
        }
      );
    }

    return _supabaseServer[prop];
  }
});

// Export configuration for reference (lazy loaded)
export  }
});