import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

// Helper to get Supabase service role client
function getSupabaseServiceClient() {
  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      get() { return undefined; },
      set() {},
      remove() {},
    },
  });
}

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

    // Use service role client to query user data
    const serviceSupabase = getSupabaseServiceClient();

    // Get users with minimal data for privacy
    const { data: users, error: usersError } = await serviceSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 50
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get profiles for these users
    const userIds = users.users.map(user => user.id);
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Combine user data with profiles (least-privilege data only)
    const combinedUsers = users.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profiles: profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role
        } : null
      };
    });

    return new Response(JSON.stringify({ 
      users: combinedUsers.slice(0, 10) // Limit to recent 10 for dashboard
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
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

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied. Admin role required.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { action, userId, role } = await request.json();

    const serviceSupabase = getSupabaseServiceClient();

    switch (action) {
      case 'updateRole':
        if (!userId || !role) {
          return new Response(JSON.stringify({ error: 'Missing userId or role' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Update user role in profiles table
        const { error: updateError } = await serviceSupabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user role:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to update user role' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Admin users POST API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};