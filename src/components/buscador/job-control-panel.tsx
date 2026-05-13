import { useState, useEffect } from "react";
import { 
  Activity, CheckCircle2, AlertCircle, Clock, 
  BarChart3, ShieldCheck, FileText, ChevronRight,
  TrendingUp, Layers, RefreshCw, XCircle, Search, 
  Copy, FileJson, FileSpreadsheet, Lock, ShieldAlert,
  Settings, HeartPulse, Terminal, Wrench, History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveImportJobs, generateJobReport, recoverStuckJobs } from "@/server/leads-import.functions";
import { toast } from "sonner";
import { AuditLogPanel } from "@/components/ops/AuditLogPanel";

export function JobControlPanel({ isAdmin = true }: { isAdmin?: boolean }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await getActiveImportJobs();
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async (jobId: string) => {
    try {
      await generateJobReport({ data: { job_id: jobId } });
      toast.success("Relatório de inteligência gerado!");
      fetchJobs(); // Atualiza para ver mudanças de status se houver
    } catch (e) {
      toast.error("Erro ao gerar relatório");
    }
  };

  const handleRecoverJobs = async () => {
    try {
      setLoading(true);
      await recoverStuckJobs();
      await recoverStuckJobs();
      toast.success("Jobs travados foram resetados.");
      fetchJobs();
    } catch (e) {
      toast.error("Falha ao recuperar jobs");
    } finally {
      setLoading(false);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel de Operações</h2>
          <p className="text-sm text-muted-foreground">Monitoramento e auditoria em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecoverJobs} title="Libera jobs presos em 'processing' por muito tempo">
            <Activity className="mr-2 h-4 w-4" /> Recuperar Travados
          </Button>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="jobs" className="gap-2">
            <Layers className="h-4 w-4" /> Jobs de Importação
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" /> Auditoria de Estado (Diff)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          {jobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Layers className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">Nenhum job ativo ou recente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onReport={() => handleGenerateReport(job.id)} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobCard({ job, onReport }: { job: any; onReport: () => void }) {
  const progress = Math.round(((job.processed_rows || 0) / (job.total_rows || 1)) * 100);
  const isFinished = job.status === "completed" || job.status === "partial";
  
  return (
    <Card className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge 
                variant={job.status === "completed" ? "secondary" : job.status === "failed" ? "destructive" : "default"} 
                className="font-mono text-[10px] uppercase"
              >
                {job.status}
              </Badge>
              <span className="truncate max-w-[200px]">{job.filename}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              ID: {job.id.slice(0, 8)} • {new Date(job.created_at).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {isFinished && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onReport} title="Gerar Relatório Inteligente">
                <FileText className="h-4 w-4 text-primary" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> Progresso
            </span>
            <span>{progress}% ({job.processed_rows || 0}/{job.total_rows || 0})</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-500/5 p-2 border border-emerald-500/10">
            <div className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Sucesso</div>
            <div className="text-lg font-bold text-emerald-700">{job.success_rows || 0}</div>
          </div>
          <div className="rounded-lg bg-blue-500/5 p-2 border border-blue-500/10">
            <div className="text-[10px] uppercase text-blue-600 font-bold mb-1">Duplicados</div>
            <div className="text-lg font-bold text-blue-700">{job.duplicate_rows || 0}</div>
          </div>
          <div className="rounded-lg bg-rose-500/5 p-2 border border-rose-500/10">
            <div className="text-[10px] uppercase text-rose-600 font-bold mb-1">Falhas</div>
            <div className="text-lg font-bold text-rose-700">{job.failed_rows || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {job.confidence_score !== undefined && (
            <div className="flex items-center justify-between rounded-md bg-primary/5 p-2 border border-primary/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase">Confiança</span>
              </div>
              <span className="text-xs font-bold text-primary">{Math.round(job.confidence_score)}%</span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md bg-amber-500/5 p-2 border border-amber-500/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-600 uppercase">Conflitos</span>
            </div>
            <span className="text-xs font-bold text-amber-600">Auditável</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

