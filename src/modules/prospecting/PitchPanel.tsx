import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProspectingStore } from './prospecting-store';
import { Copy, Check, MessageCircle, Instagram, BookOpen, Lightbulb, ShieldAlert, Sparkles, Calendar, ExternalLink, Mail, Zap } from "@/lib/icons";
import { ProspectLead } from './types';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PitchPanelProps {
  lead: ProspectLead;
  pitches: NonNullable<ProspectLead['generatedPitch']>;
}

export const PitchPanel: React.FC<PitchPanelProps> = ({ lead, pitches }) => {
  if (!lead || !pitches) return null;

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Script copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsApp = (text: string) => {
    if (!lead.whatsapp) {
      toast.error("Número de WhatsApp não encontrado para este lead.");
      return;
    }
    const url = `https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const pitchOptions = [
    { id: 'short', title: 'WhatsApp Curto', text: pitches.whatsappShort, icon: MessageCircle },
    { id: 'consultative', title: 'WhatsApp Consultivo', text: pitches.whatsappConsultative, icon: MessageCircle },
    { id: 'direct', title: 'Instagram Direct', text: pitches.instagramDirect, icon: Instagram },
    { id: 'linkedin', title: 'LinkedIn Outreach', text: pitches.linkedinOutreach, icon: ExternalLink },
    { id: 'coldmail', title: 'Cold Mail 1', text: pitches.coldMail1, icon: Mail },
    { id: 'f24h', title: 'Follow-up 24h', text: pitches.followup24h, icon: Check },
    { id: 'f72h', title: 'Follow-up 72h', text: pitches.followup72h, icon: Check },
  ];

  const playbook = pitches.playbook;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scripts" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Scripts de Venda
          </TabsTrigger>
          <TabsTrigger value="playbook" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Playbook IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          {lead.socialDiscovery?.suggestedHook && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Gancho Personalizado (Instagram)</p>
                  <p className="text-sm font-medium">{lead.socialDiscovery.suggestedHook}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {pitchOptions.map((option) => {
            const efficiency = useProspectingStore.getState().getStyleEfficiency(option.id === 'short' ? 'curiosidade' : option.id === 'consultative' ? 'autoridade' : option.id);
            return (
              <Card key={option.id} className="border-border/50">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <option.icon className="h-4 w-4 text-primary" />
                      {option.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] uppercase">
                        {efficiency.responseRate > 0 ? `${efficiency.responseRate}% CHANCE DE RESPOSTA` : 'ABORDAGEM TESTADA'}
                      </Badge>
                      {efficiency.score > 70 && (
                        <Badge className="bg-violet-100 text-violet-700 border-none font-black text-[9px] uppercase">
                          ALTA CONVERSÃO
                        </Badge>
                      )}
                    </div>
                  </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => copyToClipboard(option.text, option.id)}
                  >
                    {copiedId === option.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {option.id.includes('whatsapp') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() => openWhatsApp(option.text)}
                    >
                      <MessageCircle className="h-3 w-3" /> Abrir WA
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {option.text}
                </p>
              </CardContent>
            </Card>
          )})}
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          {playbook ? (
            <>
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Estratégia de Abordagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">{playbook.approachStrategy}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" /> Sugestões de Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-2">
                    {playbook.contentSuggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" /> Quebra de Objeções
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {playbook.objectionHandling.map((obj, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-bold text-foreground">Objeção: "{obj.trigger}"</p>
                      <p className="text-sm text-muted-foreground italic">" {obj.response} "</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {lead.socialDiscovery?.recentPosts && lead.socialDiscovery.recentPosts.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-500" /> Posts Recentes (Insight)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {lead.socialDiscovery.recentPosts.map((post, i) => (
                      <div key={i} className="bg-muted/30 p-2 rounded-md border border-border/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {post.date}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed py-10 flex flex-col items-center justify-center bg-muted/20">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Playbook não gerado para este nicho.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
