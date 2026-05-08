import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'queued_external';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config: Record<JobStatus, { label: string; icon: any; variant: string }> = {
    queued: { 
      label: "Na fila", 
      icon: Clock, 
      variant: "secondary" 
    },
    running: { 
      label: "Processando", 
      icon: Loader2, 
      variant: "default" 
    },
    done: { 
      label: "Concluído", 
      icon: CheckCircle2, 
      variant: "success" // We'll add success variant logic or use className
    },
    failed: { 
      label: "Falhou", 
      icon: XCircle, 
      variant: "destructive" 
    },
    queued_external: { 
      label: "Aguardando externo", 
      icon: ExternalLink, 
      variant: "outline" 
    },
  };

  const { label, icon: Icon, variant } = config[status];

  return (
    <Badge 
      variant={variant as any} 
      className={cn(
        "gap-1.5 flex items-center",
        status === 'done' && "bg-success text-success-foreground border-transparent",
        status === 'running' && "animate-pulse",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", status === 'running' && "animate-spin")} />
      {label}
    </Badge>
  );
}
