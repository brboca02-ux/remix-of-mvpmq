import { createFileRoute } from '@tanstack/react-router';
import SingleServicesPage from '@/modules/services/SingleServicesPage';

export const Route = createFileRoute('/servicos/avulsos')({
  component: SingleServicesPage,
});
