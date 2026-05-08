import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Mock user object to bypass Auth requirements
 */
const MOCK_USER: User = {
  id: "00000000-0000-0000-0000-000000000000",
  app_metadata: {},
  user_metadata: { display_name: "Admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "admin@marketscope.ai",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString()
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Simplified AuthProvider that always returns a mock user in DEV mode
  return (
    <AuthContext.Provider value={{ user: MOCK_USER, loading: false, signOut: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
