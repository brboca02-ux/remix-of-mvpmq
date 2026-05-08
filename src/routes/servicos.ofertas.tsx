import { createFileRoute } from '@tanstack/react-router';
import OffersCatalogPage from '@/modules/services/OffersCatalogPage';

export const Route = createFileRoute('/servicos/ofertas')({
  component: OffersCatalogPage,
});
