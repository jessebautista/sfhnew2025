import type { AstroGlobal } from 'astro';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

export interface UserProfile {
  id: string;
  role: 'user' | 'admin' | 'editor';
  first_name?: string;
  last_name?: string;
  full_name?: string;
  bio?: string;
  website?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export function requireAuth(Astro: AstroGlobal) {
  const session = Astro.locals.session;
  const user = Astro.locals.user;

  if (!session || !user) {
    return Astro.redirect('/auth/login?redirect=' + encodeURIComponent(Astro.url.pathname));
  }

  return { session, user };
}

export async function requireRole(
  Astro: AstroGlobal, 
  requiredRoles: ('admin' | 'editor' | 'user')[]
) {
  const authResult = requireAuth(Astro);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;
  const supabase = Astro.locals.supabase;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || !requiredRoles.includes(profile.role)) {
      return Astro.redirect('/dashboard?error=access_denied');
    }

    return { user, profile };
  } catch (error) {
    console.error('Role check error:', error);
    return Astro.redirect('/dashboard?error=auth_error');
  }
}

export function redirectIfAuthenticated(Astro: AstroGlobal, redirectTo = '/dashboard') {
  const session = Astro.locals.session;
  
  if (session) {
    const redirect = Astro.url.searchParams.get('redirect');
    return Astro.redirect(redirect || redirectTo);
  }
}

export function getAuthenticatedUser(Astro: AstroGlobal) {
  return {
    session: Astro.locals.session,
    user: Astro.locals.user,
    supabase: Astro.locals.supabase
  };
}