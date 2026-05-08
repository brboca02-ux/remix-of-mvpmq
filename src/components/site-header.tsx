// SiteHeader foi substituído pela AppSidebar (ver src/components/app-sidebar.tsx).
// Mantido como no-op para preservar compatibilidade com rotas existentes que ainda o importam.
// A navegação principal agora vive no sidebar lateral colapsável renderizado pelo AppShell.
export function SiteHeader() {
  return null;
}
