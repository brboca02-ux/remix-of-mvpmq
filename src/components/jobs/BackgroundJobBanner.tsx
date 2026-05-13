import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobStatusBadge, JobStatus } from "./JobStatusBadge";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronUp, ChevronDown } from "lucide-react";

 const IS_DEBUG = typeof window !== 'undefined' && 
   ((window as any).LOVABLE_JOBS_DEBUG === "1" || import.meta.env.VITE_LOVABLE_JOBS_DEBUG === "1");
 
 export function BackgroundJobBanner() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch jobs directly from Supabase client (avoids server import protection issue)
  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .in('status', ['queued', 'running', 'queued_external'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        if (IS_DEBUG) console.warn("Falha ao buscar jobs:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      if (IS_DEBUG) console.error("Erro crítico ao buscar jobs:", err);
      return [];
    }
  };

   const activeJobs = Array.isArray(jobs) ? jobs.filter(j => ['queued', 'running', 'queued_external'].includes(j.status)) : [];

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // Busca jobs diretamente do Supabase
        const allJobs = await fetchJobs();
        if (cancelled) return;
        setJobs(allJobs);
       } catch (err) {
         if (IS_DEBUG) console.error("Erro crítico ao buscar jobs iniciais:", err);
         setJobs([]);
       }
    };

    init();

    // Adicionar polling seguro
    const pollInterval = setInterval(() => {
      init();
    }, activeJobs.length > 0 ? 5000 : 15000);

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
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
   }, [activeJobs.length]); // Re-setup interval if active count changes

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
