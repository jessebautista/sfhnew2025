import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values instead of throwing an error
    console.warn('useAuth called outside of AuthProvider context, returning default values');
    return {
      user: null,
      profile: null,
      session: null,
      loading: true,
      signIn: async () => ({ error: 'Auth not available' }),
      signUp: async () => ({ error: 'Auth not available' }),
      signOut: async () => {},
      updateProfile: async () => ({ error: 'Auth not available' })
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Get initial session
  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        
        // Try to get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        }
        
        console.log('AuthProvider: Session retrieved:', !!session);
        console.log('AuthProvider: Session details:', session ? {
          user_id: session.user?.id,
          email: session.user?.email,
          expires_at: session.expires_at
        } : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Fetching profile for user:', session.user.id);
          await fetchProfile(session.user.id);
        }
        
        console.log('AuthProvider: Setting loading to false');
        setLoading(false);
      } catch (error) {
        console.error('AuthProvider: Unexpected error in getSession:', error);
        setLoading(false);
      }
    };

    // Initial session load
    getSession();

    // Also try refreshing session in case of cookie sync issues
    const refreshSession = async () => {
      console.log('AuthProvider: Attempting session refresh...');
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
          console.log('AuthProvider: Session refresh failed (normal if no session):', error.message);
        } else if (session) {
          console.log('AuthProvider: Session refreshed successfully:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('AuthProvider: Session refresh error (normal if no session):', error);
      }
    };

    // Try refresh after initial attempt
    setTimeout(refreshSession, 1000);

    // Add timeout fallback for initial auth
    const timeout = setTimeout(() => {
      console.warn('AuthProvider: Auth loading timeout, forcing completion');
      setLoading(false);
    }, 8000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, !!session);
        console.log('AuthProvider: Auth event details:', {
          event,
          user_id: session?.user?.id,
          email: session?.user?.email
        });
        
        clearTimeout(timeout); // Clear timeout on auth change
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('AuthProvider: Starting fetchProfile for user ID:', userId);
    
    try {
      // Create timeout promises for each query
      const timeoutPromise = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
      );

      // Fetch profile from profiles table with timeout
      console.log('AuthProvider: Querying profiles table...');
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const profileResult = await Promise.race([
        profilePromise,
        timeoutPromise(5000)
      ]);

      const { data: profile, error: profileError } = profileResult as any;

      console.log('AuthProvider: Profiles query result:', { 
        hasData: !!profile, 
        error: profileError?.message || 'none',
        errorCode: profileError?.code || 'none'
      });

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('AuthProvider: Profile fetch error (non-critical):', profileError);
      }

      // Fetch user role from user_roles table with timeout
      console.log('AuthProvider: Querying user_roles table...');
      const rolePromise = supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)
        .single();

      const roleResult = await Promise.race([
        rolePromise,
        timeoutPromise(5000)
      ]);

      const { data: userRole, error: roleError } = roleResult as any;

      console.log('AuthProvider: User roles query result:', { 
        hasData: !!userRole, 
        role_id: userRole?.role_id,
        error: roleError?.message || 'none',
        errorCode: roleError?.code || 'none'
      });

      if (roleError && roleError.code !== 'PGRST116') {
        console.warn('AuthProvider: User role fetch error (non-critical):', roleError);
      }

      // Map role_id to role name
      let role = 'user'; // default role
      if (userRole?.role_id === 1) {
        role = 'admin';
      }

      console.log('AuthProvider: User role determined:', { 
        role_id: userRole?.role_id, 
        role: role,
        mapping: 'role_id=1 -> admin, other -> user'
      });

      // Combine profile data with role
      const enrichedProfile = profile ? {
        ...profile,
        role: role
      } : {
        id: userId,
        role: role,
        username: '',
        // Add any other default profile fields if needed
      };

      console.log('AuthProvider: Setting profile with role:', role);
      console.log('AuthProvider: Profile data structure:', Object.keys(enrichedProfile));
      
      setProfile(enrichedProfile);
      console.log('AuthProvider: Profile set successfully - fetchProfile complete');
    } catch (error) {
      console.error('AuthProvider: Profile fetch exception:', error);
      console.log('AuthProvider: Setting profile to null due to exception');
      
      // Even if queries fail, set a basic profile with user role
      setProfile({
        id: userId,
        role: 'user',
        username: '',
      });
    }
  };

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (password) {
        return await supabase.auth.signInWithPassword({ email, password });
      } else {
        return await supabase.auth.signInWithOtp({ 
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userData
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;