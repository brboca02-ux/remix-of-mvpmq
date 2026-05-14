import { createFileRoute } from '@tanstack/react-router';
import { PipelinePageV2 } from '../modules/prospecting/pipeline-v2';

export const Route = createFileRoute('/prospecting')({
  head: () => ({
    meta: [
      { title: "Pipeline de Vendas — MarketScope AI" },
      { name: "description", content: "Pipeline operacional de prospecção B2B." },
    ],
  }),
  component: PipelinePageV2,
});
