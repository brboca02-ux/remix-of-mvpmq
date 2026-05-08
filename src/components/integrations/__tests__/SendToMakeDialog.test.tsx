import { render, screen, waitFor } from "@testing-library/react";
import { SendToMakeDialog } from "../SendToMakeDialog";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// Mock the server functions
vi.mock("@/server/make-integration.functions", () => ({
  generateMakeVariants: vi.fn(),
  sendLeadToMake: vi.fn(),
}));

// Mock useServerFn
vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: any) => fn,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock UI components that might cause issues in test environment
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
}));

const mockLead = {
  id: "1",
  companyName: "Test Company",
  niche: "Niche",
  city: "City",
  whatsapp: "123",
  opportunityScore: 80,
  status: "Novo",
} as any;

describe("SendToMakeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle 401 Unauthorized error and use fallback templates without crashing", async () => {
    const { generateMakeVariants } = await import("@/server/make-integration.functions");
    (generateMakeVariants as any).mockRejectedValue({ status: 401, message: "Unauthorized" });

    render(
      <SendToMakeDialog
        lead={mockLead}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Should see fallback text even if server fails
    await waitFor(() => {
      const textareas = screen.getAllByPlaceholderText(/Mensagem variante/);
      expect((textareas[0] as HTMLTextAreaElement).value).toContain("Olá, Test Company!");
    }, { timeout: 3000 });
    
    const { toast } = await import("sonner");
    expect(toast.warning).toHaveBeenCalledWith(
      "Geração com IA indisponível",
      expect.any(Object)
    );
  });

  it("should handle response with undefined variants", async () => {
    const { generateMakeVariants } = await import("@/server/make-integration.functions");
    // Simulate response with missing fields (variantA/variantB missing)
    (generateMakeVariants as any).mockResolvedValue({ used_ai: true });

    render(
      <SendToMakeDialog
        lead={mockLead}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Should not crash and should show empty strings if undefined
    await waitFor(() => {
      const charCounts = screen.getAllByText(/0\/4000/);
      expect(charCounts.length).toBeGreaterThan(0);
    });
  });

  it("should handle completely empty response", async () => {
    const { generateMakeVariants } = await import("@/server/make-integration.functions");
    (generateMakeVariants as any).mockResolvedValue(null);

    render(
      <SendToMakeDialog
        lead={mockLead}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      // Component should still be rendered and not crashed
      expect(screen.getByText(/Enviar via Make/)).toBeInTheDocument();
    });
  });

  it("should not render when lead is null", () => {
    const { container } = render(
      <SendToMakeDialog
        lead={null}
        open={true}
        onOpenChange={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
