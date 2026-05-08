import { createFileRoute } from '@tanstack/react-router';
import NewServicesPage from '@/modules/services/NewServicesPage';

export const Route = createFileRoute('/servicos/novos')({
  component: NewServicesPage,
});
