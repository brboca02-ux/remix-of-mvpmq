import { createFileRoute } from '@tanstack/react-router';
import AIServicesPage from '@/modules/services/AIServicesPage';

export const Route = createFileRoute('/servicos/ia')({
  component: AIServicesPage,
});
