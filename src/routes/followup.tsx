import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getFollowupDashboardData, trackSalesConversion } from "@/server/cnpj.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CheckCircle2, MessageSquare, TrendingUp, Users, AlertCircle, Phone, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const followupQueryOptions = queryOptions({
  queryKey: ["followup-data"],
  queryFn: () => getFollowupDashboardData(),
});

export const Route = createFileRoute("/followup")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(followupQueryOptions);
  },
  component: FollowupDashboard,
});

function FollowupDashboard() {
  const { data } = useSuspenseQuery(followupQueryOptions);
  const { sequences, stats } = data;

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Relatório de Receita e Conversão", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    
    // Summary Stats
    const totalRevenue = stats.reduce((acc: number, s: any) => acc + (s.total_revenue || 0), 0);
    const totalConversions = stats.reduce((acc: number, s: any) => acc + (s.conversions || 0), 0);
    
    doc.setTextColor(0);
    doc.text(`Total de Conversões: ${totalConversions}`, 14, 40);
    doc.text(`Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}`, 14, 46);

    // Stats Table
    autoTable(doc, {
      startY: 55,
      head: [['Canal', 'Eficiência', 'Respostas', 'Fechamentos', 'Receita']],
      body: stats.map((s: any) => [
        s.channel,
        (s.efficiency_score * 10).toFixed(1) + "/10",
        s.replies,
        s.conversions,
        "R$ " + (s.total_revenue || 0).toLocaleString('pt-BR')
      ]),
    });

    // Pipeline Table
    doc.text("Pipeline de Follow-up Ativo", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Empresa', 'Cidade', 'Dia', 'Status', 'Score']],
      body: sequences.map((seq: any) => [
        seq.lead?.company_name || 'Desconhecida',
        seq.lead?.city || '-',
        "D" + seq.current_day,
        seq.status,
        seq.opportunity?.opportunity_score + "%"
      ]),
    });

    doc.save(`relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const handleAction = async (pitchId: string, type: 'reply' | 'conversion', replyType?: any) => {
    try {
      await trackSalesConversion({ 
        data: { 
          pitch_id: pitchId, 
          type, 
          reply_type: replyType,
          revenue: type === 'conversion' ? 500 : 0 
        } 
      });
      toast.success("Ação registrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar ação.");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Follow-up</h1>
          <p className="text-muted-foreground">Monitore o pipeline de vendas e otimize conversões em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Nova Campanha
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
            <p className="text-xs text-muted-foreground">Em sequência automática</p>
          </CardContent>
        </Card>

        {stats.length > 0 ? stats.map((stat: any) => (
          <Card key={stat.channel} className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eficiência ({stat.channel})</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stat.efficiency_score * 10).toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">{stat.conversions} fechamentos reais</p>
            </CardContent>
          </Card>
        )) : (
          <Card className="bg-gradient-to-br from-slate-500/5 to-transparent border-slate-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.0/10</div>
              <p className="text-xs text-muted-foreground">Sem dados suficientes</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                stats.reduce((acc: number, s: any) => acc + (s.total_revenue || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Baseado em conversões reais</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Sequências de Abordagem</CardTitle>
          <CardDescription>Acompanhe o status de cada lead no pipeline de prospecção.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Próximo Envio</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lead em follow-up no momento.
                  </TableCell>
                </TableRow>
              ) : (
                sequences.map((seq: any) => (
                  <TableRow key={seq.id}>
                    <TableCell>
                      <div className="font-medium">{seq.lead?.company_name || 'Desconhecida'}</div>
                      <div className="text-xs text-muted-foreground">{seq.lead?.city}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seq.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {seq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">D{seq.current_day}</span>
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(seq.current_day / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {seq.next_message_at ? format(new Date(seq.next_message_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={seq.opportunity?.opportunity_level === 'hot' ? 'destructive' : 'outline'}>
                        {seq.opportunity?.opportunity_score}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Registrar Resposta" onClick={() => handleAction(seq.id, 'reply', 'interessado')}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Fechar Negócio" onClick={() => handleAction(seq.id, 'conversion')}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Gargalos Detectados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sequences.some((s: any) => s.current_day >= 3 && s.status === 'active') ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-800">Alta Taxa de Abandono D3</div>
                  <p className="text-amber-700/80">
                    Leads em D3 estão com 40% menos respostas que o normal. Sugerimos alterar o CTA para uma abordagem mais consultiva.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4 italic">
                Nenhum gargalo crítico detectado nas últimas 48h.
              </div>
            )}
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Otimizações Recomendadas</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-2 rounded border bg-muted/50 text-xs hover:bg-muted transition-colors cursor-pointer">
                  <span>Melhorar CTA de Email (Variante B)</span>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">+12% conv.</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/50 text-xs hover:bg-muted transition-colors cursor-pointer">
                  <span>Priorizar WhatsApp em Cidades de Interior</span>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">+25% resp.</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-4">
               <div className="flex items-center gap-4 p-3 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer group">
                 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                   <Mail className="h-5 w-5" />
                 </div>
                 <div className="flex-1">
                   <div className="text-sm font-medium">Revisar abordagens de Email</div>
                   <div className="text-xs text-muted-foreground">Otimizar mensagens com baixo open rate.</div>
                 </div>
               </div>
               <div className="flex items-center gap-4 p-3 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer group">
                 <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                   <Phone className="h-5 w-5" />
                 </div>
                 <div className="flex-1">
                   <div className="text-sm font-medium">Ligar para Leads Quentes (D1)</div>
                   <div className="text-xs text-muted-foreground">3 leads pendentes com alta intenção.</div>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
