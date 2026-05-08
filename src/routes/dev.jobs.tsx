import { createFileRoute } from "@tanstack/react-router";
import { JobHistoryList } from "@/components/jobs/JobHistoryList";
import { useServerFn } from "@tanstack/react-start";
import { listActiveJobs } from "@/server/jobs.functions";
import { useEffect, useState } from "react";
import { JobProgressCard } from "@/components/jobs/JobProgressCard";
import { Activity, History, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

 const IS_DEBUG = typeof window !== 'undefined' && 
   ((window as any).LOVABLE_JOBS_DEBUG === "1" || import.meta.env.VITE_LOVABLE_JOBS_DEBUG === "1");
 
 export const Route = createFileRoute("/dev/jobs")({
  component: DevJobsPage,
});

function DevJobsPage() {
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const fetchActive = useServerFn(listActiveJobs);

  const loadActive = async () => {
    try {
      const data = await fetchActive();
      setActiveJobs(Array.isArray(data) ? data : []);
     } catch (err) {
       if (IS_DEBUG) console.error(err);
     }
  };

  useEffect(() => {
    loadActive();
    const id = setInterval(loadActive, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Painel DEV: Jobs
        </h1>
        <p className="text-muted-foreground">
          Gerencie e monitore as tarefas de segundo plano em tempo real.
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Activity className="h-4 w-4" />
            Ativos ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Recentes
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Falhos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-0">
          {activeJobs.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
              <p className="text-sm text-muted-foreground">Nenhuma tarefa ativa no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {activeJobs.map((job) => (
                <JobProgressCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 text-left">
          <JobHistoryList />
        </TabsContent>

        <TabsContent value="failed" className="mt-0 text-left">
          {/* listJobs accepts status directly in server function */}
          <JobHistoryList /> 
        </TabsContent>
      </Tabs>
    </div>
  );
}