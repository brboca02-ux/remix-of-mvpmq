import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Compass,
  Gauge,
  Layers,
  LineChart,
  Sparkles,
  Target,
  Search,
  LayoutTemplate,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarketScope AI — Descubra o tamanho do seu mercado em segundos" },
      {
        name: "description",
        content:
          "Insira sua ideia e receba TAM, SAM, SOM, score de oportunidade e insights estratégicos gerados por IA. Valide qualquer nicho em menos de 1 minuto.",
      },
      { property: "og:title", content: "MarketScope AI — Análise de mercado por IA" },
      {
        property: "og:description",
        content: "TAM, SAM, SOM, score e insights estratégicos para qualquer nicho.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Showcase />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 md:px-6 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-success" />
            Plataforma Comercial para Agências e Freelancers
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Sua máquina de vendas de{" "}
            <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              sites premium
            </span>
          </h1>
          <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
            Identifique nichos lucrativos, capte leads locais e gere sites prontos com propostas irresistíveis em segundos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/buscador"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl sm:w-auto"
            >
              Começar prospecção
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/analyze"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
            >
              Validar novo nicho
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cadastro · Sem cartão · Resultado em &lt; 30 segundos
          </p>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const stats = [
    { v: "TAM/SAM/SOM", l: "Estimados por IA" },
    { v: "0–100", l: "Score de oportunidade" },
    { v: "5 anos", l: "Projeção de crescimento" },
    { v: "10+", l: "Sub-nichos por análise" },
  ];
  return (
    <section className="border-y border-border/60 bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:px-6">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-bold text-foreground md:text-3xl">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground md:text-sm">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Busque leads reais",
      desc: "Encontre empresas por nicho e cidade usando integração com Google Places e dados de CNPJ.",
    },
    {
      icon: LayoutTemplate,
      title: "Gere sites com um clique",
      desc: "A IA escolhe o melhor template premium e pré-preenche todo o conteúdo para o lead.",
    },
    {
      icon: Target,
      title: "Envie propostas e feche",
      desc: "Gere links de proposta personalizados com simulação de faturamento e pitch matador para WhatsApp.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Como funciona</h2>
        <p className="mt-4 text-lg text-muted-foreground">3 passos. Menos de 1 minuto.</p>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="relative rounded-2xl border border-border bg-card p-8 shadow-sm"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-6 w-6" />
            </div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
              Passo {i + 1}
            </div>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: BarChart3, title: "TAM / SAM / SOM", desc: "Dimensionamento completo do mercado endereçável, alcançável e capturável." },
    { icon: Gauge, title: "Score de Oportunidade", desc: "Nota 0–100 ponderando demanda, concorrência, crescimento e facilidade." },
    { icon: LineChart, title: "Projeção de 5 anos", desc: "Curva de crescimento estimada com base em tendências do setor." },
    { icon: Bot, title: "IA Consultora", desc: "Chat estratégico que responde perguntas sobre o seu mercado." },
    { icon: Compass, title: "Modo Explosão de Nichos", desc: "Descubra 10 sub-nichos ocultos com baixa concorrência." },
    { icon: Layers, title: "Simulador de Receita", desc: "Veja quanto você fatura capturando 0,1%, 1% ou 5% do mercado." },
  ];
  return (
    <section className="bg-card/50 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Tudo que você precisa para validar</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Uma plataforma única, da ideia ao plano de execução.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 p-1 shadow-2xl shadow-primary/20">
        <div className="rounded-[calc(1.5rem-4px)] bg-card p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                Score: 87/100
              </div>
              <h3 className="text-2xl font-bold md:text-3xl">Exemplo: "curso de finanças para jovens"</h3>
              <p className="mt-3 text-muted-foreground">
                Mercado em forte crescimento (+18% a.a.), baixa concorrência em sub-nichos como
                "finanças para universitários" e "investimentos para a Geração Z".
              </p>
              <Link
                to="/analyze"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Testar com a sua ideia <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "TAM", v: "R$ 4.2B", c: "bg-primary/10 text-primary" },
                { l: "SAM", v: "R$ 850M", c: "bg-primary/10 text-primary" },
                { l: "SOM", v: "R$ 42M", c: "bg-success/10 text-success" },
              ].map((m) => (
                <div key={m.l} className={`rounded-xl ${m.c} p-4 text-center`}>
                  <div className="text-xs font-medium opacity-70">{m.l}</div>
                  <div className="mt-1 text-lg font-bold">{m.v}</div>
                </div>
              ))}
              <div className="col-span-3 rounded-xl border border-border bg-background p-4">
                <div className="text-xs font-medium text-muted-foreground">Veredito da IA</div>
                <div className="mt-1 flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Vale a pena — entre por sub-nicho
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Os dados são reais?",
      a: "São estimativas geradas por IA com base em conhecimento de mercado, tendências e benchmarks. Use como ponto de partida para validação, não como dado contábil.",
    },
    {
      q: "Preciso me cadastrar?",
      a: "Não. Nesta versão, suas análises ficam salvas localmente no seu navegador.",
    },
    {
      q: "Quantas análises posso fazer?",
      a: "Quantas quiser. O histórico mantém suas últimas 20 análises localmente.",
    },
    {
      q: "Posso comparar mercados?",
      a: "Sim. No histórico você seleciona até 3 análises e compara TAM, SAM, SOM, score e concorrência lado a lado.",
    },
  ];
  return (
    <section className="bg-card/50 py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-12 space-y-4">
          {items.map((it) => (
            <div key={it.q} className="rounded-xl border border-border bg-background p-6">
              <h3 className="font-semibold">{it.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center md:px-6">
      <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
        Pronto para validar sua próxima ideia?
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Em menos de 1 minuto você sabe se o mercado vale a pena.
      </p>
      <Link
        to="/analyze"
        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl"
      >
        Analisar agora — é grátis <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

 
