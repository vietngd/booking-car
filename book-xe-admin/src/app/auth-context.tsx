import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User, Role } from "../types";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      setSession(session);

      if (session) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }

      if (event === "SIGNED_IN") {
        console.log("User signed in");
      }

      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }

      if (event === "USER_UPDATED") {
        if (session) fetchUserProfile(session.user.id, session.user.email!);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Refresh session error:", error);
      // If refresh fails and it's an invalid refresh token, sign out
      if (
        error.message.includes("refresh_token_not_found") ||
        error.message.includes("invalid refresh token")
      ) {
        await signOut();
      }
    } else {
      setSession(data.session);
    }
  };

  const fetchUserProfile = async (id: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", id)
        .single();

      if (error) {
        // If user document doesn't exist yet, we might want to handle it (e.g., first login)
        // For now, assume it's created via RLS or trigger, or manually for first user.
        console.error("Error fetching user profile:", error);
        setUser({ id, email, role: "staff" }); // Default to staff
      } else {
        setUser({
          id,
          email,
          role: data.role as Role,
        });
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
