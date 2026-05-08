import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Globe, Mail } from "@/lib/icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight">MarketScope AI</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transformando dados em oportunidades reais. A plataforma definitiva para prospecção B2B inteligente e geração de presença digital.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Plataforma</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Início</Link>
              <Link to="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analisar</Link>
              <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Histórico</Link>
              <Link to="/buscador" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Buscador</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Suporte</h4>
            <nav className="flex flex-col gap-2">
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                Contato
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
                Documentação
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <MapPin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-border/60 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MarketScope AI. Desenvolvido para alta conversão B2B.
          </p>
          <p className="text-xs text-muted-foreground italic">
            Análises geradas por IA com fins informativos.
          </p>
        </div>
      </div>
    </footer>
  );
}
