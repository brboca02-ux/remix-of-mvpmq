import { expect, test, describe } from "vitest";
import { 
  innerDetectWeakDigitalPresence, 
  innerGenerateSalesMessage 
} from "../lib/cnpj.functions";

describe("Pipeline de Vendas e Presença Digital", () => {
  
  test("Cenário 1: Empresa sem site (DNS Offline)", async () => {
    const mockLeadId = "test-lead-dns-offline";
    const mockPresence = {
      score: 25,
      level: 'low' as const,
      details: {
        site_active: false,
        domain_exists: false,
        physical_presence: false,
        sources_count: 1,
        consistency_score: 0.25
      },
      validations: { dns: false, http: false, osm: false, ibge: true }
    };

    const diagnosis = await innerDetectWeakDigitalPresence({ 
      lead_id: mockLeadId, 
      presence: mockPresence, 
      cnpj: "00000000000000" 
    });

    expect(diagnosis.opportunity_score).toBeGreaterThanOrEqual(30);
    expect(diagnosis.commercial_tags).toContain("no_website");
    expect(diagnosis.critical_failure_type).toBe("no_site_domain");
  });

  test("Cenário 2: Geração de Mensagem com Dados Reais", async () => {
    const mockLeadId = "test-lead-message";
    const problems = ["Domínio não encontrado (DNS falhou)", "Invisível localmente"];
    
    const res = await innerGenerateSalesMessage({
      lead_id: mockLeadId,
      company_name: "Empresa Teste QA",
      city: "São Paulo",
      problems,
      presence_score: 25,
      channel: 'whatsapp',
      commercial_insight: "Invisível no Google",
      financial_impact: "Perda de clientes locais"
    });

    expect(res.message).toContain("Empresa Teste QA");
    expect(res.message).toContain("São Paulo");
    expect(res.message.toLowerCase()).toContain("invisível no google");
    expect(res.message).not.toContain("Aumento de 500% nas vendas"); 
  });
});
