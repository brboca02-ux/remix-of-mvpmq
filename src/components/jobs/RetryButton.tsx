import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { retryJob } from "@/server/jobs.functions";
import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const NON_IDEMPOTENT_TYPES = ['send_message', 'create_invoice']; // Example types

interface RetryButtonProps {
  jobId: string;
  tipo: string;
  onSuccess?: () => void;
}

export function RetryButton({ jobId, tipo, onSuccess }: RetryButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const retryFn = useServerFn(retryJob);

  const handleRetry = async () => {
    try {
      await retryFn({ data: { jobId } });
      toast.success("Job reiniciado com sucesso.");
      setIsConfirming(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao reiniciar job.");
      console.error(error);
    }
  };

  const isNonIdempotent = NON_IDEMPOTENT_TYPES.includes(tipo);

  if (isNonIdempotent && !isConfirming) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsConfirming(true)}
        className="gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        Repetir (Requer cuidado)
      </Button>
    );
  }

  return (
    <Button 
      variant={isConfirming ? "destructive" : "outline"}
      size="sm" 
      onClick={handleRetry}
      className="gap-2"
    >
      <RefreshCcw className="h-4 w-4" />
      {isConfirming ? "Confirmar repetição?" : "Tentar novamente"}
      {isConfirming && (
        <span 
          className="ml-2 underline text-[10px]" 
          onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
        >
          Cancelar
        </span>
      )}
    </Button>
  );
}
