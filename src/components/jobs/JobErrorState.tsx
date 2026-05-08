import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface JobErrorStateProps {
  error?: string;
  events?: any[];
}

export function JobErrorState({ error, events = [] }: JobErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getFriendlyMessage = (rawError?: string) => {
    if (!rawError) return "Ocorreu um erro inesperado.";
    const err = rawError.toLowerCase();
    if (err.includes("timeout")) return "A integração demorou demais para responder.";
    if (err.includes("quota") || err.includes("limit")) return "Limite de uso atingido.";
    if (err.includes("unavailable") || err.includes("fetch")) return "Serviço externo indisponível.";
    return rawError;
  };

  const errorEvents = events.filter(e => e.level === 'error').slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="text-sm font-medium">
          {getFriendlyMessage(error)}
        </div>
      </div>

      {(error || errorEvents.length > 0) && (
        <div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
          </button>
          
          {showDetails && (
            <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border font-mono text-[10px] overflow-auto max-h-40">
              {error && <div className="mb-2 pb-2 border-b border-border/50 text-foreground">{error}</div>}
              <div className="space-y-1">
                {errorEvents.map((e, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-muted-foreground">[{new Date(e.created_at).toLocaleTimeString()}]</span>
                    <span>{e.message}</span>
                  </div>
                ))}
                {errorEvents.length === 0 && <div className="text-muted-foreground italic">Nenhum log de erro detalhado.</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
