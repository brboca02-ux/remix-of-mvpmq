import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, useRouterState, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { navigationService } from "@/lib/navigation-service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { IconSecurityMonitor } from "@/lib/icons";
 import { AppShell } from "@/components/app-shell";
 import { BackgroundJobBanner } from "@/components/jobs/BackgroundJobBanner";
import { logger } from "@/lib/logger";


interface RouterContext {
  queryClient: QueryClient;
}

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const location = useRouterState({ select: (s) => s.location });
  
  useEffect(() => {
    logger.warn("Page not found", { pathname: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe: <code className="bg-muted px-1 rounded">{location.pathname}</code>
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MarketScope AI — Análise de mercado por IA" },
      {
        name: "description",
        content:
          "Descubra TAM, SAM, SOM, score de oportunidade e insights estratégicos para qualquer nicho — em segundos.",
      },
      { name: "author", content: "MarketScope AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "MarketScope AI — Análise de mercado por IA" },
      { name: "twitter:title", content: "MarketScope AI — Análise de mercado por IA" },
      { name: "description", content: "MarketScope AI helps users discover, validate, and size market opportunities for any niche." },
      { property: "og:description", content: "MarketScope AI helps users discover, validate, and size market opportunities for any niche." },
      { name: "twitter:description", content: "MarketScope AI helps users discover, validate, and size market opportunities for any niche." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6e1d14c6-0f57-47cd-8e86-21a2b5164b9a/id-preview-35261e0c--95d5826f-7436-452c-aab7-3802e2fcb180.lovable.app-1776450986615.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6e1d14c6-0f57-47cd-8e86-21a2b5164b9a/id-preview-35261e0c--95d5826f-7436-452c-aab7-3802e2fcb180.lovable.app-1776450986615.png" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <IconSecurityMonitor />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const state = useRouterState();
  const pathname = state.location.pathname;
  const isPublicProposal = pathname.startsWith('/proposta-site/');
  const isTemplatePreview = /^\/modelos-de-sites\/[^/]+$/.test(pathname);

  useEffect(() => {
    navigationService.trackVisit(pathname, {
      search: state.location.search,
      hash: state.location.hash
    });
  }, [pathname, state.location.search, state.location.hash]);

  const noShellRoutes = ["/login"];
  const useShell = !noShellRoutes.some((p) => pathname === p || pathname.startsWith(p + "/")) && !isPublicProposal && !isTemplatePreview;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
         {useShell ? (
           <AppShell hideFooter>
             <Outlet />
           </AppShell>
         ) : (
           <>
             <Outlet />
           </>
         )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
