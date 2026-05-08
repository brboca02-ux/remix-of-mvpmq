import { createFileRoute } from '@tanstack/react-router';
import DeliveryDocumentationPage from '../modules/services/DeliveryDocumentationPage';

export const Route = createFileRoute('/servicos/documentacao')({
  component: DeliveryDocumentationPage,
});
