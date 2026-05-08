import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Lightbulb, ShieldCheck } from "lucide-react";
import { ValidationResult } from "@/lib/idea-validator";

interface IdeaValidatorPanelProps {
  result: ValidationResult;
}

export const IdeaValidatorPanel: React.FC<IdeaValidatorPanelProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Validador de Proposta</CardTitle>
          </div>
          <span className={`text-2xl font-black ${getScoreColor(result.score)}`}>{result.score}</span>
        </div>
        <Progress value={result.score} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {result.strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Pontos Fortes
            </p>
            <ul className="text-xs space-y-1 text-slate-600">
              {result.strengths.slice(0, 3).map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}

        {result.weaknesses.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Pontos Fracos
            </p>
            <ul className="text-xs space-y-1 text-slate-600">
              {result.weaknesses.slice(0, 3).map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 mb-2">
            <Lightbulb className="w-3 h-3" /> Sugestão de Melhoria
          </p>
          <p className="text-xs text-slate-700 italic">
            {result.suggestions[0] || "Continue personalizando para aumentar o impacto."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
