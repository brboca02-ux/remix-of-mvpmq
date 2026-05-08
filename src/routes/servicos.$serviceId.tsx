import { createFileRoute } from '@tanstack/react-router';
import ServiceDetailsPage from '@/modules/services/details/ServiceDetailsPage';

export const Route = createFileRoute('/servicos/$serviceId')({
  component: ServiceDetailsPage,
});
