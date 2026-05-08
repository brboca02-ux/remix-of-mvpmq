import { createFileRoute } from '@tanstack/react-router';
import CombosPackagesPage from '@/modules/services/CombosPackagesPage';

export const Route = createFileRoute('/servicos/combos')({
  component: CombosPackagesPage,
});
