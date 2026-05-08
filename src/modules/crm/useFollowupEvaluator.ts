import { useEffect } from 'react';
import { useProspectingStore } from '../prospecting/prospecting-store';
import { loadRules, loadTasks, evaluateRules, saveTasks } from './followup-rules';
import { toast } from 'sonner';

export function useFollowupEvaluator() {
  const { leads, moveLead } = useProspectingStore();

  useEffect(() => {
    const runEvaluation = () => {
      const rules = loadRules();
      const existingTasks = loadTasks();
      
      const { tasks: nextTasks, newCount, statusMoves } = evaluateRules(
        leads, 
        rules, 
        existingTasks
      );

      if (newCount > 0) {
        saveTasks(nextTasks);
        toast.info(`${newCount} novas tarefas de follow-up geradas`, {
          description: 'Verifique a aba Follow-up Automático.',
        });
      }

      statusMoves.forEach(({ leadId, to }) => {
        moveLead(leadId, to, 'system');
      });
    };

    // Executa imediatamente e depois a cada 60s
    runEvaluation();
    const interval = setInterval(runEvaluation, 60000);
    
    return () => clearInterval(interval);
  }, [leads, moveLead]);
}
