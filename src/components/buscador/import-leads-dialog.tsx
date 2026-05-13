import { useCallback, useState, useRef, useEffect } from "react";
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle, FileText, LayoutList, ClipboardPaste, X, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { importLeadsCsv, startImportJob, processImportJobChunk, generateJobReport, checkExistingLeads } from "@/lib/leads-import.functions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validateCsvFile, type CsvValidationResult } from "@/lib/csv-validator";
import { cn } from "@/lib/utils";
import { normalizeLead } from "@/lib/leads-shared";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: (inserted: number, jobId?: string) => void;
}

export function ImportLeadsDialog({ open, onOpenChange, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [nicho, setNicho] = useState("solar");
  const [mode, setMode] = useState<"fast" | "smart">("fast");
  const [sampleRate, setSampleRate] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Job Progress State
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [eta, setEta] = useState<number | null>(null);
  const [jobStats, setJobStats] = useState<{ success: number; failed: number; total: number; duplicates: number; errors?: any[] } | null>(null);
  const [previewLeads, setPreviewLeads] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [parserErrors, setParserErrors] = useState<any[]>([]);
  const [existingCount, setExistingCount] = useState<number | null>(null);
  const [validation, setValidation] = useState<Extract<CsvValidationResult, { valid: true }> | null>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPastedText("");
    setPreviewLeads([]);
    setCsvHeaders([]);
    setRowCount(0);
    setJobStats(null);
    setProgress(0);
    setStatusText("");
    setErrorDetails(null);
    setErrorHint(null);
    setParserErrors([]);
    setExistingCount(null);
    setValidation(null);
  }, []);

  const handleFile = useCallback(async (f: File | null) => {
    if (!f) return;
    if (f.size > 20_000_000) {
      setErrorDetails("Arquivo maior que 20MB.");
      setErrorHint("Divida a planilha em partes menores ou compacte os dados.");
      toast.error("Arquivo muito grande");
      return;
    }
    if (!/\.(csv|txt)$/i.test(f.name)) {
      setErrorDetails("Formato de arquivo não suportado.");
      setErrorHint("Use um arquivo .csv ou .txt exportado do Excel/Sheets.");
      toast.error("Formato inválido");
      return;
    }

    setFile(f);
    setJobStats(null);
    setProgress(0);
    setStatusText("");
    setErrorDetails(null);
    setErrorHint(null);
    setValidation(null);
    setExistingCount(null);
    setCsvHeaders([]);
    setPreviewLeads([]);
    setRowCount(0);

    const result = await validateCsvFile(f);

    if (!result.valid) {
      setErrorDetails(result.message);
      setErrorHint(result.hint || null);
      toast.error("CSV inválido", { description: result.message });
      return;
    }

    setValidation(result);
    setCsvHeaders(result.headers);
    setRowCount(result.rowCount);
    setPreviewLeads(
      result.previewRows.map((cols) => {
        const obj: Record<string, string> = {};
        result.headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
        return obj;
      }),
    );
    
    // Comprehensive Duplicate Check
    try {
      const allLeads = result.previewRows.map((cols) => {
        const obj: any = {};
        result.headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
        return normalizeLead({
          nome: obj.nome || obj.razao_social || obj.fantasia || obj.empresa,
          telefone: obj.telefone || obj.tel || obj.whatsapp || obj.celular,
          cnpj: obj.cnpj
        });
      });
      
      const hashes = allLeads.map(l => l.identity_hash).filter((h): h is string => !!h);
      const cnpjs = allLeads.map(l => l.cnpj).filter(c => c && !c.startsWith("TEMP:"));
      const phones = allLeads.map(l => l.telefone).filter((p): p is string => !!p);

      if (hashes.length > 0 || cnpjs.length > 0 || phones.length > 0) {
        // Chunk to avoid too large query parameters
        const chunkSize = 50;
        let totalExisting = 0;
        for (let i = 0; i < Math.max(hashes.length, cnpjs.length, phones.length); i += chunkSize) {
          const chunkHashes = hashes.slice(i, i + chunkSize);
          const chunkCnpjs = cnpjs.slice(i, i + chunkSize);
          const chunkPhones = phones.slice(i, i + chunkSize);
          
          const { existingCount: count } = await checkExistingLeads({ 
            data: { 
              hashes: chunkHashes,
              cnpjs: chunkCnpjs,
              phones: chunkPhones
            } 
          });
          totalExisting += count;
        }
        setExistingCount(totalExisting);
      }
    } catch (e) {
      console.warn("Dedupe check failed", e);
    }

    if (result.warnings.length > 0) {
      toast.warning(`${result.warnings.length} aviso(s) detectado(s)`, {
        description: result.warnings[0],
      });
    } else {
      toast.success(`Arquivo validado: ${result.rowCount} linhas`);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFile],
  );

  const onImport = useCallback(async (isFinal = true) => {
    if (!file && !pastedText) return;
    
    setLoading(true);
    setErrorDetails(null);
    setStatusText("Analisando arquivo...");
    
    try {
      const text = file ? await file.text() : pastedText;
      const result = await importLeadsCsv({ data: { csv: text, nicho } });
      const leads = result.leads;
      
      // Store parser errors for display
      if (result.errors && result.errors.length > 0) {
        setParserErrors(result.errors);
      }

      if (leads.length === 0) {
        const firstError = result.errors?.[0]?.reason || "Nenhum lead válido encontrado no arquivo.";
        throw new Error(firstError);
      }

      setStatusText(`Iniciando importação de ${leads.length} leads...`);
      const { job_id } = await startImportJob({ 
        data: { 
          filename: file?.name || "import_manual.csv", 
          total_rows: leads.length,
          mode,
          sample_rate: 100
        } 
      });

      let currentChunkSize = 200; // Aumentado para otimizar importações de mais de 2k leads
      let totalProcessed = 0;
      
      for (let i = 0; i < leads.length; i += currentChunkSize) {
        const chunk = leads.slice(i, i + currentChunkSize);
        const chunkIndex = Math.floor(i / currentChunkSize);
        
        await processImportJobChunk({ 
          data: { job_id, leads: chunk, chunk_index: chunkIndex } 
        });

        totalProcessed += chunk.length;
        setProgress(Math.round((totalProcessed / leads.length) * 100));
        setStatusText(`Importando: ${totalProcessed}/${leads.length}`);
      }

      const finalReport = await generateJobReport({ data: { job_id } });
      setJobStats(finalReport?.executive_summary as any || { success: leads.length, failed: 0, total: leads.length, duplicates: 0 });
      
      toast.success("Importação concluída com sucesso!");
      onImported?.(leads.length, job_id);

    } catch (e: any) {
      console.error("Import error:", e);
      const errorMsg = e?.message || "Não foi possível ler o arquivo CSV. Verifique o formato e tente novamente.";
      setErrorDetails(errorMsg);
      // Ensure the error is visible to the user even if they are in the "loading" state
      setStatusText(`Erro: ${errorMsg}`);
      toast.error("Falha na importação", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  }, [file, pastedText, nicho, mode, onImported]);

  useEffect(() => {
    if (!open) {
      setTimeout(resetState, 300);
    }
  }, [open, resetState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-6 w-6 text-primary" /> Importar Leads de Busca Local
          </DialogTitle>
          <DialogDescription>
            Envie sua planilha CSV para processar e enriquecer leads automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="file" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileUp className="h-4 w-4" /> Enviar Arquivo CSV
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ClipboardPaste className="h-4 w-4" /> Colar Tabela (Manual)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="mt-4 space-y-4">
                {!loading && !jobStats && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 transition-all duration-300 ${
                      dragOver ? "border-primary bg-primary/5 scale-[0.98] shadow-inner" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className={cn(
                      "rounded-full p-6 transition-all duration-500",
                      dragOver ? "bg-primary/20 scale-110 rotate-3" : "bg-primary/10 group-hover:bg-primary/20"
                    )}>
                      <FileUp className={cn("h-12 w-12 transition-colors", dragOver ? "text-primary" : "text-primary/70")} />
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xl font-bold tracking-tight text-foreground">Selecionar arquivo CSV</p>
                      <p className="text-sm text-muted-foreground">ou arraste e solte o arquivo aqui</p>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="bg-background/50 text-[10px] uppercase font-bold opacity-70">Excel</Badge>
                      <Badge variant="outline" className="bg-background/50 text-[10px] uppercase font-bold opacity-70">Sheets</Badge>
                      <Badge variant="outline" className="bg-background/50 text-[10px] uppercase font-bold opacity-70">CSV</Badge>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        handleFile(e.target.files?.[0] || null);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paste" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground">Conteúdo da Tabela</Label>
                    <Badge variant="outline" className="text-[9px] opacity-70">Suporta CSV e Tabulação</Badge>
                  </div>
                  <textarea
                    className="flex min-h-[200px] w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                    placeholder="Nome, Telefone, Cidade...&#10;Empresa A, 11999999999, São Paulo"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Dica: Você pode copiar uma seleção do Excel/Google Sheets e colar diretamente aqui.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview Section */}
            {file && !loading && !jobStats && (
              <div className="rounded-xl border bg-card p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{file.name}</h4>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {existingCount !== null && existingCount > 0 && (
                   <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                     <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                     <div className="flex-1">
                       <p className="text-xs font-bold text-blue-900 uppercase">Aviso de Duplicados</p>
                       <p className="text-[10px] text-blue-800/80 leading-relaxed">
                         Detectamos que <strong>{existingCount} dos {rowCount}</strong> leads já existem na base. 
                         Eles serão atualizados automaticamente durante a importação.
                       </p>
                     </div>
                   </div>
                )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={resetState}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Linhas Detectadas</p>
                    <p className="text-xl font-black">{rowCount}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Colunas</p>
                    <p className="text-xl font-black">{csvHeaders.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <LayoutList className="h-3 w-3" /> Colunas Identificadas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {csvHeaders.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0 h-5">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>

                {previewLeads.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Prévia dos Dados</p>
                    <div className="space-y-1.5">
                      {previewLeads.map((lead, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground truncate bg-muted/30 px-2 py-1 rounded">
                          {Object.values(lead).filter(Boolean).join(" | ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !jobStats && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Nicho/Segmento</Label>
                  <Input value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex: Solar" />
                </div>
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <div className="flex border rounded-md p-1 h-10">
                    <button 
                      className={`flex-1 rounded-sm text-xs font-medium transition-colors ${mode === 'fast' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      onClick={() => setMode('fast')}
                    >🚀 Rápido</button>
                    <button 
                      className={`flex-1 rounded-sm text-xs font-medium transition-colors ${mode === 'smart' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      onClick={() => setMode('smart')}
                    >🧠 Inteligente</button>
                  </div>
                </div>
              </div>
            )}

            {errorDetails && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm flex gap-3 items-start animate-in zoom-in-95">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold">Arquivo CSV não compatível</p>
                  <p className="text-xs opacity-90 leading-relaxed">{errorDetails}</p>
                  {errorHint && (
                    <p className="text-xs opacity-75 leading-relaxed border-l-2 border-destructive/40 pl-2 mt-2">
                      💡 {errorHint}
                    </p>
                  )}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-destructive font-semibold text-xs"
                    onClick={() => {
                      resetState();
                      fileInputRef.current?.click();
                    }}
                  >
                    Selecionar outro arquivo
                  </Button>
                </div>
              </div>
            )}

            {validation && validation.warnings.length > 0 && !errorDetails && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-700 dark:text-amber-400 text-sm flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-xs uppercase">
                    Avisos de validação ({validation.warnings.length})
                  </p>
                  <ul className="text-xs space-y-1 list-disc list-inside opacity-90">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] opacity-70 mt-2">
                    Encoding: <strong>{validation.encoding}</strong> · Delimitador: <strong>{validation.delimiterLabel}</strong>
                  </p>
                </div>
              </div>
            )}

            {validation && validation.warnings.length === 0 && !errorDetails && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  CSV validado · <strong>{validation.encoding}</strong> · Delimitador: <strong>{validation.delimiterLabel}</strong> · {validation.mappedHeaders.length} colunas mapeadas
                </span>
              </div>
            )}

            {loading && (
              <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-8 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-bold flex items-center gap-3",
                    errorDetails ? "text-destructive" : "text-primary"
                  )}>
                    {errorDetails ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    {statusText}
                  </span>
                  <span className={cn(
                    "text-sm font-black",
                    errorDetails ? "text-destructive" : "text-primary"
                  )}>{progress}%</span>
                </div>
                <Progress value={progress} className={cn("h-3", errorDetails && "bg-destructive/20")} />
                {errorDetails ? (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 mt-4">
                    <p className="text-xs text-destructive font-semibold mb-1">Detalhes do erro:</p>
                    <p className="text-[11px] text-destructive leading-relaxed">{errorDetails}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full h-8 text-[10px] border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        setLoading(false);
                        setErrorDetails(null);
                        setProgress(0);
                      }}
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-center text-muted-foreground italic">
                    Aguarde enquanto processamos os dados. Isso pode levar alguns segundos.
                  </p>
                )}
              </div>
            )}

            {jobStats && (
              <div className="space-y-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 animate-in zoom-in-95">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-emerald-500/20 p-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-emerald-700">Importação Concluída!</h4>
                    <p className="text-sm text-emerald-600/80">O processamento foi finalizado com sucesso.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Salvos", value: jobStats.success, color: "text-emerald-600" },
                    { label: "Duplicados", value: jobStats.duplicates, color: "text-blue-600" },
                    { label: "Erros", value: jobStats.failed, color: "text-rose-600" }
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 bg-background rounded-xl border shadow-sm">
                      <div className="text-[10px] uppercase font-black text-muted-foreground mb-1">{stat.label}</div>
                      <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Parser Errors Rescuing Section */}
                {parserErrors.length > 0 && (
                  <div className="mt-4 space-y-3 bg-white p-4 rounded-xl border border-destructive/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h5 className="text-xs font-black uppercase text-destructive tracking-tight">Falhas Detectadas no Parser ({parserErrors.length})</h5>
                    </div>
                    <ScrollArea className="h-[120px] pr-2">
                      <div className="space-y-2">
                        {parserErrors.slice(0, 50).map((err, idx) => (
                          <div key={idx} className="p-2 rounded bg-destructive/5 border border-destructive/10 text-[10px]">
                            <div className="flex justify-between font-bold text-destructive mb-1">
                              <span>Linha {err.line}</span>
                              <span className="opacity-70">{err.reason}</span>
                            </div>
                            <code className="block truncate opacity-60 font-mono bg-white/50 p-1 rounded">{err.content}</code>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-[10px] h-7 gap-1 border-destructive/20 text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          onOpenChange(false);
                          router.navigate({ to: "/agenda/ops", search: { tab: 'auditoria' } });
                        }}
                      >
                        <ShieldAlert className="h-3 w-3" /> Abrir Painel de Auditoria
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full font-bold h-12" onClick={() => onOpenChange(false)}>
                  Fechar e Ver Leads
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {!jobStats && (
          <div className="flex flex-col gap-3 pt-6 border-t mt-4">
            <Button 
              size="lg"
              className="w-full font-bold h-12 shadow-lg transform transition-all hover:scale-[1.01] active:scale-95" 
              onClick={() => onImport()} 
              disabled={loading || (!file && !pastedText.trim()) || !!errorDetails || (!!file && !validation)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Dados...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-400" /> Confirmar e Importar Leads
                </>
              )}
            </Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
