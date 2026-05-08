 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Sparkles, Loader2 } from "lucide-react";
 
 interface MarketResearchInputProps {
   onGenerate: (input: string) => void;
   isLoading: boolean;
 }
 
 export function MarketResearchInput({ onGenerate, isLoading }: MarketResearchInputProps) {
   const [input, setInput] = useState("");
 
   const handleSubmit = () => {
     if (input.trim() && !isLoading) {
       onGenerate(input);
     }
   };
 
   return (
     <div className="space-y-4 w-full max-w-4xl mx-auto">
       <div className="relative">
         <Textarea
           placeholder="Ex: Quero validar uma fintech para pequenos negócios no Brasil..."
           className="min-h-[120px] bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50 transition-all resize-none p-4 rounded-xl text-base"
           value={input}
           onChange={(e) => setInput(e.target.value)}
           disabled={isLoading}
         />
         <div className="absolute bottom-3 right-3">
           <Button 
             onClick={handleSubmit} 
             disabled={isLoading || !input.trim()}
             className="gap-2 shadow-lg shadow-primary/20"
           >
             {isLoading ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <Sparkles className="h-4 w-4" />
             )}
             {isLoading ? "Gerando análise..." : "Gerar Análise"}
           </Button>
         </div>
       </div>
       <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-medium opacity-50">
         Análise em tempo real usando Lovable AI • Dados qualitativos e quantitativos
       </p>
     </div>
   );
 }