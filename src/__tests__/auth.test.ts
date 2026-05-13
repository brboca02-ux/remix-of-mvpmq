import { describe, it, expect, vi } from "vitest";
import { runAuthAudit } from "../lib/auth-audit.server";

// Mock Supabase Admin
vi.mock('@/integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
      eq: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
}));

describe("Authentication Flow Audit", () => {
  it("should report healthy status when infrastructure is correct", async () => {
    const report = await runAuthAudit();
    
    console.log("--- Auth Audit Report ---");
    console.log(`Status: ${report.status}`);
    report.checks.forEach((c: any) => console.log(`[${c.status}] ${c.name}`));
    
    expect(report.status).not.toBe("error");
  });

  it("should have profiles table enabled with RLS", async () => {
    const report = await runAuthAudit();
    const profilesCheck = report.checks.find((c: any) => c.name === "Profiles Table Accessibility");
    expect(profilesCheck?.status).toBe("ok");
  });
});
