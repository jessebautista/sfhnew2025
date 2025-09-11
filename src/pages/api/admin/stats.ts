import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

// Helper to get regular Supabase client for session validation
function getSupabaseClient(cookies: any) {
  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: any) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: any) {
        cookies.delete(key, options);
      },
    },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Verify user session and admin permissions
    const supabase = getSupabaseClient(cookies);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch stats using regular supabase client (these tables are accessible to authenticated users)
    const [
      usersResponse,
      pianosResponse,
      newsResponse,
      applicationsResponse,
      pendingApplicationsResponse
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('pianos').select('id', { count: 'exact' }),
      supabase.from('news').select('id', { count: 'exact' }),
      supabase.from('piano_applications').select('id', { count: 'exact' }),
      supabase.from('piano_applications').select('id', { count: 'exact' }).eq('status', 'pending')
    ]);

    const stats = {
      totalUsers: usersResponse.count || 0,
      totalPianos: pianosResponse.count || 0,
      totalNews: newsResponse.count || 0,
      totalApplications: applicationsResponse.count || 0,
      pendingApplications: pendingApplicationsResponse.count || 0
    };

    return new Response(JSON.stringify({ stats }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};