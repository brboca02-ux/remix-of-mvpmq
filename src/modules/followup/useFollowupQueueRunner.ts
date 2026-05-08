import { useEffect } from 'react';
import { useFollowupStore } from './followup-store';

const POLL_INTERVAL = 30_000; // 30s

/**
 * Mantém a fila de follow-up rodando enquanto o app estiver aberto.
 * Processa tarefas vencidas (D0/D+3/D+7) e atualiza status de entrega.
 */
export function useFollowupQueueRunner() {
  useEffect(() => {
    const run = () => {
      void useFollowupStore.getState().processQueue();
    };
    run();
    const id = setInterval(run, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);
}
