 import { Button } from "@/components/ui/button";
 import { useServerFn } from "@tanstack/react-start";
 import { retryJob, cancelJob } from "@/lib/jobs.functions";
 import { useState } from "react";
 import { RefreshCcw, XCircle } from "lucide-react";
 import { toast } from "sonner";
 export function CancelButton({ jobId, status, onSuccess }: { jobId: string; status: string; onSuccess?: () => void }) {
   const [isConfirming, setIsConfirming] = useState(false);
   const cancelFn = useServerFn(cancelJob);
 
   const handleCancel = async () => {
     try {
       await cancelFn({ data: { jobId } });
       toast.success("Cancelamento solicitado.");
       setIsConfirming(false);
       onSuccess?.();
     } catch (error) {
       toast.error("Erro ao cancelar job.");
       console.error(error);
     }
   };
 
   const isRunning = status === 'running';
 
   return (
     <Button 
       variant={isConfirming ? "destructive" : "ghost"}
       size="sm" 
       onClick={() => {
         if (!isConfirming) {
           setIsConfirming(true);
         } else {
           handleCancel();
         }
       }}
       className="gap-2 text-xs h-8"
     >
       <XCircle className="h-4 w-4" />
       {isConfirming ? "Confirmar cancelamento?" : "Cancelar"}
       {isConfirming && isRunning && (
         <div className="absolute top-full left-0 w-64 p-2 mt-2 bg-popover text-popover-foreground text-[9px] rounded-md shadow-lg border border-border z-50">
           A execução externa pode já estar em andamento. O app vai ignorar o resultado se ele retornar depois.
         </div>
       )}
     </Button>
   );
 }

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
