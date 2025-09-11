import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

export const POST: APIRoute = async ({ request, cookies }) => {
  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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

  const reqdata = await request.json();
  const { email, password, firstName, lastName } = reqdata;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Register user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${import.meta.env.SITE || 'http://localhost:4321'}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim()
      }
    }
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // If user is created successfully, create profile
  if (authData.user && !authError) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        email: email
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail registration if profile creation fails
    }
  }

  return new Response(JSON.stringify({ 
    user: authData.user,
    session: authData.session,
    message: authData.user?.email_confirmed_at ? 
      'Registration successful!' : 
      'Check your email to confirm your account!'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};