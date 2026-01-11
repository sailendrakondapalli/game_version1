import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface PlayerStats {
  id: string;
  user_id: string;
  username: string;
  kills: number;
  deaths: number;
  wins: number;
  matches_played: number;
  damage_dealt: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  playerStats: PlayerStats | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshPlayerStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPlayerStats(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPlayerStats(session.user.id);
      } else {
        setPlayerStats(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPlayerStats = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Auto-create profile if missing
      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from('player_stats')
          .insert({
            user_id: userId,
            username: `player_${userId.slice(0, 6)}`,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error auto-creating player stats:', insertError);
        } else {
          data = inserted;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading player stats:', error);
      }

      setPlayerStats(data);
    } catch (error) {
      console.error('Error loading player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
  try {
    const { data: existingUsername } = await supabase
      .from('player_stats')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUsername) {
      return { error: { message: 'Username already taken' } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await supabase.from('player_stats').insert({
        user_id: data.user.id,
        username,
      });

      if (profileError) return { error: profileError };

      await loadPlayerStats(data.user.id);
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error };

  if (data.user) {
    await loadPlayerStats(data.user.id);
  }

  return { error: null };
};


  const signOut = async () => {
    await supabase.auth.signOut();
    setPlayerStats(null);
  };

  const refreshPlayerStats = async () => {
    if (user) {
      await loadPlayerStats(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        playerStats,
        loading,
        signUp,
        signIn,
        signOut,
        refreshPlayerStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
