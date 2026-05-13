import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, ExternalLink, Building2, MapPin, Users, Briefcase, AlertCircle,
  CheckCircle2, Gauge, ShieldCheck, MessageCircle, Contact, Copy, Globe, Sparkles,
  Info, History, Activity, Server, AlertTriangle, HelpCircle, Flame, Snowflake, Mail, Send,
  TrendingUp, Calendar, Layout, Save, RefreshCw, PenTool, Star, ArrowRight, FileDown,
  Instagram, ListChecks, CheckCircle, ShieldAlert, UserMinus, Ban
} from "@/lib/icons";
import { getLeadDataSources, updateLeadOperation } from "@/server/leads-import.functions";
import { lookupCnpj, searchCompanyPresence, detectWeakDigitalPresence, generateSalesMessage, generateFollowUpSequence, type CnpjDetails } from "@/lib/cnpj.functions";
import { analyzeLeadSiteData, generateLeadSiteSections, updateLeadSiteSection, type SiteSection, type ExtractedFeatures } from "@/server/site-generator.functions";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { SendToMakeDialog } from "@/components/integrations/SendToMakeDialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzePageSpeed, type PageSpeedResult } from "@/server/pagespeed.functions";
import { computeDigitalScore, digitalLevelEmoji, digitalLevelLabel } from "@/lib/digital-score";
import { formatCurrency } from "@/lib/format";
import { isRealCompany } from "@/lib/real-companies";
import { downloadVCard } from "@/lib/vcard";
import { whatsappLink } from "@/lib/whatsapp";
import { generateCreative } from "@/server/creative-engine.functions";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/company-types";
import { supabase } from "@/integrations/supabase/client";
import type { ProspectLead } from "@/modules/prospecting/types";
import { useFollowupStore } from "@/modules/followup/followup-store";

