import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to force Admin role for owner emails
  const enhanceSession = (session: Session | null) => {
    if (session?.user?.email) {
      const adminEmails = ['fx@fxcreativestudio.com', 'admin@wezet.com', 'demo@wezet.com', 'recovery@wezet.com'];
      if (adminEmails.includes(session.user.email.toLowerCase())) {
        // Force Admin role in user metadata
        session.user.user_metadata = {
          ...session.user.user_metadata,
          role: 'Admin'
        };
      }
    }
    return session;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const enhancedSession = enhanceSession(session);
      setSession(enhancedSession);
      setUser(enhancedSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const enhancedSession = enhanceSession(session);
      setSession(enhancedSession);
      setUser(enhancedSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { error };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'client') => {
    // Note: We need to call our backend endpoint for signup
    // because we need to set user_metadata which requires admin privileges
    const { authAPI } = await import('../utils/api');

    try {
      await authAPI.signup(email, password, name, role);

      // After signup, sign them in
      return await signIn(email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getAccessToken = () => {
    return session?.access_token ?? null;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
