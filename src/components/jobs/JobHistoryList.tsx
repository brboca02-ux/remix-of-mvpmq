import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listJobs } from "@/server/jobs.functions";
import { JobProgressCard } from "./JobProgressCard";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox } from "lucide-react";

export function JobHistoryList({ tipo }: { tipo?: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchJobs = useServerFn(listJobs);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJobs({ data: { tipo, limit: 10 } });
      setJobs(data);
    } catch (err) {
      console.error("Erro ao listar histórico:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [tipo]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Nenhum registro encontrado</p>
          <p className="text-xs text-muted-foreground">As tarefas aparecerão aqui conforme forem executadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map(job => (
        <JobProgressCard key={job.id} job={job} />
      ))}
    </div>
  );
}
