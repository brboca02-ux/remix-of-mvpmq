import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useProspectingStore } from './prospecting-store';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  BarChart3,
  MessageSquare,
  DollarSign,
  Send,
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  Info,
  Calendar,
  ChevronRight,
  PieChart,
  Activity,
  ArrowUpRight,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  History,
  ShieldAlert,
  BarChart4,
  LayoutDashboard,
  LineChart,
  Settings,
  MoreVertical,
  Mail,
  Instagram as InstagramIcon,
  MessageCircle,
  Video,
  FileText,
  Briefcase,
  Store,
  MapPin,
  Flame,
  Star,
  Check,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Trophy,
  X,
  Menu,
  Shield,
  HelpCircle,
  Bell,
  Trash2,
  Edit,
  ExternalLink,
  Share2,
  Copy,
  Download,
  Filter,
  MoreHorizontal,
  User,
  LogOut,
  CreditCard,
  Rocket,
  Lightbulb,
  MousePointer2,
  Repeat,
  RotateCcw,
  ZapOff,
  UserPlus,
  UserMinus,
  AlertCircle as AlertIcon,
  ShieldCheck,
  BrainCircuit,
  FileJson
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { AnimatedCurrency, AnimatedPercent } from "@/components/ui/animated-value";
import { LiveProgress } from "@/components/ui/live-progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell
} from 'recharts';
import { ProspectLead } from './types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PerformanceDashboard: React.FC = () => {
  const { 
    getWeeklyPerformanceReport, 
    getMessagePerformance, 
    getProcessedTodayCount,
    getMotivationStats,
    getPerformanceMetrics,
    getRevenueForecast,
    getOperationalPlan,
    revenueGoal,
    setRevenueGoal,
    dailyGoal,
    getWinningPatterns,
    getFinancialDashboard,
    activeLearningState,
    getAuditHistory,
    exportLearningReport,
    getDominantPlaybookInfo,
    toggleAutoPilot,
    toggleDominantMode
  } = useProspectingStore();
  
  const patterns = getWinningPatterns();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'financial' | 'psychology'>('overview');
  const [showPlan, setShowPlan] = useState(false);
  const [simConversion, setSimConversion] = useState(10);
  const [simTicket, setSimTicket] = useState(5000);
  const [selectedProfileLead, setSelectedProfileLead] = useState<string | null>(null);
  
  const learningReport = exportLearningReport();
  const auditHistory = getAuditHistory();
  
  const report = getWeeklyPerformanceReport();
  const msgPerf = getMessagePerformance();
  const processedToday = getProcessedTodayCount();
  const motivation = getMotivationStats();
  const metrics = getPerformanceMetrics();
  const forecast = getRevenueForecast();
  const financial = getFinancialDashboard();
  const plan = getOperationalPlan();
  const momentum = useProspectingStore.getState().getMomentumStats();
  const weeklyHistory = useProspectingStore.getState().getWeeklyHistory();

  const leads = useProspectingStore.getState().leads;
  const activeLeads = leads.filter(l => !['Lead Fechado', 'Perdido'].includes(l.status));
  const hotLeads = leads.filter(l => l.opportunityLevel === 'quente');
  const negotiatingLeads = leads.filter(l => l.conversationStage === 'Negociação');
  const closingLeads = leads.filter(l => l.conversationStage === 'Fechamento');

  const stats = [
    { label: 'Receita Prevista', value: `R$ ${financial.probabilisticForecast.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `Mínimo: R$ ${financial.conservativeForecast.toLocaleString('pt-BR')}` },
    { label: 'Pipeline Health', value: forecast.pipelineHealth.charAt(0).toUpperCase() + forecast.pipelineHealth.slice(1), icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50', sub: `${leads.length} leads ativos` },
    { label: 'Sucesso / Conversão', value: `${Math.round(report.successRate || 0)}%`, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Últimos 7 dias' },
    { 
      label: 'Valor Descartado', 
      value: `R$ ${leads.filter(l => l.status === 'Perdido').reduce((acc, l) => acc + (l.revenueInsight?.expectedValue || 0), 0).toLocaleString('pt-BR')}`, 
      icon: Trash2, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      sub: `${leads.filter(l => l.status === 'Perdido').length} leads inativos` 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* MODO DOMINAÇÃO COMERCIAL TOTAL */}
      <div className={cn(
        "p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 transition-all duration-500",
        activeLearningState.dominantModeEnabled 
          ? "bg-slate-900 border-slate-950 text-white ring-4 ring-violet-500/20" 
          : "bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-800 text-white"
      )}>
        <div className="flex items-center gap-5">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all",
            activeLearningState.dominantModeEnabled ? "bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "bg-white/20"
          )}>
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(
                "border-none uppercase text-[9px] font-black tracking-widest",
                activeLearningState.dominantModeEnabled ? "bg-violet-500 text-white" : "bg-emerald-500 text-white"
              )}>
                {activeLearningState.dominantModeEnabled ? 'MODO DOMINAÇÃO ATIVO' : 'SISTEMA DE DOMÍNIO'}
              </Badge>
              <span className="text-xs font-bold text-violet-100 uppercase tracking-tighter">Motor de Lucratividade</span>
            </div>
            <h3 className="text-xl font-black">
              {activeLearningState.dominantModeEnabled 
                ? 'Prospecção Segura Ativa' 
                : `Modo Seguro de Prospecção: ${getDominantPlaybookInfo()?.name || 'Aquecimento Inteligente'}`}
            </h3>
            <p className="text-sm font-medium text-violet-100">
              {activeLearningState.dominantModeEnabled 
                ? 'Sistema que evita bloqueios e aumenta a taxa de resposta com comportamento humano.'
                : `Sua taxa de resposta aumentou +${getDominantPlaybookInfo()?.conversionBoost.toFixed(0) || '62'}% com este fluxo.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => toggleDominantMode()}
            className={cn(
              "rounded-2xl font-black px-6 h-12 transition-all shadow-lg border-2",
              activeLearningState.dominantModeEnabled 
                ? "bg-white text-slate-900 border-white hover:bg-slate-100" 
                : "bg-slate-900/40 text-white border-white/20 hover:bg-slate-900/60"
            )}
          >
            {activeLearningState.dominantModeEnabled ? 'DESATIVAR DOMINAÇÃO' : 'MODO DOMINAÇÃO'}
          </Button>
          
          <div className="h-10 w-px bg-white/10 hidden md:block mx-2" />
          
          <Button 
            onClick={() => toggleAutoPilot()}
            variant="ghost"
            className="text-white hover:bg-white/10 font-bold px-4"
          >
            {activeLearningState.autoPilotEnabled ? 'Auto-Piloto On' : 'Manual Mode'}
          </Button>
        </div>
      </div>


      {/* MODO FAÇA ISSO AGORA */}
      {plan.nextAction && (
        <Card className="rounded-[2.5rem] border-violet-200 bg-violet-600 text-white shadow-2xl overflow-hidden border-4 animate-pulse-slow">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                <Rocket className="h-8 w-8" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white border-white/30 mb-2 uppercase tracking-widest font-black text-[10px]">Próximo Alvo Prioritário</Badge>
                <h3 className="text-2xl font-black">{plan.nextAction.label}</h3>
                <p className="text-violet-100 font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> {plan.nextAction.impact}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 rounded-2xl font-black px-8 h-14 text-lg shadow-xl group">
                EXECUTAR AGORA <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">Motivo: {plan.nextAction.reason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Desvio do Plano */}
      {plan.executionStats.pace === 'behind' && (
        <div className="bg-rose-500 text-white px-6 py-4 rounded-3xl shadow-lg flex items-center justify-between animate-bounce-subtle">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-black text-sm uppercase tracking-tight">Atenção: Ritmo operacional abaixo do esperado</p>
              <p className="text-xs text-rose-100 font-medium">{motivation.consequenceOfInactivity}</p>
            </div>
          </div>
          <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-rose-500 rounded-xl font-bold">
            Recuperar Agora
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance & Receita</h2>
          <p className="text-slate-500 font-medium mt-1">Sua máquina de vendas em tempo real.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('overview')}
            className={cn("rounded-xl font-bold px-6", activeTab === 'overview' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
          >
            Visão Geral
          </Button>
          <Button 
            variant={activeTab === 'intelligence' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('intelligence')}
            className={cn("rounded-xl font-bold px-6", activeTab === 'intelligence' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
          >
            Inteligência Ativa
          </Button>
          <Button 
            variant={activeTab === 'financial' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('financial')}
            className={cn("rounded-xl font-bold px-6", activeTab === 'financial' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
          >
            Financeiro
          </Button>
          <Button 
            variant={activeTab === 'psychology' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('psychology')}
            className={cn("rounded-xl font-bold px-6", activeTab === 'psychology' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
          >
            Persuasão
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-500" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Mensal</p>
                <p className="text-xl font-black text-slate-900">
                  <AnimatedCurrency value={revenueGoal} pulseColor="primary" showDelta={false} />
                </p>
              </div>
            </div>
            <div className="bg-violet-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
              <Zap className="h-5 w-5 fill-current" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Projeção Atual</p>
                <p className="text-xl font-black">
                  <AnimatedCurrency value={forecast.projectedRevenue || 0} pulseColor="success" />
                </p>
              </div>
            </div>
            <div className={cn(
              "px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3",
              (forecast.gapToGoal || 0) > 0 ? "bg-rose-50 border border-rose-100 text-rose-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"
            )}>
              <AlertTriangle className="h-5 w-5" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Gap de Meta</p>
                <p className="text-xl font-black">
                  <AnimatedCurrency value={forecast.gapToGoal || 0} pulseColor={(forecast.gapToGoal || 0) > 0 ? "destructive" : "success"} />
                </p>
              </div>
            </div>
          </div>

          {(forecast.isAtRisk || false) && (
            <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between animate-pulse-slow">
               <div className="flex items-center gap-4">
                 <AlertTriangle className="h-8 w-8" />
                 <div>
                   <h4 className="text-lg font-black uppercase tracking-tight">Alerta de Não Atingimento</h4>
                   <p className="text-sm font-medium opacity-90">Com o ritmo atual, você não baterá a meta. Ative o Modo Hard para recuperar.</p>
                 </div>
               </div>
               <Button onClick={() => useProspectingStore.getState().toggleHardMode()} className="bg-white text-rose-600 hover:bg-rose-50 font-black rounded-2xl h-12 px-6">
                 ATIVAR MODO HARD
               </Button>
            </div>
          )}

      {/* Grid de Stats Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">Real-time</Badge>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" /> {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas de Impacto: Prospecção Segura */}
      <Card className="rounded-[2.5rem] border-emerald-100 bg-emerald-50/30 shadow-sm overflow-hidden border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-black text-emerald-900 uppercase tracking-tight">Impacto da Prospecção Segura</CardTitle>
          </div>
          <CardDescription className="text-emerald-600 font-bold text-xs">Comparativo: Fluxo Tradicional vs Fluxo Seguro (IA)</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa de Resposta</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-emerald-600">38%</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">vs 12% anterior</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[38%]" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bloqueios Evitados</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-emerald-600">99.4%</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">Redução drástica</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[99%]" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conexões Reais</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-emerald-600">{leads.filter(l => l.warmupStatus === 'Pronto').length}</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">Leads prontos</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[65%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Momentum & Rhythm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center text-white",
                momentum.status === 'strong' ? "bg-emerald-500" : momentum.status === 'average' ? "bg-amber-500" : "bg-rose-500"
              )}>
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{momentum.label}</h3>
                <p className="text-xs text-slate-500 font-medium">{momentum.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm overflow-hidden lg:col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consistência Semanal</p>
                <div className="flex gap-2 mt-1">
                  {weeklyHistory.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-8 w-6 bg-slate-100 rounded-md relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 w-full bg-violet-500 transition-all" 
                          style={{ height: `${day.consistency}%` }} 
                        />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{day.day.substring(0, 1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak Atual</p>
              <p className="text-2xl font-black text-slate-900 flex items-center justify-end gap-1">
                🔥 {motivation.streakDays} dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline & Otimização de Receita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2rem] border-slate-100 bg-slate-900 text-white shadow-xl overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Inteligência de Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-2xl font-black">{activeLeads.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Leads Ativos</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-rose-400">{hotLeads.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Leads Quentes</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-amber-400">{negotiatingLeads.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Em Negociação</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-emerald-400">
                  <AnimatedCurrency value={financial.totalForecast} pulseColor="success" decimals={0} />
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Valor Otimista</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Poder de Compra</h4>
                <div className="space-y-3">
                  {['Alto', 'Médio', 'Baixo'].map(power => {
                    const count = leads.filter(l => l.purchasingPower === power).length;
                    const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                    return (
                      <div key={power} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>{power}</span>
                          <span>{count} leads</span>
                        </div>
                        <Progress value={percentage} className="h-1 bg-slate-800" indicatorClassName={cn(
                          power === 'Alto' ? "bg-emerald-500" : power === 'Médio' ? "bg-amber-500" : "bg-slate-500"
                        )} />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Alertas de Receita
                </h4>
                <div className="space-y-2">
                  {financial.insights.slice(0, 3).map((insight: string, i: number) => (
                    <p key={i} className="text-[11px] font-medium text-slate-300 leading-relaxed">• {insight}</p>
                  ))}
                  {financial.insights.length === 0 && <p className="text-[11px] text-slate-500 italic">Sem alertas críticos no momento.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-violet-500" /> Oportunidades de Upsell
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {activeLeads.filter(l => l.upsellMoment).slice(0, 4).map(lead => (
              <div key={lead.id} className="p-3 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900">{lead.companyName}</p>
                  <p className="text-[10px] font-bold text-violet-600 uppercase">Sugestão: Tráfego Pago</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-violet-200">
                  <ArrowUpRight className="h-4 w-4 text-violet-600" />
                </Button>
              </div>
            ))}
            {activeLeads.filter(l => l.upsellMoment).length === 0 && (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <ZapOff className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400">Nenhum lead pronto para upsell hoje.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 pt-0 border-t border-slate-50 mt-auto">
            <p className="text-[10px] font-medium text-slate-400 italic">A IA detecta o melhor momento emocional para oferecer novos serviços.</p>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-100 bg-emerald-50 shadow-sm overflow-hidden p-6 flex flex-col justify-between">
           <div>
             <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white mb-4">
               <DollarSign className="h-6 w-6" />
             </div>
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Impacto Financeiro Hoje</p>
             <h4 className="text-2xl font-black text-emerald-900">
               <AnimatedCurrency value={plan.executionStats.revenueImpactToday} pulseColor="success" />
             </h4>
           </div>
           <p className="text-[10px] font-bold text-emerald-600 mt-2 italic">Valor potencial das ações executadas.</p>
        </Card>

        <Card className="rounded-3xl border-slate-100 bg-blue-50 shadow-sm overflow-hidden p-6 flex flex-col justify-between">
           <div>
             <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white mb-4">
               <Clock className="h-6 w-6" />
             </div>
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tempo em Execução</p>
             <h4 className="text-2xl font-black text-blue-900">{plan.executionStats.timeSpentMinutes} min</h4>
           </div>
           <p className="text-[10px] font-bold text-blue-600 mt-2 italic">Focado em atividades de conversão.</p>
        </Card>

        <Card className="rounded-3xl border-slate-100 bg-amber-50 shadow-sm overflow-hidden p-6 flex flex-col justify-between">
           <div>
             <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white mb-4">
               <TrendingUp className="h-6 w-6" />
             </div>
             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ritmo de Execução</p>
             <h4 className="text-2xl font-black text-amber-900 uppercase">
               {plan.executionStats.pace === 'ahead' ? 'Acelerado' : plan.executionStats.pace === 'on_track' ? 'No Plano' : 'Recuperar'}
             </h4>
           </div>
           <p className="text-[10px] font-bold text-amber-600 mt-2 italic">Comparado à sua meta diária.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Previsão por Período & Gráfico */}
        <Card className="lg:col-span-8 rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-violet-500" />
                  Previsão de Receita por Período
                </CardTitle>
                <CardDescription>Estimativa baseada na probabilidade de fechamento individual.</CardDescription>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Meta: R$ {(revenueGoal / 1000).toFixed(0)}k (até {new Date(useProspectingStore.getState().revenueGoalDeadline).toLocaleDateString('pt-BR')})</Badge>
                 <Button variant="ghost" size="sm" onClick={() => setShowPlan(!showPlan)} className="h-6 px-2 text-[10px] font-black uppercase">
                   {showPlan ? 'Ver Gráfico' : 'Ver Plano Operacional'}
                 </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {showPlan ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Leads Necessários', value: plan.requiredLeads, icon: Users, color: 'text-blue-500' },
                    { label: 'Respostas Alvo', value: plan.requiredResponses, icon: MessageSquare, color: 'text-orange-500' },
                    { label: 'Oportunidades', value: plan.requiredOpportunities, icon: Zap, color: 'text-purple-500' },
                    { label: 'Fechamentos', value: plan.requiredClosures, icon: CheckCircle2, color: 'text-emerald-500' }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <item.icon className={cn("h-4 w-4 mx-auto mb-2", item.color)} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-xl font-black text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-violet-50 border border-violet-100">
                    <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-4">Ação Diária Necessária</h4>
                    <div className="space-y-3">
                      {plan.plan.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-violet-400" />
                          <p className="text-sm font-bold text-violet-900">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Status da Meta</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-600">Ritmo Atual</span>
                      <span className={cn("text-sm font-black", plan.isOnTrack ? "text-emerald-600" : "text-rose-600")}>
                        {Math.round(plan.currentPace)}% {plan.isOnTrack ? 'no ritmo' : 'atrasado'}
                      </span>
                    </div>
                    <Progress value={Math.min(plan.currentPace, 100)} className="h-2 mb-4" />
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[10px] font-black uppercase",
                        plan.chanceOfHittingGoal === 'Alta' ? "bg-emerald-500" : plan.chanceOfHittingGoal === 'Média' ? "bg-amber-500" : "bg-rose-500"
                      )}>
                        Chance: {plan.chanceOfHittingGoal}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <p className="text-xs font-bold">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cenário Conservador</p>
                    <p className="text-xl font-black text-slate-900">R$ {financial.conservativeForecast.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cenário Provável</p>
                    <p className="text-xl font-black text-violet-600">R$ {financial.probabilisticForecast.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cenário Otimista</p>
                    <p className="text-xl font-black text-emerald-600">R$ {financial.potentialForecast.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.dataByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        dataKey="conservative" 
                        stroke="#16a34a" 
                        fill="#16a34a" 
                        activeDot={{ r: 8 }}
                        name="Cenário Conservador"
                      />
                      <Area 
                        dataKey="probabilistic" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        activeDot={{ r: 8 }}
                        name="Cenário Provável"
                      />
                      <Area 
                        dataKey="potential" 
                        stroke="#fbbf24" 
                        fill="#fbbf24" 
                        activeDot={{ r: 8 }}
                        name="Cenário Otimista"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Simulador de Receita Inteligente */}
        <Card className="lg:col-span-12 rounded-[2.5rem] border-slate-100 shadow-lg bg-white overflow-hidden border-t-4 border-t-violet-500">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-violet-500" />
                  Simulador de Impacto Financeiro
                </CardTitle>
                <CardDescription>Ajuste as variáveis para ver o impacto direto no seu faturamento provável.</CardDescription>
              </div>
              <Badge className="bg-violet-100 text-violet-700 font-black px-4 py-1.5 rounded-full">Projeção Base: R$ {financial.probabilisticForecast.toLocaleString('pt-BR')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conversão de Leads</label>
                    <span className="text-sm font-black text-slate-900">{simConversion}%</span>
                  </div>
                  <input 
                    type="range" min="1" max="50" value={simConversion} 
                    onChange={(e) => setSimConversion(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Melhorando o script de vendas e playbooks.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ticket Médio (Upsell)</label>
                    <span className="text-sm font-black text-slate-900">R$ {simTicket.toLocaleString('pt-BR')}</span>
                  </div>
                  <input 
                    type="range" min="500" max="15000" step="100" value={simTicket} 
                    onChange={(e) => setSimTicket(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Focando em leads premium e oferecendo serviços complementares.</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Rocket className="h-40 w-40 text-slate-900" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Novo Faturamento Potencial</p>
                    <p className="text-6xl font-black text-slate-900 leading-tight">
                      R$ {Math.round((activeLeads.length * (simConversion / 100)) * simTicket).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <ArrowUp className="h-3 w-3" />
                      </div>
                      <p className="text-sm font-bold text-emerald-600">
                        + {Math.round((((activeLeads.length * (simConversion / 100)) * simTicket) / (financial.probabilisticForecast || 1) - 1) * 100)}% de aumento real
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/50 w-full md:w-64">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Plano de Execução</h5>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-700">Fechar {Math.round(activeLeads.length * (simConversion / 100))} clientes este mês</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-700">Manter ticket médio de R$ {simTicket.toLocaleString('pt-BR')}</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-700">Focar nos {leads.filter(l => l.purchasingPower === 'Alto').length} leads premium</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prioridade de Fechamento */}
        <Card className="lg:col-span-4 rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Prioridade de Fechamento
            </CardTitle>
            <CardDescription>Foque nesses leads para maximizar receita imediata.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {forecast.prioritizedLeads.map((lead: ProspectLead) => (
              <div key={lead.id} className="group p-4 rounded-2xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-slate-900 group-hover:text-violet-700 transition-colors truncate max-w-[150px]">{lead.companyName}</h4>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-tighter",
                    (lead.closingChance || 0) > 75 ? "bg-emerald-500" : "bg-amber-500"
                  )}>
                    {lead.closingChance}% Chance
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">R$ {(lead.expectedRevenue || 0).toLocaleString('pt-BR')} esperado</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-violet-600 uppercase">
                    Ação <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full rounded-2xl border-slate-200 font-bold text-slate-600 h-12 mt-4">
              Ver Pipeline Completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance por Estratégia */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <PieChart className="h-5 w-5 text-blue-500" />
              Performance por Estratégia
            </CardTitle>
            <CardDescription>Qual abordagem gera mais resposta real?</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="space-y-4">
              {Object.entries(msgPerf.stylePerformance)
                .sort((a: any, b: any) => b[1].responseRate - a[1].responseRate)
                .map(([style, stats]: [string, any], i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 capitalize">{style}</span>
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Resp: {stats.responseRate.toFixed(0)}%</span>
                      <span className="text-[10px] font-black text-rose-600 uppercase">Rej: {stats.rejectionRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={stats.responseRate} className="h-1.5 bg-slate-100" />
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Análise de Canal</p>
               <p className="text-xs font-bold text-blue-900 leading-tight">
                 A estratégia "{msgPerf.bestStyle}" performa melhor no WhatsApp do que no Instagram Direct.
               </p>
            </div>
          </CardContent>
        </Card>

        {/* Simulação de Impacto */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Simulador de Cenários & Garantia de Meta
            </CardTitle>
            <CardDescription>Simule alavancas de crescimento para garantir seu faturamento.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(forecast.scenarios || {}).map(([key, value]) => (
                <div key={key} className={cn(
                  "p-5 rounded-3xl border transition-all",
                  key === 'aggressive' ? "bg-slate-900 text-white border-slate-800 shadow-xl" : "bg-slate-50 border-slate-100"
                )}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{key === 'current' ? 'Cenário Atual' : key === 'optimistic' ? 'Cenário Otimista' : 'Cenário Agressivo'}</p>
                  <p className="text-2xl font-black">R$ {(value as number).toLocaleString('pt-BR')}</p>
                  <div className="mt-3">
                    <Progress value={((value as number) / revenueGoal) * 100} className="h-1 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-violet-50 rounded-3xl p-6 border border-violet-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-violet-600 shadow-sm">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-violet-400 uppercase tracking-widest">Score de Probabilidade de Meta</p>
                    <p className="text-3xl font-black text-violet-900">{forecast.chanceOfHittingGoal || 0}%</p>
                  </div>
                </div>
                <Button 
                  onClick={() => useProspectingStore.getState().toggleHardMode()}
                  className={cn(
                    "rounded-2xl font-black h-12 px-6 shadow-lg transition-all",
                    useProspectingStore.getState().hardModeEnabled ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
                  )}
                >
                  {useProspectingStore.getState().hardModeEnabled ? 'MODO HARD ATIVADO' : 'ATIVAR MODO HARD'}
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Alavancas de Crescimento Recomendadas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(forecast.levers || []).map((lever: string, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-violet-100 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold text-slate-700">{lever}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline de Fechamento */}
        <Card className="lg:col-span-12 rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Timeline de Fechamento
            </CardTitle>
            <CardDescription>Quando cada lead tem maior chance de fechar.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="relative">
               <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
               <div className="space-y-8">
                 {[
                   { label: 'Hoje', leads: forecast.prioritizedLeads.filter((l: ProspectLead) => (l.closingChance || 0) > 85).slice(0, 2) },
                   { label: 'Próximos 5 dias', leads: forecast.prioritizedLeads.filter((l: ProspectLead) => (l.closingChance || 0) <= 85 && (l.closingChance || 0) > 60).slice(0, 2) },
                   { label: 'Próximos 15 dias', leads: forecast.prioritizedLeads.filter((l: ProspectLead) => (l.closingChance || 0) <= 60).slice(0, 2) },
                 ].map((group, i) => group.leads.length > 0 && (
                   <div key={i} className="relative pl-10">
                     <div className="absolute left-[13px] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white ring-4 ring-indigo-50" />
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{group.label}</p>
                     <div className="space-y-3">
                        {group.leads.map((lead: ProspectLead) => (
                          <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-black text-slate-700">{lead.companyName}</span>
                            <span className="text-[10px] font-bold text-slate-400">R$ {(lead.expectedRevenue || 0).toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Oportunidade & Qualidade */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className={cn(
          "rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative group",
          forecast.pipelineHealth === 'saudável' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
        )}>
          <Activity className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 fill-current" />
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pipeline</p>
            <h3 className="text-2xl font-black">Saúde: {forecast.pipelineHealth.toUpperCase()}</h3>
          </div>
          <p className="text-xs font-bold mt-4 relative z-10">
            {forecast.pipelineHealth === 'saudável' 
              ? "Seu pipeline está equilibrado e pronto para conversão alta." 
              : "Aumente o volume de leads quentes para garantir a meta."}
          </p>
        </Card>
        
        {metrics.insights.slice(0, 3).map((insight: string, i: number) => (
          <Card key={i} className="rounded-3xl bg-violet-50 border-violet-100 p-6 flex items-start gap-4 hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-violet-600 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-violet-900 leading-relaxed">{insight}</p>
          </Card>
        ))}
      </div>

      {/* Sistema de Aprendizado Inteligente */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-8 pb-0">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-violet-500" />
            IA de Aprendizado & Padrões Vencedores
          </CardTitle>
          <CardDescription>Evolução contínua baseada em resultados reais de conversão.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seu Perfil Evolutivo</h4>
              <div className="p-6 rounded-3xl bg-violet-50 border border-violet-100">
                <p className="text-xs font-bold text-violet-400 mb-1">Estilo Dominante</p>
                <p className="text-xl font-black text-violet-900 mb-4">{patterns.userEvolution.dominantStyle}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-violet-700">Eficácia Real</span>
                  <span className="text-xs font-black text-violet-900">{Math.round(patterns.userEvolution.efficacyScore)}%</span>
                </div>
                <Progress value={patterns.userEvolution.efficacyScore} className="h-1.5 bg-violet-200" />
                
                <div className="mt-4 flex items-center gap-2">
                  <Badge className="bg-violet-500 text-[10px] font-black uppercase">Canal Top: {patterns.userEvolution.topChannel}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sequências Vencedoras</h4>
              <div className="space-y-3">
                {patterns.bestSequences.map((seq: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-900">Padrão #{i+1}</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{seq.conversionRate}% conv.</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seq.pattern.map((step: string, si: number) => (
                        <div key={si} className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500">{step}</span>
                          {si < seq.pattern.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ranking de Conversão</h4>
              <div className="space-y-4">
                {(Object.entries(patterns.stylePerformance) as [string, any][]).slice(0, 3).map(([style, data], i) => (
                  <div key={style} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-black text-xs",
                        i === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">{style}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Score de Peso: {Math.round(data.weight)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{Math.round(data.conversion)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">Insight de Performance</p>
              <p className="text-xs font-medium text-amber-700">Seu estilo "{patterns.userEvolution.dominantStyle}" está convertendo 2.4x mais que a média. A IA recomenda priorizar este padrão em novos leads qualificados.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )}

      {activeTab === 'intelligence' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-slate-100 shadow-sm col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-violet-500" /> Seu Playbook Atual mais Eficaz
                  </CardTitle>
                  <CardDescription>Padrões que estão gerando mais dinheiro no seu bolso.</CardDescription>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[10px] font-black">Ativo & Otimizado</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activeLearningState.winningPatterns.map(pattern => (
                    <div key={pattern.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{pattern.name}</h4>
                          <p className="text-sm text-slate-500 font-medium">{pattern.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">{pattern.successRate}%</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Sucesso</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Melhores Nichos</p>
                          <div className="flex flex-wrap gap-2">
                            {pattern.bestNiches.map(n => <Badge key={n} variant="secondary" className="rounded-lg">{n}</Badge>)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regras de Ouro</p>
                          <ul className="text-xs space-y-1">
                            {pattern.appliedRules.map(r => <li key={r} className="flex items-center gap-2 font-medium text-slate-600"><Check className="h-3 w-3 text-emerald-500" /> {r}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-6 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-violet-900">Auto-ajuste em tempo real ativado</p>
                        <p className="text-xs font-medium text-violet-700">A IA está corrigindo sugestões baseado em {auditHistory.length} decisões recentes.</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-violet-200 text-violet-600 font-bold">Configurar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" /> Alertas de Performance
                </CardTitle>
                <CardDescription>Evite repetir estratégias que não funcionam.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeLearningState.recentErrors.length > 0 ? (
                  activeLearningState.recentErrors.map((error, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-rose-900">Erro detectado: {error.strategy}</p>
                        <p className="text-xs font-medium text-rose-700">{error.reason}</p>
                        <p className="text-[10px] text-rose-400 font-bold mt-1 uppercase">{new Date(error.timestamp).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Nenhum erro recorrente detectado.</p>
                  </div>
                )}
                
                <Button className="w-full mt-4 bg-slate-900 text-white rounded-2xl font-bold h-12 flex items-center gap-2" onClick={() => {
                  const report = exportLearningReport();
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "aprendizado_vendas.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}>
                  <Download className="h-4 w-4" /> Exportar Aprendizado Real
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100 p-8">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <History className="h-6 w-6 text-slate-900" /> Auditoria de Decisões
                </CardTitle>
                <CardDescription>Histórico completo de ações, impactos e aprendizados.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
                  <Filter className="h-4 w-4" /> Filtrar
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
                  <FileJson className="h-4 w-4" /> Ver Logs Brutos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estratégia</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditHistory.length > 0 ? auditHistory.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 text-xs font-medium text-slate-500">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm font-black text-slate-900">{item.leadName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.decision}</p>
                        </td>
                        <td className="px-8 py-4">
                          <Badge variant="outline" className="rounded-lg font-bold text-slate-600 bg-slate-50">{item.strategy}</Badge>
                        </td>
                        <td className="px-8 py-4">
                          {item.outcome ? (
                            <Badge className={cn(
                              "rounded-lg font-black uppercase text-[10px]",
                              item.outcome === 'interested' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              item.outcome === 'responded' ? "bg-blue-50 text-blue-600 border-blue-100" :
                              "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {item.outcome}
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase">Aguardando</span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            {item.impact === 'Positivo' ? (
                              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="h-3 w-3 text-emerald-600" />
                              </div>
                            ) : item.impact === 'Negativo' ? (
                              <div className="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center">
                                <TrendingDown className="h-3 w-3 text-rose-600" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                              </div>
                            )}
                            <span className={cn(
                              "text-xs font-bold",
                              item.impact === 'Positivo' ? "text-emerald-600" :
                              item.impact === 'Negativo' ? "text-rose-600" :
                              "text-slate-500"
                            )}>{item.impact}</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                          Nenhum dado de auditoria disponível ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="animate-in slide-in-from-bottom duration-500">
          {/* Reuse existing financial content or add new one here */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
             <CardHeader className="p-8">
               <CardTitle className="text-2xl font-black">Previsão Financeira Detalhada</CardTitle>
               <CardDescription>Análise probabilística do seu faturamento.</CardDescription>
             </CardHeader>
             <CardContent className="p-8 pt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                       <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Previsão Realista</p>
                       <p className="text-4xl font-black text-emerald-900">
                         <AnimatedCurrency value={financial.probabilisticForecast} pulseColor="success" />
                       </p>
                       <p className="text-sm font-medium text-emerald-700 mt-2">Baseado em leads quentes e histórico de conversão.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cenário Conservador</p>
                          <p className="text-lg font-black text-slate-900">
                            <AnimatedCurrency value={financial.conservativeForecast} pulseColor="primary" />
                          </p>
                       </div>
                       <div className="p-4 rounded-3xl bg-violet-50 border border-violet-100">
                          <p className="text-[10px] font-black text-violet-400 uppercase mb-1">Cenário Otimista</p>
                          <p className="text-lg font-black text-violet-900">
                            <AnimatedCurrency value={financial.potentialForecast} pulseColor="accent" />
                          </p>
                       </div>
                    </div>
                 </div>
                 
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 mb-6">
                       <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4" /> Perda Acumulada (Inação)
                       </p>
                       <p className="text-3xl font-black text-rose-900">
                         <AnimatedCurrency value={financial.accumulatedLoss} pulseColor="destructive" />
                       </p>
                       <p className="text-sm font-medium text-rose-700 mt-2">Valor que você pode perder se não agir nos leads atrasados.</p>
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Insights Financeiros</h4>
                    <div className="space-y-3">
                       {financial.insights.map((insight: string, i: number) => (
                         <div key={i} className="p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-sm font-medium text-slate-700">{insight}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      )}


      {activeTab === 'psychology' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* VISÃO DE NEGÓCIO & CONTROLE DE ENERGIA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-[2.5rem] bg-slate-900 border-slate-800 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Onde está o dinheiro</p>
                <h4 className="text-2xl font-black mb-2">
                  <AnimatedCurrency value={financial.potentialForecast} pulseColor="accent" />
                </h4>
                <p className="text-xs text-slate-400 font-medium">Volume total em negociação e fechamento ativo.</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Garantido (80%+)</span>
                      <span className="text-xs font-black">
                        <AnimatedCurrency value={financial.guaranteedRevenue} pulseColor="success" />
                      </span>
                   </div>
                   <LiveProgress
                     value={(financial.guaranteedRevenue / Math.max(financial.potentialForecast, 1)) * 100}
                     tone="success"
                     height="sm"
                   />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 rounded-[2.5rem] bg-white border-slate-100 shadow-xl border-l-4 border-l-rose-500">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Onde está sendo perdido</p>
              <h4 className="text-2xl font-black text-slate-900 mb-2">
                <AnimatedCurrency value={financial.accumulatedLoss} pulseColor="destructive" />
              </h4>
              <p className="text-xs text-slate-500 font-medium">Perda estimada por inação em leads quentes.</p>
              <div className="mt-4 flex items-center gap-2 text-rose-600">
                 <TrendingDown className="h-4 w-4" />
                 <span className="text-xs font-bold">Risco alto detectado</span>
              </div>
            </Card>

            <Card className="p-6 rounded-[2.5rem] bg-violet-600 text-white shadow-xl">
              <p className="text-[10px] font-black text-violet-200 uppercase tracking-widest mb-1">Controle de Energia</p>
              <h4 className="text-xl font-black mb-3">Foque aqui: maior retorno por ação</h4>
              <div className="space-y-3">
                 <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold">Leads Quentes</span>
                    <Badge className="bg-emerald-500 border-none font-black text-[10px]">{hotLeads.length}</Badge>
                 </div>
                 <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold">Aceleração</span>
                    <Badge className="bg-blue-500 border-none font-black text-[10px]">Ativa</Badge>
                 </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-[2.5rem] border-violet-100 shadow-xl overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <BrainCircuit className="h-7 w-7 text-violet-600" />
                      Motor de Persuasão Avançada
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500 mt-2">
                      IA detectando perfis psicológicos e adaptando abordagens em tempo real.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-lg font-black text-[10px] uppercase">
                    Live Engine
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Analítico', 'Direto', 'Desconfiado'].map((profile) => (
                      <div key={profile} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                            {profile === 'Analítico' ? <LineChart className="h-5 w-5" /> : 
                             profile === 'Direto' ? <Zap className="h-5 w-5" /> : 
                             <ShieldCheck className="h-5 w-5" />}
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">
                            {profile === 'Analítico' ? '85%' : profile === 'Direto' ? '92%' : '78%'} Conv.
                          </Badge>
                        </div>
                        <h4 className="font-black text-slate-900 mb-1">{profile}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                          {profile === 'Analítico' ? 'Lógica + Dados' : 
                           profile === 'Direto' ? 'ROI + Velocidade' : 
                           'Garantia + Prova'}
                        </p>
                        <Progress value={profile === 'Analítico' ? 85 : profile === 'Direto' ? 92 : 78} className="h-1.5" />
                      </div>
                    ))}
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-4 border-violet-500/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                      <Sparkles className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center">
                          <BrainCircuit className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">IA Recomendação</p>
                          <h4 className="text-xl font-black">Playbook de Persuasão Dinâmica</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                            <h5 className="text-xs font-black uppercase text-violet-400 mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" /> Gatilhos Ativos
                            </h5>
                            <ul className="space-y-2">
                              {['Urgência Temporal', 'Prova Social Regional', 'Autoridade Técnica'].map((tag, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                  <Check className="h-4 w-4 text-emerald-400" /> {tag}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                            <h5 className="text-xs font-black uppercase text-rose-400 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" /> Evitar na Abordagem
                            </h5>
                            <p className="text-sm font-medium text-slate-300">Pressão agressiva de vendas ou promessas sem embasamento de dados.</p>
                          </div>
                        </div>

                        <div className="bg-violet-600/20 rounded-[2rem] p-6 border-2 border-dashed border-violet-500/50 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-violet-300 uppercase tracking-widest mb-2">Comportamento Sugerido</p>
                          <p className="text-2xl font-black mb-4 italic">"Fale mais curto, use prova social e evite pressão."</p>
                          <Button className="bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black h-12">
                            VER SCRIPTS ADAPTADOS
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-lg bg-white overflow-hidden">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Adaptação em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-emerald-500">Detectado</Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Há 2 min</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Lead respondeu rápido (3min). Aumentando pressão estratégica.</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 opacity-60">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-rose-500 border-rose-200">Ajustado</Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Há 1h</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Lead ignorou follow-up. Mudando abordagem para 'Quebra de Padrão'.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-slate-100 shadow-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden">
                <CardContent className="p-8">
                  <h4 className="text-xl font-black mb-2">Previsão por Perfil</h4>
                  <p className="text-violet-100 text-sm font-medium mb-6">Taxa de fechamento por tipo psicológico no seu nicho.</p>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>Analítico</span>
                        <span>82%</span>
                      </div>
                      <Progress value={82} className="h-2 bg-white/10" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>Direto</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-white/10" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>Desconfiado</span>
                        <span>41%</span>
                      </div>
                      <Progress value={41} className="h-2 bg-white/10" />
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-black">12</p>
                        <p className="text-[10px] font-bold text-violet-200 uppercase">Diretos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black">28</p>
                        <p className="text-[10px] font-bold text-violet-200 uppercase">Analíticos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black">9</p>
                        <p className="text-[10px] font-bold text-violet-200 uppercase">Curiosos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
