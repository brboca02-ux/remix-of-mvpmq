import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  children: ReactNode;
  /** Quando true, omite o SiteFooter (útil para páginas que já trazem rodapé próprio). */
  hideFooter?: boolean;
}

export function AppShell({ children, hideFooter = false }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/5 bg-black/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40">
            <SidebarTrigger className="hover:bg-white/5 rounded-full transition-colors" />
            <div className="h-4 w-px bg-white/10" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hidden sm:block">Painel de Controle <span className="text-white/20">/</span> Orquestração de Receita</span>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-success px-3">Sistema Online</Badge>
              </div>
            </div>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
          {!hideFooter && <SiteFooter />}
        </div>
      </div>
    </SidebarProvider>
  );
}
