import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listJobs } from "@/server/jobs.functions";
import { JobStatusBadge, JobStatus } from "./JobStatusBadge";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronUp, ChevronDown } from "lucide-react";

export function BackgroundJobBanner() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fetchJobs = useServerFn(listJobs);

  const activeJobs = jobs.filter(j => ['queued', 'running'].includes(j.status));

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // Busca jobs independentemente de sessão (modo single-user/dev)
        const [initialJobs, queuedJobs] = await Promise.all([
          fetchJobs({ data: { status: 'running' } }).catch(err => {
            console.warn("Falha ao buscar jobs running:", err);
            return [];
          }),
          fetchJobs({ data: { status: 'queued' } }).catch(err => {
            console.warn("Falha ao buscar jobs queued:", err);
            return [];
          }),
        ]);
        if (cancelled) return;
        
        // Garantia absoluta de que lidamos com arrays
        const runningList = Array.isArray(initialJobs) ? initialJobs : [];
        const queuedList = Array.isArray(queuedJobs) ? queuedJobs : [];
        setJobs([...runningList, ...queuedList]);
      } catch (err) {
        console.error("Erro crítico ao buscar jobs iniciais:", err);
      }
    };

    init();

    const channel = supabase
      .channel('public:jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload: any) => {
          setJobs(prev => {
            const existingIdx = prev.findIndex(j => j.id === payload.new.id);
            if (existingIdx > -1) {
              const newJobs = [...prev];
              newJobs[existingIdx] = payload.new;
              return newJobs;
            }
            return [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (activeJobs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="pointer-events-auto w-80 glass-card p-4 flex flex-col gap-4 shadow-2xl border-primary/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="status-dot bg-primary animate-pulse" />
              Tarefas em segundo plano ({activeJobs.length})
            </h3>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>

          <div className="space-y-3">
            {activeJobs.slice(0, isExpanded ? 5 : 1).map(job => (
              <div key={job.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium truncate max-w-[120px]">
                    {job.tipo.replace(/_/g, ' ')}
                  </span>
                  <JobStatusBadge status={job.status as JobStatus} className="scale-75 origin-right" />
                </div>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {!isExpanded && activeJobs.length > 1 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-[9px] text-center text-muted-foreground hover:text-primary transition-colors"
            >
              + {activeJobs.length - 1} outras tarefas processando
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
