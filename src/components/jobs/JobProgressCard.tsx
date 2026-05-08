 import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { JobStatusBadge, JobStatus } from "./JobStatusBadge";
import { JobErrorState } from "./JobErrorState";
 import { RetryButton, CancelButton } from "./RetryButton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface JobProgressCardProps {
  job: any;
}

export function JobProgressCard({ job }: JobProgressCardProps) {
  const isFailed = job.status === 'failed' || job.status === 'queued_external';
  const isCancellable = ['queued', 'running', 'queued_external'].includes(job.status);
  
  return (
     <Card className="glass-card overflow-hidden transition-all hover:shadow-lg border-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {job.tipo.replace(/_/g, ' ')}
        </CardTitle>
        <JobStatusBadge status={job.status as JobStatus} />
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4 text-[10px] text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">Iniciado</div>
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
          </div>
          {job.finished_at && (
            <div>
              <div className="font-medium text-foreground">Finalizado</div>
              {formatDistanceToNow(new Date(job.finished_at), { addSuffix: true, locale: ptBR })}
            </div>
          )}
        </div>

         {isFailed && <JobErrorState error={job.error} events={job.job_events} />}

         {(job.status === 'running' || job.status === 'queued') && (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate rounded-full" />
            </div>
          </div>
        )}
      </CardContent>
      {(isFailed || isCancellable) && (
        <CardFooter className="flex justify-end gap-2 bg-muted/20 p-2">
          {isCancellable && (
            <CancelButton jobId={job.id} status={job.status} />
          )}
          {isFailed && (
            <RetryButton jobId={job.id} tipo={job.tipo} />
          )}
        </CardFooter>
      )}
    </Card>
  );
}
