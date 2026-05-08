import React, { useMemo } from 'react';
import { useProspectingStore } from './prospecting-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  DollarSign
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { cn } from "@/lib/utils";

export const PerformanceReport: React.FC = () => {
  const report = useProspectingStore((s) => s.getWeeklyPerformanceReport());
  const forecast = useProspectingStore((s) => s.getRevenueForecast());

  const stats = useMemo(() => [
    {
      label: "Receita Realizada",
      value: `R$ ${(report.dataByDay.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0)).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Receita Prevista (Meta)",
      value: `R$ ${forecast.monthForecast.toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Taxa de Sucesso",
      value: `${report.successRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Gap para Meta",
      value: `R$ ${forecast.gapToGoal.toLocaleString('pt-BR')}`,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      label: "Tempo Médio Resposta",
      value: report.avgResponseTimeHours > 0 ? `${report.avgResponseTimeHours.toFixed(1)}h` : "---",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ], [report, forecast]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-none shadow-md bg-white overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity", s.color)}>
              <s.icon className="h-10 w-10" />
            </div>
            <CardHeader className="pb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-black tabular-nums", s.color)}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Atividade Semanal</CardTitle>
                <CardDescription className="text-sm font-medium">Histórico de tentativas e confirmações (Últimos 7 dias)</CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">
                {report.trend === 'up' ? 'Performance em Alta' : 'Performance Estável'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.dataByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="attempts" name="Tentativas" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="revenue" name="Receita Prevista (R$)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="successes" name="Sucessos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-violet-600 text-white rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-32 w-32" />
          </div>
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black">Performance Operacional</CardTitle>
            <CardDescription className="text-violet-100 font-medium opacity-80">Insights baseados no histórico real</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Execução</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black">{report.successRate.toFixed(0)}%</div>
                <div className="text-sm font-bold opacity-80 leading-tight">Taxa de sucesso e saúde do pipeline</div>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${report.successRate}%` }} />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold leading-relaxed">Pipeline {forecast.pipelineHealth.toUpperCase()}. Meta de R$ 50k acessível.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold leading-relaxed">
                  Tempo médio de resposta: {report.avgResponseTimeHours > 0 ? report.avgResponseTimeHours.toFixed(1) : "N/A"} horas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};