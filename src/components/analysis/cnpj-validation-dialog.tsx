import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Copy,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupCnpj, type CnpjDetails, type Socio } from "@/lib/cnpj.functions";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cnpj: string;
  nome: string;
}

export function CnpjValidationDialog({ open, onOpenChange, cnpj, nome }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    lookupCnpj({ data: { cnpj } })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setData(r.data);
        else setError(String(r.error ?? "CNPJ não encontrado"));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Falha ao consultar CNPJ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, cnpj]);

  const ativa = data?.situacao?.toUpperCase().includes("ATIVA");
  const adminPF = data?.socios.filter(
    (s) => s.tipo === "PF" && s.qualificacao.toLowerCase().includes("administrador"),
  ).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Validação CNPJ — {nome}
          </DialogTitle>
          <DialogDescription>
            Consulta ao vivo: OpenCNPJ → BrasilAPI → ReceitaWS. Dados oficiais da Receita Federal.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Consultando Receita Federal…</p>
            <p className="font-mono text-xs">{cnpj}</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium">Não foi possível consultar este CNPJ</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  ativa
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }
              >
                {ativa ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                {data.situacao || "—"}
              </Badge>
              <Badge variant="secondary">Fonte: {data.fonte}</Badge>
              <Badge variant="outline">Porte: {data.porte || "—"}</Badge>
              {adminPF > 0 && (
                <Badge
                  variant="outline"
                  className="border-success/40 bg-success/10 text-success"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {adminPF} Admin PF
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold">{data.razaoSocial || "—"}</h3>
              {data.nomeFantasia && data.nomeFantasia !== data.razaoSocial && (
                <p className="text-sm text-muted-foreground">{data.nomeFantasia}</p>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground">{data.cnpj}</p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock
                icon={<Calendar className="h-4 w-4" />}
                label="Data de abertura"
                value={
                  data.dataAbertura
                    ? new Date(data.dataAbertura).toLocaleDateString("pt-BR")
                    : "—"
                }
              />
              <InfoBlock
                icon={<Briefcase className="h-4 w-4" />}
                label="Capital social"
                value={data.capitalSocial ? formatCurrency(data.capitalSocial) : "—"}
              />
            </div>

            {data.cnaePrincipal?.code && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CNAE Principal
                </div>
                <div className="mt-1 text-sm">
                  <span className="font-mono font-semibold">{data.cnaePrincipal.code}</span>
                  <span className="ml-2">{data.cnaePrincipal.label}</span>
                </div>
              </div>
            )}

            {data.endereco?.logradouro && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Endereço
                </div>
                <p className="mt-1 text-sm">
                  {data.endereco.logradouro}
                  {data.endereco.numero ? `, ${data.endereco.numero}` : ""}
                  {data.endereco.bairro ? ` — ${data.endereco.bairro}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.endereco.cidade}/{data.endereco.uf}
                  {data.endereco.cep ? ` · CEP ${data.endereco.cep}` : ""}
                </p>
              </div>
            )}

            <QsaSection socios={data.socios} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QsaSection({ socios }: { socios: Socio[] }) {
  if (!socios || socios.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
        <Users className="mx-auto mb-1 h-4 w-4" />
        Quadro societário não disponível nesta fonte (provável PJ pura ou dados protegidos).
      </div>
    );
  }

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(
      () => toast.success(`${label} copiado`, { description: val }),
      () => toast.error("Não foi possível copiar"),
    );
  };

  return (
    <Accordion type="single" collapsible defaultValue="qsa">
      <AccordionItem value="qsa" className="border-border">
        <AccordionTrigger className="py-2 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Quadro Societário ({socios.length})
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            {socios.map((s, i) => {
              const isAdminPF =
                s.tipo === "PF" && s.qualificacao.toLowerCase().includes("administrador");
              return (
                <li
                  key={`${s.nome}-${i}`}
                  className={`rounded-md border p-2.5 text-sm ${
                    isAdminPF
                      ? "border-success/40 bg-success/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{s.nome || "—"}</span>
                        {s.tipo && (
                          <Badge variant="outline" className="text-[10px]">
                            {s.tipo}
                          </Badge>
                        )}
                        {isAdminPF && (
                          <Badge
                            variant="outline"
                            className="border-success/40 bg-success/10 text-[10px] text-success"
                          >
                            <ShieldCheck className="mr-0.5 h-2.5 w-2.5" />
                            ADMIN
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.qualificacao || "—"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        {s.cpfCnpj && (
                          <span className="font-mono">{s.cpfCnpj}</span>
                        )}
                        {s.entrada && (
                          <span>
                            Entrada: {new Date(s.entrada).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {s.faixaEtaria && <span>{s.faixaEtaria}</span>}
                      </div>
                    </div>
                    {s.cpfCnpj && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0"
                        onClick={() => copy(s.cpfCnpj!, s.tipo === "PJ" ? "CNPJ" : "CPF")}
                        aria-label="Copiar identificador do sócio"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Dados públicos da Receita Federal. Use com responsabilidade conforme LGPD.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
