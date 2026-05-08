import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/modelos-de-sites')({
  component: () => <Outlet />,
});
