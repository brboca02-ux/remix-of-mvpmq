import { useMemo, useState, useEffect } from "react";
import { X, ChevronDown, Sparkles, LayoutList } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CNAES } from "@/lib/cnae-data";
import type { CompanyFilter, CompanyPorte, RegimeTributario, Tecnografia } from "@/lib/company-types";
import { emptyFilter } from "@/lib/company-types";
import { cn } from "@/lib/utils";

const PORTES: CompanyPorte[] = ["MEI", "Micro", "Pequena", "Média", "Grande"];
const REGIMES: RegimeTributario[] = ["Simples", "Lucro Presumido", "Lucro Real"];
const TECS: Tecnografia[] = ["Shopify", "ERP", "WordPress", "Nenhum"];
const UFS = [
  "SP","RJ","MG","RS","SC","PR","BA","PE","CE","GO","MT","MS","DF","PA","ES","MA","PB","RN","AL","AM","RO","SE","PI","TO","AC",
];

function Collapsible({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

export function SearchSidebar({
  filter,
  onChange,
  onAiInterpret,
  aiLoading,
}: {
  filter: CompanyFilter;
  onChange: (f: CompanyFilter) => void;
  onAiInterpret: (query: string) => void;
  aiLoading: boolean;
}) {
  const [cnaeQuery, setCnaeQuery] = useState("");

  const cnaeMatches = useMemo(() => {
    const q = cnaeQuery.trim().toLowerCase();
    if (!q) return [];
    return CNAES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.code.includes(q),
    ).slice(0, 8);
  }, [cnaeQuery]);

  const toggle = <K extends keyof CompanyFilter>(key: K, value: any) => {
    const arr = filter[key] as unknown as any[];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    onChange({ ...filter, [key]: next });
  };

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto pr-1">
      {filter.jobId && (
        <div className="mb-4 rounded-lg bg-primary/10 p-3 border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-primary flex items-center gap-1.5">
              <LayoutList className="h-3 w-3" /> Filtrando Último Job
            </span>
            <button 
              onClick={() => onChange({ ...filter, jobId: undefined })}
              className="text-primary hover:bg-primary/10 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[11px] text-primary/80 leading-tight">
            Exibindo apenas leads da última importação. Desmarque para ver a base completa.
          </p>
        </div>
      )}

      <div className="pb-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          IA — interpretar busca
        </Label>
        <p className="mt-1 text-[11px] text-muted-foreground">
          A barra de busca global está acima da tabela. Use a IA para converter linguagem natural
          em filtros (ex.: “solar Joinville médio porte”).
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-2 w-full gap-2"
          onClick={() => filter.text.trim() && onAiInterpret(filter.text)}
          disabled={aiLoading || filter.text.trim().length < 3}
          title={filter.text.trim().length < 3 ? "Digite na barra de busca acima da tabela" : ""}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {aiLoading ? "Interpretando..." : "Interpretar busca atual com IA"}
        </Button>
      </div>

      <Collapsible title="Atividade (CNAE)">
        <Input
          value={cnaeQuery}
          onChange={(e) => setCnaeQuery(e.target.value)}
          placeholder="Buscar CNAE..."
          className="h-8 text-sm"
        />
        {cnaeMatches.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-border/60 bg-muted/30 p-1">
            {cnaeMatches.map((c) => {
              const sel = filter.cnaeCodes.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    toggle("cnaeCodes", c.code);
                    setCnaeQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-accent",
                    sel && "bg-primary/10",
                  )}
                >
                  <span className="truncate">
                    <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>{" "}
                    {c.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.sector}</span>
                </button>
              );
            })}
          </div>
        )}
        {filter.cnaeCodes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filter.cnaeCodes.map((code) => {
              const c = CNAES.find((x) => x.code === code);
              return (
                <Badge key={code} variant="secondary" className="gap-1 text-[10px]">
                  {c?.label ?? code}
                  <button type="button" onClick={() => toggle("cnaeCodes", code)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </Collapsible>

      <Collapsible title="Porte da empresa">
        {PORTES.map((p) => (
          <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={filter.portes.includes(p)}
              onCheckedChange={() => toggle("portes", p)}
            />
            <span>{p}</span>
          </label>
        ))}
      </Collapsible>

      <Collapsible title="Localização">
        <div>
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select
            value={filter.estados[0] ?? "all"}
            onValueChange={(v) =>
              onChange({ ...filter, estados: v === "all" ? [] : [v], cidades: [] })
            }
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {UFS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Collapsible>

      <Collapsible title="Qualidade do contato">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={filter.hasEmail}
            onCheckedChange={(v) => onChange({ ...filter, hasEmail: v === true })}
          />
          <span>Com email</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={filter.hasTelefone}
            onCheckedChange={(v) => onChange({ ...filter, hasTelefone: v === true })}
          />
          <span>Com telefone</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={filter.hasSite}
            onCheckedChange={(v) => onChange({ ...filter, hasSite: v === true })}
          />
          <span>Com site</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={filter.onlyAtivas}
            onCheckedChange={(v) => onChange({ ...filter, onlyAtivas: v === true })}
          />
          <span>Apenas ativas</span>
        </label>
      </Collapsible>

      <Collapsible title="Score Digital">
        <div className="flex flex-wrap gap-1.5">
          {([
            { v: "verde", emoji: "🟢", label: "Profissional", cls: "border-success/40 bg-success/10 text-success" },
            { v: "amarelo", emoji: "🟡", label: "Iniciante", cls: "border-warning/40 bg-warning/10 text-warning" },
            { v: "vermelho", emoji: "🔴", label: "Lead Quente", cls: "border-destructive/40 bg-destructive/10 text-destructive" },
          ] as const).map((c) => {
            const active = filter.digitalLevels.includes(c.v);
            return (
              <button
                key={c.v}
                type="button"
                onClick={() => toggle("digitalLevels", c.v)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active ? c.cls : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Score mínimo</span>
            <span className="font-bold text-primary">{filter.digitalScoreMin.toFixed(1)}</span>
          </div>
          <Slider
            value={[filter.digitalScoreMin]}
            onValueChange={(v) => onChange({ ...filter, digitalScoreMin: v[0] })}
            min={0}
            max={10}
            step={0.5}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Regime tributário" defaultOpen={false}>
        {REGIMES.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={filter.regimes.includes(r)}
              onCheckedChange={() => toggle("regimes", r)}
            />
            <span>{r}</span>
          </label>
        ))}
      </Collapsible>

      <Collapsible title="Tecnografia" defaultOpen={false}>
        {TECS.map((t) => (
          <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={filter.tecnografias.includes(t)}
              onCheckedChange={() => toggle("tecnografias", t)}
            />
            <span>{t}</span>
          </label>
        ))}
      </Collapsible>

      <div className="pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange({ ...emptyFilter })}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
