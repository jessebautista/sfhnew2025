import { createServerClient } from '@supabase/ssr';
import type { APIRoute } from 'astro';

export async function onRequest({ locals, cookies, url }: any, next: any) {
  // Require environment variables - never use defaults
  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL) {
    throw new Error('PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error('PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }

  // Create Supabase client for server-side authentication
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies.get(key)?.value;
        },
        set(key, value, options) {
          cookies.set(key, value, options);
        },
        remove(key, options) {
          cookies.delete(key, options);
        },
      },
    }
  );

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error);
    }

    // Make supabase and session available to all pages
    locals.supabase = supabase;
    locals.session = session;
    locals.user = session?.user || null;

    // Optional: Log authentication events in development
    if (import.meta.env.DEV && session) {
      console.log(`Authenticated request: ${url.pathname} - User: ${session.user.email}`);
    }

  } catch (error) {
    console.error('Middleware error:', error);
    locals.supabase = supabase;
    locals.session = null;
    locals.user = null;
  }

  return next();
}