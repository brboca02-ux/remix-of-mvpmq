import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, X, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getActiveImportJobs } from "@/lib/leads-import.functions";
import { supabaseAdmin as getSupabase } from "@/integrations/supabase/client.server";
import { toast } from "sonner";

export function ActiveJobsBanner() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  const [jobErrors, setJobErrors] = useState<Record<string, any[]>>({});

  const fetchJobs = async () => {
    try {
      const activeJobs = await getActiveImportJobs();
      setJobs(activeJobs);
      
      // Se houver jobs que terminaram com erro parcial, mantemos na lista por um tempo ou até o user fechar
      // Por simplicidade, o server já filtra por pending/processing
    } catch (e) {
      console.error("Erro ao buscar jobs ativos", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchErrors = async (jobId: string) => {
    const supabase = getSupabase;
    const { data } = await supabase
      .from("lead_import_errors")
      .select("*")
      .eq("job_id", jobId)
      .limit(5);
    if (data) setJobErrors(prev => ({ ...prev, [jobId]: data }));
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const visibleJobs = jobs.filter(j => !dismissedJobs.has(j.id));
  if (visibleJobs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
      {visibleJobs.map((job) => {
        const progress = Math.round(((job.processed_rows || 0) / (job.total_rows || 1)) * 100);
        const hasErrors = (job.failed_rows || 0) > 0;
        const isExpanded = expanded === job.id;

        return (
          <div 
            key={job.id} 
            className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-primary/20 bg-card p-4 shadow-2xl animate-in slide-in-from-right-10 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[150px] flex items-center gap-1">
                {job.mode === 'smart' ? '🧠' : '🚀'} {job.filename || "Importação"}
              </span>

              <button 
                onClick={() => setExpanded(isExpanded ? null : job.id)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-primary">{progress}%</span>
                <span className="text-muted-foreground">
                  {job.processed_rows} / {job.total_rows}
                  {job.status === 'processing' && job.eta_seconds > 0 && ` · ~${job.eta_seconds}s`}
                </span>

              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <div className="flex gap-2 mt-1">
              <div className="flex-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 flex items-center justify-center" title="Leads Novos">
                {job.success_rows || 0} OK
              </div>
              <div className="flex-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-600 flex items-center justify-center" title="Leads Reconciliados (Já existiam)">
                {job.duplicate_rows || 0} DUP
              </div>
              <div className="flex-1 rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-600 flex items-center justify-center" title="Falhas">
                {job.failed_rows || 0} Erros
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6 shrink-0" 
                onClick={async () => {
                  try {
                    await fetchJobs();
                    toast.success("Dados atualizados!", { duration: 2000 });
                  } catch {
                    toast.error("Erro ao atualizar");
                  }
                }}
                title="Atualizar Agora"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {isExpanded && hasErrors && (
              <div className="mt-2 pt-2 border-t border-border space-y-2 animate-in fade-in duration-300">
                <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Detalhes dos Erros
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {jobErrors[job.id]?.map((err, i) => (
                    <div key={i} className="text-[9px] bg-muted p-1 rounded border-l-2 border-rose-400 leading-tight">
                      Linha {err.row_number || (err.raw_payload as any)?.line_number || '?'}: {err.error_message}
                    </div>
                  )) || (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] w-full" 
                      onClick={() => fetchErrors(job.id)}
                    >
                      Carregar erros
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-2 flex justify-center">
              <Link 
                to="/agenda/ops" 
                search={{ tab: 'jobs' }}
                className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Ver todos os jobs no Painel Ops
              </Link>
            </div>
            
            {job.status === 'processing' && (
              <p className="text-[9px] text-center text-muted-foreground italic mt-1">
                Sincronizando com o banco em tempo real...
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}