import { createFileRoute } from '@tanstack/react-router';
import CRMPage from '../modules/crm/CRMPage';

export const Route = createFileRoute('/crm')({
  head: () => ({
    meta: [
      { title: "Gestão CRM — MarketScope AI" },
      { name: "description", content: "Gerencie seus leads e acompanhe interações em tempo real." },
    ],
  }),
  component: CRMPage,
});
