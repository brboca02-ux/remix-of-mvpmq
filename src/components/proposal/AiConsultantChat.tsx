import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles, Send, Lightbulb, Zap, Crown, MessageCircle } from "lucide-react";
import { GeneratedSite } from '@/modules/prospecting/types';

interface AiConsultantChatProps {
  siteData: GeneratedSite;
  onApplySuggestion: (field: string, value: any) => void;
}

export const AiConsultantChat: React.FC<AiConsultantChatProps> = ({ siteData, onApplySuggestion }) => {
  const [messages, setMessages] = useState<Array<{role: 'ai' | 'user', content: string}>>([
    { 
      role: 'ai', 
      content: `Olá! Sou sua consultora IA. Analisei os dados da ${siteData.companyName || 'empresa'} e estou pronta para ajudar você a criar uma proposta impossível de ignorar. Como posso ajudar?` 
    }
  ]);

  const quickActions = [
    { label: "Melhorar headline", icon: Sparkles },
    { label: "Criar CTA mais forte", icon: Zap },
    { label: "Sugerir diferenciais", icon: Lightbulb },
    { label: "Deixar mais premium", icon: Crown },
    { label: "Mensagem WhatsApp", icon: MessageCircle },
    { label: "Analisar proposta", icon: MessageSquare },
  ];

  const handleQuickAction = (action: string) => {
    setMessages(prev => [...prev, { role: 'user', content: action }]);
    
    // Fallback determinístico / Simulação de IA
    setTimeout(() => {
      let response = "";
      const niche = (siteData.niche || '').toLowerCase();
      
      if (action.includes("headline")) {
        response = `Com base no nicho ${siteData.niche}, sugiro: "Transforme a experiência de ${niche} da ${siteData.companyName} em referência absoluta em ${siteData.city || 'sua região'}." Quer que eu aplique?`;
      } else if (action.includes("CTA")) {
        response = `Para aumentar conversão, use: "GARANTIR MEU HORÁRIO EXCLUSIVO" ou "RECEBER CONSULTORIA GRATUITA". Botões diretos geram 30% mais cliques.`;
      } else if (action.includes("premium")) {
        response = `Para um visual mais premium, vamos focar em: 1. Headlines curtas, 2. Tipografia elegante, 3. Espaçamento generoso entre seções. Já ajustei o tema para refletir autoridade.`;
      } else if (action.includes("WhatsApp")) {
        response = `Script sugerido: "Olá ${siteData.companyName}, vi seu Instagram e montei uma proposta visual exclusiva para elevar seu posicionamento em ${siteData.city}. Pode conferir aqui: [LINK]"`;
      } else {
        response = `Analisando: Temos ${siteData.services?.length || 0} serviços e ${siteData.differentials?.length || 0} diferenciais. Recomendo adicionar mais detalhes sobre o atendimento para gerar conexão emocional.`;
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-[600px] border-slate-200 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm uppercase tracking-widest">Consultora IA Estratégica</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  m.role === 'ai' 
                    ? 'bg-slate-100 text-slate-800 rounded-tl-none' 
                    : 'bg-primary text-white rounded-tr-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickActions.map((action, i) => (
              <Button 
                key={i} 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-8 justify-start gap-1 bg-white"
                onClick={() => handleQuickAction(action.label)}
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Pergunte à IA..."
            />
            <Button size="icon" className="rounded-xl">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
