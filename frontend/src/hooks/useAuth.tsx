import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { authAPI } from '../utils/api';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: any; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to force Admin role for owner emails
  const enhanceSession = (session: Session | null) => {
    if (session?.user?.email) {
      const adminEmails = ['fx@fxcreativestudio.com', 'admin@wezet.com', 'demo@wezet.com', 'recovery@wezet.com', 'fx.admin@fxcreativestudio.com'];
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

  // Helper to ensure team member record exists (Self-Healing)
  const ensureTeamMemberRecord = async (session: Session | null) => {
    if (!session?.user?.email) return;

    try {
      // Check if record exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!existingMember) {
        console.log('🧟 Zombie User detected! Resurrecting team member record...');

        // Determine role based on metadata or whitelist
        const adminEmails = ['fx@fxcreativestudio.com', 'admin@wezet.com', 'demo@wezet.com', 'recovery@wezet.com', 'fx.admin@fxcreativestudio.com'];
        const isWhitelistedAdmin = adminEmails.includes(session.user.email.toLowerCase());
        const role = isWhitelistedAdmin ? 'Admin' : (session.user.user_metadata?.role || 'Client');

        // Create missing record
        const newMember = {
          id: session.user.id, // Sync ID with Auth ID
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          role: role,
          status: 'active',
          specialties: [],
          services: []
        };

        const { error: insertError } = await supabase
          .from('team_members')
          .insert([newMember] as any);

        if (insertError) {
          console.error('Failed to resurrect user:', insertError);
        } else {
          console.log('✨ User resurrected successfully!');
        }
      }
    } catch (error) {
      console.error('Error in self-healing:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const enhancedSession = enhanceSession(session);
      setSession(enhancedSession);
      setUser(enhancedSession?.user ?? null);
      setLoading(false);
      // if (enhancedSession) ensureTeamMemberRecord(enhancedSession);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const enhancedSession = enhanceSession(session);
      setSession(enhancedSession);
      setUser(enhancedSession?.user ?? null);
      setLoading(false);
      // if (enhancedSession) ensureTeamMemberRecord(enhancedSession);
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

    try {
      const data = await authAPI.signup(email, password, name, role as "admin" | "instructor" | "client");

      // Check if email confirmation is required (User created but no session)
      if (data.user && !data.session) {
        return { error: null, confirmationRequired: true };
      }

      // If we have a session, we are effectively signed in.
      if (data.session) {
        // Trigger Welcome Email manually to ensure delivery
        supabase.functions.invoke('on-signup', {
          body: { email, name }
        }).catch(err => console.error("Failed to send welcome email:", err));

        return { error: null };
      }

      // Fallback: try sign in manually if for some reason session wasn't returned but no confirmation needed?
      // (This path is unlikely if Supabase behaves correctly)
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
    resetPassword: async (email: string) => {
      const redirectTo = `${window.location.origin}/?view=update-password`;
      console.log('Reset Password Redirect URL:', redirectTo);

      // Use Custom Edge Function for branded email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'password_recovery',
          to: email,
          payload: { redirectTo }
        }
      });

      if (error) {
        console.error("Error invoking send-email:", error);
        return { error };
      }

      if (data && !data.success) {
        return { error: { message: data.error || 'Failed to send reset email' } };
      }

      return { error: null };
    },
    updatePassword: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    },
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