const exportToPdf = async (element: HTMLElement, filename: string) => {
  if (typeof window === 'undefined') return;
  const { default: html2pdf } = await import(/* @vite-ignore */ 'html2pdf.js');
  const opt: any = {
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  return html2pdf().set(opt).from(element).save();
};

function formatCnpj(raw: string) {
  const d = raw.replace(/\D/g, "").padStart(14, "0").slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function ensureHttps(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`;
}

export function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
}: {
  company: Company | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [details, setDetails] = useState<CnpjDetails | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [psiLoading, setPsiLoading] = useState(false);
  const [psi, setPsi] = useState<PageSpeedResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creative, setCreative] = useState<any>(null);
  const [framework, setFramework] = useState<"AIDA" | "PAS">("AIDA");
  const [pitch, setPitch] = useState<string | null>(null);
  const [pitchType, setPitchType] = useState<string>("");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isNoInterestDialogOpen, setIsNoInterestDialogOpen] = useState(false);
  const [isObjectionDialogOpen, setIsObjectionDialogOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [noInterestReason, setNoInterestReason] = useState("");
  const [objectionType, setObjectionType] = useState<any>("");
  const [isSavingOperation, setIsSavingOperation] = useState(false);
  const updateOperationFn = useServerFn(updateLeadOperation);
  const { sequences, registerObjection } = useFollowupStore();
  
  const [siteTab, setSiteTab] = useState<"config" | "preview" | "edit">("config");
  const [mapsText, setMapsText] = useState("");
  const [instaBio, setInstaBio] = useState("");
  const [instaPosts, setInstaPosts] = useState("");
  const [instaLink, setInstaLink] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [tone, setTone] = useState("Local/bairro");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [extracted, setExtracted] = useState<ExtractedFeatures | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const isInstaValid = useMemo(() => {
    if (!instaLink) return true;
    return /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instaLink);
  }, [instaLink]);

  const isMapsValid = useMemo(() => {
    if (!mapsLink) return true;
    return /^https?:\/\/(www\.)?(goo\.gl\/maps\/|maps\.app\.goo\.gl\/|google\.com\/maps\/).+$/.test(mapsLink);
  }, [mapsLink]);

  const queryClient = useQueryClient();

  const { data: leadAnalysis } = useQuery({
    queryKey: ['lead-analysis', company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads_analysis")
        .select("*")
        .eq("id", company?.id || "")
        .maybeSingle();
      return data;
    },
    enabled: !!company?.id && open,
  });

  useEffect(() => {
    if (leadAnalysis) {
      setMapsText(leadAnalysis.maps_text || "");
      setInstaBio(leadAnalysis.instagram_bio || "");
      setInstaPosts(leadAnalysis.instagram_posts || "");
      setTone(leadAnalysis.target_tone || "Local/bairro");
      setInstaLink(leadAnalysis.instagram_url || "");
      setMapsLink(leadAnalysis.google_maps_url || "");
      if (leadAnalysis.site_sections) {
        setSections(leadAnalysis.site_sections as unknown as SiteSection[]);
      }
      if (leadAnalysis.extracted_features) {
        setExtracted(leadAnalysis.extracted_features as unknown as ExtractedFeatures);
      }
    }
  }, [leadAnalysis]);

  const handleImproveSite = async () => {
    if (!company) return;
    setIsAnalyzing(true);
    try {
      const features = await analyzeLeadSiteData({
        data: {
          lead_id: company.id,
          maps_text: mapsText,
          instagram_bio: instaBio,
          instagram_posts: instaPosts,
          tone
        }
      });
      setExtracted(features);
      const newSections = await generateLeadSiteSections({
        data: {
          lead_id: company.id,
          features,
          tone
        }
      });
      setSections(newSections);
      setSiteTab("preview");
      toast.success("Site gerado com base nos dados reais!");
    } catch (error) {
      toast.error("Falha ao analisar dados do site.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current || !company) return;
    setIsExportingPdf(true);
    try {
      await exportToPdf(previewRef.current, `landing-page-${company.nome.toLowerCase().replace(/\s+/g, '-')}`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleUpdateSection = (id: string, newContent: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const handleSaveSections = async () => {
    if (!company) return;
    try {
      await updateLeadSiteSection({
        data: {
          lead_id: company.id,
          sections
        }
      });
      toast.success("Páginas do site atualizadas!");
      queryClient.invalidateQueries({ queryKey: ['lead-analysis', company.id] });
    } catch (error) {
      toast.error("Erro ao salvar alterações.");
    }
  };

  const { data: dataSources } = useQuery({
    queryKey: ['lead-sources', company?.id],
    queryFn: () => getLeadDataSources({ data: { lead_id: company?.id || "" } }),
    enabled: !!company?.id,
  });
  const { data: presence } = useQuery({
    queryKey: ['lead-presence', company?.id],
    queryFn: () => searchCompanyPresence({ 
      data: { 
        lead_id: company?.id || "",
        cnpj: company?.cnpj || "",
        site: company?.site || undefined,
        cidade: company?.cidade || "",
        uf: company?.estado || "",
        logradouro: details?.endereco?.logradouro
      } 
    }),
    enabled: !!company?.id,
  });
  const { data: opportunity } = useQuery({
    queryKey: ['lead-opportunity', company?.id],
    queryFn: () => detectWeakDigitalPresence({ 
      data: { 
        lead_id: company?.id || "",
        presence: presence!,
        cnpj: company?.cnpj || ""
      } 
    }),
    enabled: !!presence,
  });

  async function handleGenerateCreative() {
    if (!company) return;
    setGenerating(true);
    try {
      const res = await generateCreative({ 
        data: { 
          companyName: company.nome,
          framework 
        } 
      });
      setCreative(res);
      toast.success("Criativo gerado com sucesso!");
    } catch (e) {
      toast.error("Falha ao gerar criativo.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSalesPitch(channel: 'whatsapp' | 'email' | 'consultative') {
    if (!company || !opportunity) return;
    try {
      const res = await generateSalesMessage({
        data: {
          lead_id: company.id,
          company_name: company.nome,
          city: company.cidade,
          problems: opportunity.reasoning,
          presence_score: presence?.score || 0,
          channel,
          diagnostic_message: (opportunity as any).diagnostic_message,
          urgency_level: (opportunity as any).urgency_level,
          commercial_insight: (opportunity as any).commercial_insight,
          financial_impact: (opportunity as any).financial_impact_reason
        }
      });
      setPitch(res.message);
      setPitchType(channel);
      toast.success(`Abordagem ${channel} gerada!`);
      await generateFollowUpSequence({
        data: {
          lead_id: company.id,
          company_name: company.nome,
          city: company.cidade,
          problems: opportunity.reasoning,
          presence_score: presence?.score || 0,
          channel: channel === 'consultative' ? 'email' : (channel as any)
        }
      });
    } catch (e) {
      toast.error("Falha ao gerar abordagem.");
    }
  }

  useEffect(() => {
    if (!open || !company) return;
    setDetails(null);
    setCnpjError(null);
    setPsi(null);
    setCreative(null);

    const cnpjDigits = company.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length === 14) {
      setCnpjLoading(true);
      lookupCnpj({ data: { cnpj: cnpjDigits } })
        .then((r) => {
          if (r.ok) setDetails(r.data);
          else setCnpjError(r.error === ("RATE_LIMIT" as string) ? "Muitas consultas — aguarde alguns segundos." : null);
        })
        .catch(() => setCnpjError("Falha ao consultar Receita Federal."))
        .finally(() => setCnpjLoading(false));
    }

    if (company.site) {
      setPsiLoading(true);
      analyzePageSpeed({ data: { url: company.site } })
        .then((r) => setPsi(r))
        .catch((e) => setPsi({ ok: false, error: e instanceof Error ? e.message : "Falha PSI" }))
        .finally(() => setPsiLoading(false));
    }
  }, [open, company]);

  if (!company) return null;

  const nome = details?.razaoSocial || company.nome;
  const fantasia = details?.nomeFantasia || company.fantasia || "";
  const telefone = details?.telefone || company.telefone || "";
  const email = details?.email || company.email || "";
  const site = company.site || "";
  const cidade = details?.endereco.cidade || company.cidade;
  const uf = details?.endereco.uf || company.estado;
  const situacao = details?.situacao || (company.status === "ativa" ? "ATIVA" : "BAIXADA");
  const isAtiva = situacao.toUpperCase().includes("ATIVA");
  const ds = computeDigitalScore(company);
  const psiColor = !psi?.ok
    ? "border-border text-muted-foreground"
    : psi.score >= 80
      ? "border-success/40 bg-success/10 text-success"
      : psi.score >= 50
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pb-6">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold flex-1">{nome}</DialogTitle>
              <Badge variant="outline" className={isAtiva ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}>
                {isAtiva ? "✅ ATIVA" : "❌ " + situacao}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4 pt-2">
            <Section title="Identidade" icon={<Building2 className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Cidade/UF" value={`${cidade} / ${uf}`} />
                <Field icon={<Briefcase className="h-3.5 w-3.5" />} label="CNAE" value={`${company.cnaeCode}`} />
              </div>
            </Section>
            <Section title="Contato & Site" icon={<MessageCircle className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="📞 Telefone" value={telefone || "—"} />
                  <Field label="📧 Email" value={email || "—"} />
                </div>
              </div>
            </Section>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border-2 border-violet-100 bg-violet-50/30 p-5 space-y-4">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Flame className="h-4 w-4 text-orange-500" />
                 Ações Rápidas
               </h3>
               <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setIsNoInterestDialogOpen(true)} className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl">
                    <UserMinus className="h-4 w-4 mr-2" /> Sem Interesse
                  </Button>
                  <Button variant="outline" onClick={() => setIsDiscardDialogOpen(true)} className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl">
                    <Ban className="h-4 w-4 mr-2" /> Descartar
                  </Button>
                  <Button variant="outline" onClick={() => setIsObjectionDialogOpen(true)} className="col-span-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl">
                    <ShieldAlert className="h-4 w-4 mr-2" /> Registrar Objeção
                  </Button>
                  <Button onClick={() => setIsSendDialogOpen(true)} className="col-span-2 bg-primary hover:bg-primary/90 rounded-xl">
                    <Send className="h-4 w-4 mr-2" /> Iniciar Prospecção
                  </Button>
               </div>
            </div>
          </div>
        </div>

        <Dialog open={isNoInterestDialogOpen} onOpenChange={setIsNoInterestDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-black">
                <UserMinus className="h-5 w-5 text-amber-500" /> Sem Interesse
              </DialogTitle>
              <DialogDescription className="font-medium">Por que o cliente não tem interesse no momento?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={noInterestReason} onValueChange={setNoInterestReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Já possui agência/parceiro">Já possui agência/parceiro</SelectItem>
                  <SelectItem value="Sem orçamento no momento">Sem orçamento no momento</SelectItem>
                  <SelectItem value="Não é o decisor">Não é o decisor</SelectItem>
                  <SelectItem value="Achou o serviço caro">Achou o serviço caro</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNoInterestDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black"
                disabled={!noInterestReason || isSavingOperation}
                onClick={async () => {
                   setIsSavingOperation(true);
                   await updateOperationFn({
                     data: {
                       lead_id: company.id,
                       updates: {
                         followup_status: 'Cliente sem interesse',
                         contact_notes: `Motivo: ${noInterestReason}`,
                         lead_operation_status: 'Sem Interesse'
                       }
                     }
                   });
                   toast.success("Lead marcado como sem interesse.");
                   onOpenChange(false);
                   setIsSavingOperation(false);
                }}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-black">
                <Ban className="h-5 w-5 text-rose-500" /> Descartar Lead
              </DialogTitle>
              <DialogDescription className="font-medium">O lead será removido do funil principal. Qual o motivo?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={discardReason} onValueChange={setDiscardReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Dados incorretos">Dados incorretos</SelectItem>
                  <SelectItem value="Empresa fechada">Empresa fechada</SelectItem>
                  <SelectItem value="Fora do perfil">Fora do perfil</SelectItem>
                  <SelectItem value="Concorrente">Concorrente</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDiscardDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button 
                variant="destructive"
                className="rounded-xl font-black"
                disabled={!discardReason || isSavingOperation}
                onClick={async () => {
                   setIsSavingOperation(true);
                   await updateOperationFn({
                     data: {
                       lead_id: company.id,
                       updates: {
                         is_discarded: true,
                         discard_reason: discardReason,
                         followup_status: 'Lead descartado',
                         lead_operation_status: 'Descartado'
                       }
                     }
                   });
                   toast.success("Lead descartado com sucesso.");
                   onOpenChange(false);
                   setIsSavingOperation(false);
                }}
              >
                Confirmar Descarte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SendToMakeDialog 
          lead={isSendDialogOpen ? (company as unknown as ProspectLead) : null} 
          open={isSendDialogOpen} 
          onOpenChange={setIsSendDialogOpen} 
          onStatusChanged={(newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['lead-presence', company.id] });
            setIsSendDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
