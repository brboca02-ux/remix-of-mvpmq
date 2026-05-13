import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUserSalesProfile, 
  updateUserSalesProfile, 
  getWinnerMessages, 
  analyzeUserStyle 
} from "@/lib/ai-learning.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, Brain, Target, MessageSquare, TrendingUp, Zap, 
  History, Settings2, Shield, Trash2, PauseCircle, PlayCircle,
  CheckCircle2, Star, MessageCircle, Send, Copy, ThumbsUp
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/ia-vendas")({
  component: IASalesPage,
});

function IASalesPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['user-sales-profile'],
    queryFn: () => getUserSalesProfile(),
  });

  const { data: winners } = useQuery({
    queryKey: ['winner-messages'],
    queryFn: () => getWinnerMessages(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateUserSalesProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sales-profile'] });
      toast.success("Perfil atualizado com sucesso!");
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: analyzeUserStyle,
    onSuccess: () => {
      toast.success("Estudo de caso salvo! A IA agora conhece melhor seu estilo.");
    }
  });

  const [refText, setRefText] = useState("");

  if (loadingProfile) return <div className="p-8">Carregando inteligência...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                IA Adaptativa de Vendas
              </h1>
              <p className="text-muted-foreground">
                Sua IA que aprende com seu estilo, decisões e resultados reais.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-3">
                <Sparkles className="h-3 w-3 mr-1" />
                Modo Aprendizado Ativo
              </Badge>
              <Button 
                variant={profile?.learning_paused ? "default" : "outline"}
                size="sm"
                onClick={() => updateProfileMutation.mutate({ data: { learning_paused: !profile?.learning_paused } })}
              >
                {profile?.learning_paused ? (
                  <><PlayCircle className="h-4 w-4 mr-2" /> Retomar Aprendizado</>
                ) : (
                  <><PauseCircle className="h-4 w-4 mr-2" /> Pausar IA</>
                )}
              </Button>

            </div>
          </header>

          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="bg-background border">
              <TabsTrigger value="perfil" className="gap-2">
                <Target className="h-4 w-4" /> Perfil de Venda
              </TabsTrigger>
              <TabsTrigger value="mensagens" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Biblioteca Vencedora
              </TabsTrigger>
              <TabsTrigger value="aprendizado" className="gap-2">
                <Zap className="h-4 w-4" /> Laboratório de Estilo
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="h-4 w-4" /> Configurações IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Seu Estilo Dominante</CardTitle>
                    <CardDescription>Baseado nas suas últimas 50 interações</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2 p-4 rounded-xl bg-muted/50 text-center border">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Tom</span>
                        <div className="text-lg font-black text-primary capitalize">{profile?.preferred_tone || 'Natural'}</div>
                      </div>
                      <div className="space-y-2 p-4 rounded-xl bg-muted/50 text-center border">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Tamanho</span>
                        <div className="text-lg font-black text-primary capitalize">{profile?.preferred_size || 'Médio'}</div>
                      </div>
                      <div className="space-y-2 p-4 rounded-xl bg-muted/50 text-center border">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Foco CTA</span>
                        <div className="text-lg font-black text-primary capitalize">{profile?.preferred_cta || 'Curiosidade'}</div>
                      </div>
                      <div className="space-y-2 p-4 rounded-xl bg-muted/50 text-center border">
                        <span className="text-xs uppercase font-bold text-muted-foreground">Canal Top</span>
                        <div className="text-lg font-black text-primary capitalize">{profile?.preferred_channels?.[0] || 'WhatsApp'}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        Insights de Performance
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-success/5 border-success/10">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <p className="text-sm">Suas mensagens <strong>curtas</strong> no WhatsApp geram <strong>42% mais respostas</strong> que a média da IA.</p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-500/5 border-blue-500/10">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <p className="text-sm">A IA detectou que você prefere o gatilho de <strong>autoridade</strong> para leads com score acima de 80.</p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-500/5 border-amber-500/10">
                          <Zap className="h-5 w-5 text-amber-500" />
                          <p className="text-sm">Leads do nicho de <strong>estética</strong> estão respondendo melhor quando você usa tom <strong>consultivo</strong>.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas IA</CardTitle>
                    <CardDescription>Evolução do aprendizado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>Alinhamento de Estilo</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>Confiança da Sugestão</span>
                        <span>Alta</span>
                      </div>
                      <Progress value={92} className="h-2 bg-muted fill-primary" />
                    </div>
                    
                    <div className="pt-4 border-t space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Mensagens Enviadas</span>
                        <span className="font-bold">{profile?.messages_sent_count || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Taxa de Edição</span>
                        <span className="font-bold">{profile?.messages_edited_count ? Math.round((profile.messages_edited_count / (profile.messages_sent_count || 1)) * 100) : 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mensagens" className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {(winners || []).map((msg: any) => (
                   <Card key={msg.id} className="relative overflow-hidden group">
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="icon" variant="ghost" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
                       <Button size="icon" variant="ghost" className="h-7 w-7"><Star className={cn("h-3 w-3", msg.is_favorite && "fill-amber-400 text-amber-400")} /></Button>
                     </div>
                     <CardHeader className="pb-2">
                       <div className="flex items-center gap-2 mb-1">
                         <Badge variant="secondary" className="text-[10px]">{msg.channel}</Badge>
                         <Badge variant="outline" className="text-[10px]">{msg.niche}</Badge>
                       </div>
                       <CardTitle className="text-sm line-clamp-1">{msg.trigger_used || "Abordagem Direta"}</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <p className="text-xs text-muted-foreground italic line-clamp-4 mb-4">"{msg.message_content}"</p>
                       <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-success">
                            <ThumbsUp className="h-3 w-3" /> {msg.outcome === 'interested' ? 'Interessado' : 'Respondeu'}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
                 <Button variant="outline" className="h-full border-dashed border-2 flex flex-col gap-2 p-8 min-h-[200px]">
                   <Star className="h-6 w-6 text-muted-foreground" />
                   <div className="text-sm font-bold text-muted-foreground text-center">Nenhuma mensagem salva como vencedora ainda.</div>
                 </Button>
               </div>
            </TabsContent>

            <TabsContent value="aprendizado" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ensine a IA seu Estilo</CardTitle>
                  <CardDescription>Cole aqui uma mensagem que você considera perfeita. A IA irá analisar a estrutura e adaptar as futuras sugestões.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Cole aqui seu melhor exemplo de abordagem..." 
                    className="min-h-[200px] rounded-2xl"
                    value={refText}
                    onChange={(e) => setRefText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      disabled={!refText || analyzeMutation.isPending}
                      onClick={() => {
                        analyzeMutation.mutate({ data: { content: refText } });
                        setRefText("");
                      }}
                      className="rounded-xl gap-2"
                    >
                      <Sparkles className="h-4 w-4" /> 
                      {analyzeMutation.isPending ? "Analisando..." : "Aprender com esta Mensagem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferências de Geração</CardTitle>
                    <CardDescription>Ajuste manual do comportamento base da IA</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tom de Voz</label>
                      <Select value={profile?.preferred_tone} onValueChange={(v) => updateProfileMutation.mutate({ data: { preferred_tone: v } })}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural">Natural / Humano</SelectItem>
                          <SelectItem value="direct">Direto / Executivo</SelectItem>
                          <SelectItem value="consultivo">Consultivo / Educacional</SelectItem>
                          <SelectItem value="premium">Exclusivo / Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tamanho da Mensagem</label>
                      <Select value={profile?.preferred_size} onValueChange={(v) => updateProfileMutation.mutate({ data: { preferred_size: v } })}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Curto (Ideal WhatsApp)</SelectItem>
                          <SelectItem value="medium">Médio (Padrão)</SelectItem>
                          <SelectItem value="detailed">Detalhado (Consultivo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-destructive">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Zona de Segurança
                    </CardTitle>
                    <CardDescription>Gerencie seus dados e histórico de aprendizado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold">Limpar Histórico</div>
                        <div className="text-xs text-muted-foreground">Apaga todas as ações e edições registradas.</div>
                      </div>
                      <Button variant="destructive" size="sm" className="rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold">Resetar Estilo</div>
                        <div className="text-xs text-muted-foreground">IA volta ao padrão de fábrica de vendas.</div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg border-amber-500/50 text-amber-600">Resetar</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
