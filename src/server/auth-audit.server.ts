import { getSupabase } from "./leads-core";

export async function runAuthAudit() {
    const results: any = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: [],
      errors: []
    };

    const supabase = getSupabase();

    // 1. Check Supabase connection & basic auth status
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      results.checks.push({ name: "Supabase Session Access", status: "ok" });
    } catch (e: any) {
      results.status = "degraded";
      results.errors.push(`Falha ao acessar sessão Supabase: ${e.message}`);
      results.checks.push({ name: "Supabase Session Access", status: "failed" });
    }

    // 2. Check if profiles table exists and is readable
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error && error.code !== "PGRST116") { // Not found (empty) is ok
        throw error;
      }
      results.checks.push({ name: "Profiles Table Accessibility", status: "ok" });
    } catch (e: any) {
      results.status = "degraded";
      results.errors.push(`Tabela 'profiles' inacessível ou sem RLS correto: ${e.message}`);
      results.checks.push({ name: "Profiles Table Accessibility", status: "failed" });
    }

    // 3. Current context
    try {
      const { data: { user } } = await supabase.auth.getUser();
      results.checks.push({ name: "Current User Context", status: user ? "authenticated" : "anonymous" });
    } catch (e: any) {
      results.errors.push(`Erro ao validar contexto de usuário: ${e.message}`);
    }

    return results;
}
