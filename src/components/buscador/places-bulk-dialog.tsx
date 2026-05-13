import { useCallback, useState } from "react";
import { Sparkles, MapPin, Loader2, CheckCircle2, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { searchPlacesIds, processPlacesChunk } from "@/lib/places-bulk.functions";
import { startImportJob } from "@/lib/leads-import.functions";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: (inserted: number) => void;
}

export function PlacesBulkDialog({ open, onOpenChange, onImported }: Props) {
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [nicho, setNicho] = useState("energia solar");
  const [minScore, setMinScore] = useState(25);
  const [loading, setLoading] = useState(false);
  
  // Progress state
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState({ found: 0, imported: 0 });

  const onStartSearch = useCallback(async () => {
    if (!cidade || !uf) {
      toast.error("Preencha cidade e estado");
      return;
    }
    
    setLoading(true);
    setIsFinished(false);
    setProgress(0);
    setStats({ found: 0, imported: 0 });
    
    try {
      setStatusText("Buscando empresas no Google...");
      const { places, total } = await searchPlacesIds({ data: { cidade, uf, nicho } });
      
      if (total === 0) {
        toast.error("Nenhuma empresa encontrada com esses critérios.");
        setLoading(false);
        return;
      }

      setStats(s => ({ ...s, found: total }));
      setStatusText(`Encontradas ${total} empresas. Iniciando importação...`);

      // Cria o Job
      const { job_id } = await startImportJob({ 
        data: { 
          filename: `Google Places: ${nicho} em ${cidade}/${uf}`, 
          total_rows: total 
        } 
      });

      const chunkSize = 5; // Chunks menores para Places pois fetch details é lento
      const placeIds = places.map(p => p.id);
      let importedCount = 0;

      for (let i = 0; i < placeIds.length; i += chunkSize) {
        const chunk = placeIds.slice(i, i + chunkSize);
        setStatusText(`Enriquecendo dados (${i + 1} de ${total})...`);
        
        const r = await processPlacesChunk({
          data: {
            job_id,
            place_ids: chunk,
            nicho,
            cidade,
            uf,
            minScore
          }
        });

        importedCount += r.processed;
        setStats(s => ({ ...s, imported: importedCount }));
        setProgress(Math.round(((i + chunk.length) / total) * 100));
      }

      setIsFinished(true);
      toast.success(`${importedCount} empresas importadas do Google!`);
      onImported?.(importedCount);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Falha na busca do Google");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }, [cidade, uf, nicho, minScore, onImported]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/20" /> Google Places Bulk
          </DialogTitle>
          <DialogDescription>
            Busca automática de empresas no Google Maps por nicho e região.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Curitiba"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                placeholder="Ex: PR"
                maxLength={2}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>O que buscar? (Nicho)</Label>
            <Input
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Ex: energia solar, oficina mecânica"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Qualidade Mínima (Score)</Label>
              <span className="text-xs font-bold text-primary">{minScore} pts</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full accent-primary"
              disabled={loading}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Básico</span>
              <span>Com Tel/Site</span>
              <span>Top Rated</span>
            </div>
          </div>

          {loading && (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {statusText}
                </span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Encontrados: {stats.found}</span>
                <span>Processados: {stats.imported}</span>
              </div>
            </div>
          )}

          {isFinished && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/20 p-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-700">Busca Finalizada!</h4>
                  <p className="text-sm text-emerald-600/80">
                    {stats.imported} novas empresas adicionadas ao seu buscador.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            {!isFinished ? (
              <Button onClick={onStartSearch} disabled={loading || !cidade || !uf} className="min-w-[140px] gap-2 shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar Leads
              </Button>
            ) : (
              <Button onClick={() => onOpenChange(false)} className="min-w-[140px]">
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}