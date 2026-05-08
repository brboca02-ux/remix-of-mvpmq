import { createFileRoute } from '@tanstack/react-router';
import ProspectingPage from '../modules/prospecting/ProspectingPage';

export const Route = createFileRoute('/prospecting')({
  head: () => ({
    meta: [
      { title: "Captação de Empresas — MarketScope AI" },
      { name: "description", content: "Módulo de captação e prospecção de leads para serviços digitais." },
    ],
  }),
  component: ProspectingPage,
});
