import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Home,
  Search,
  Database,
  History,
  Target,
  Briefcase,
  TrendingUp,
  LayoutTemplate,
  LogOut,
  ChevronDown,
  ChevronRight,
  Package,
  Zap,
  ShoppingBag,
  Layers,
  Sparkles,
  Bot,
  Lightbulb,
  Monitor,
  UserCircle,
  Video,
  Store,
  GraduationCap,
  Bitcoin,
  Languages,
  Activity,
  Layout,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  children?: { to: string; label: string; image?: string }[];
};

const COMMERCIAL_ITEMS: NavItem[] = [
  { to: "/buscador", label: "Buscador de Leads", icon: Search },
  { to: "/crm", label: "Gestão CRM", icon: Database },
  { to: "/prospecting", label: "Pipeline de Vendas", icon: Target },
  { 
    to: "/modelos-de-sites", 
    label: "Biblioteca de Modelos", 
    icon: LayoutTemplate,
    children: [
      { 
        to: "/modelos-de-sites/automotive-premium", 
        label: "Estética Automotiva",
        image: "https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/1e3da6c5-8ccb-4578-870a-296f8464a6a6/1777336376909_enfw5j_image.png"
      }
    ]
  },
  { to: "/followup", label: "Acompanhamento", icon: TrendingUp },
  { to: "/followups", label: "Follow-ups Automáticos", icon: Activity },
  { to: "/ia-vendas", label: "IA Adaptativa", icon: Sparkles, badge: "Premium" },
];


const SERVICES_ITEMS: NavItem[] = [
  { to: "/servicos/documentacao", label: "Documentação de Entregas", icon: FileText, badge: "Novo" },
  { to: "/servicos/avulsos", label: "Serviços Avulsos", icon: Package },
  { to: "/servicos/ia", label: "Microserviços IA", icon: Zap },
  { to: "/servicos/ofertas", label: "Catálogo de Ofertas", icon: ShoppingBag },
  { to: "/servicos/combos", label: "Pacotes & Combos", icon: Layers },
];

const NEW_SERVICES_NAV_ITEMS: NavItem[] = [
  { to: "/servicos/novos", label: "Ver Todos", icon: Sparkles, badge: "Novo" },
  { to: "/servicos/novos", label: "AI Sales Assistant", icon: Bot },
  { to: "/servicos/novos", label: "Monetização Digital", icon: TrendingUp },
  { to: "/servicos/novos", label: "Gestão de Inovação", icon: Activity },
  { to: "/servicos/novos", label: "Modelos IA", icon: Lightbulb },
  { to: "/servicos/novos", label: "Web Personalizado", icon: Layout },
  { to: "/servicos/novos", label: "Experiências VR", icon: Monitor },
  { to: "/servicos/novos", label: "Marketing Assistant", icon: UserCircle },
  { to: "/servicos/novos", label: "Produção Vídeo IA", icon: Video },
  { to: "/servicos/novos", label: "Transf. Digital Local", icon: Store },
  { to: "/servicos/novos", label: "Micro Cursos", icon: GraduationCap },
  { to: "/servicos/novos", label: "Economia Digital", icon: Bitcoin },
  { to: "/servicos/novos", label: "Tradução com IA", icon: Languages },
];

const ANALYSIS_ITEMS: NavItem[] = [
  { to: "/analyze", label: "Validar Ideia", icon: BarChart3 },
  { to: "/history", label: "Histórico e Nichos", icon: History },
  { to: "/", label: "Home Comercial", icon: Home, exact: true },
   { to: "/ajustes/integracoes", label: "Integrações", icon: Zap },
   { to: "/dev/jobs", label: "DEV Jobs", icon: Activity },
   { to: "/agenda/ops", label: "Configurações", icon: Briefcase },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren && !collapsed) {
              return (
                <Collapsible key={item.to} defaultOpen={active} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label} isActive={active} className="hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <div className="flex items-center gap-2 flex-1">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === item.to}>
                            <Link to={item.to}>Ver Todos</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {item.children?.map((child) => (
                          <SidebarMenuSubItem key={child.to}>
                            <SidebarMenuSubButton asChild isActive={pathname === child.to}>
                              <Link to={child.to} className="flex items-center gap-2">
                                {child.image && (
                                  <img 
                                    src={child.image} 
                                    className="w-5 h-5 rounded object-cover border border-white/10" 
                                    alt={child.label} 
                                  />
                                )}
                                <span className="truncate">{child.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="hover:bg-primary/10 hover:text-primary transition-all duration-300">
                  <Link
                    to={item.to as string}
                    className={cn(
                      "flex items-center gap-2 w-full",
                      active ? "text-primary font-medium" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && !collapsed && (
                      <Badge variant="outline" className="ml-auto px-1.5 h-4 text-[9px] font-bold bg-primary/5 text-primary border-primary/20">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-black">
      <SidebarHeader className="bg-black border-b border-white/5">
        <Link to="/" className="flex items-center gap-3 px-3 py-6 group">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
            <Bot className="h-6 w-6" />
          </span>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white">MID <span className="text-primary">IA</span></span>
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Premium Enterprise</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Comercial" items={COMMERCIAL_ITEMS} />
        <NavGroup label="Serviços & Produtos" items={SERVICES_ITEMS} />
        <NavGroup label="Novos Serviços e Produtos" items={NEW_SERVICES_NAV_ITEMS} />
        <NavGroup label="Estratégia & Análise" items={ANALYSIS_ITEMS} />
      </SidebarContent>

      <SidebarFooter>
       <div
         className={cn(
           "flex items-center gap-2 rounded-md p-2",
           collapsed ? "justify-center" : "justify-between",
         )}
       >
         {!collapsed && (
           <div className="flex flex-col min-w-0">
             <span className="truncate text-xs font-semibold text-foreground">
               Modo Desenvolvedor
             </span>
             <span className="text-[10px] text-muted-foreground">Single User</span>
           </div>
         )}
         <Badge variant="outline" className="h-5 text-[9px] bg-primary/5 border-primary/20">
           DEV
         </Badge>
       </div>
      </SidebarFooter>
    </Sidebar>
  );
}
