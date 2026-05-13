import { useState, useMemo, useEffect } from "react";
import { 
  AlertCircle, RefreshCw, Trash2, Edit, ChevronDown, 
  ChevronUp, Database, FileText, CheckCircle2, X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  listImportErrors, 
  deleteImportError, 
  processImportJobChunk 
} from "@/lib/leads-import.functions";
import { normalizeLead, type StandardLead } from "@/lib/leads-shared";

export function ImportErrorAudit() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StandardLead>>({});

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const data = await listImportErrors({ data: { limit: 50 } });
      setErrors(data);
    } catch (err) {
      console.error("Failed to fetch import errors", err);
      toast.error("Falha ao carregar erros de importação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteImportError({ data: { id } });
      setErrors(prev => prev.filter(e => e.id !== id));
      toast.success("Erro removido do histórico");
    } catch (err) {
      toast.error("Falha ao remover erro");
    }
  };

  const handleEditOpen = (error: any) => {
    const rawData = error.raw_payload || {};
    // Se o payload for do buscador de lugares ou CSV parcial
    const baseLead = normalizeLead({
      nome: rawData.nome || rawData.name || "",
      telefone: rawData.telefone || rawData.phone || "",
      cnpj: rawData.cnpj || "",
      cidade: rawData.cidade || "",
      uf: rawData.uf || ""
    });
    
    setEditingError(error);
    setEditFormData(baseLead);
  };

  const handleReprocess = async (error: any, customData?: Partial<StandardLead>) => {
    try {
      const leadToProcess = normalizeLead({
        ...(error.raw_payload || {}),
        ...customData
      });

      if (!leadToProcess.nome) {
        toast.error("Nome da empresa é obrigatório");
        return;
      }

      await processImportJobChunk({
        data: {
          job_id: error.job_id || "manual_rescue",
          leads: [leadToProcess],
          chunk_index: 0
        }
      });

      await deleteImportError({ data: { id: error.id } });
      setErrors(prev => prev.filter(e => e.id !== error.id));
      setEditingError(null);
      toast.success("Lead reprocessado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao reprocessar: " + err.message);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5 text-rose-500" /> Auditoria de Falhas
            </CardTitle>
            <CardDescription>Resgate leads que não puderam ser importados automaticamente.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Motivo da Falha</TableHead>
                <TableHead>Dados Identificados</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20 text-emerald-500" />
                    Nenhum erro de importação pendente.
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((error) => (
                  <TableRow key={error.id} className="group hover:bg-white/5">
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {format(new Date(error.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-rose-500 line-clamp-1">{error.error_message}</span>
                        <span className="text-[10px] text-muted-foreground opacity-60">Job ID: {error.job_id?.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] text-muted-foreground font-mono bg-muted/20 p-1.5 rounded border border-white/5 truncate max-w-[200px]">
                        {JSON.stringify(error.raw_payload)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10" 
                          onClick={() => handleReprocess(error)}
                          title="Reprocessar direto"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" 
                          onClick={() => handleEditOpen(error)}
                          title="Editar e Reprocessar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:bg-rose-500/10" 
                          onClick={() => handleDelete(error.id)}
                          title="Descartar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit & Rescue Dialog */}
      <Dialog open={!!editingError} onOpenChange={(open) => !open && setEditingError(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Corrigir Lead para Resgate
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input 
                id="name" 
                value={editFormData.nome || ""} 
                onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpj" className="text-right">CNPJ</Label>
              <Input 
                id="cnpj" 
                value={editFormData.cnpj || ""} 
                onChange={(e) => setEditFormData({...editFormData, cnpj: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Telefone</Label>
              <Input 
                id="phone" 
                value={editFormData.telefone || ""} 
                onChange={(e) => setEditFormData({...editFormData, telefone: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cidade" className="text-right col-span-1 text-xs">Cidade</Label>
                <Input 
                  id="cidade" 
                  value={editFormData.cidade || ""} 
                  onChange={(e) => setEditFormData({...editFormData, cidade: e.target.value})}
                  className="col-span-3 h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uf" className="text-right col-span-1 text-xs">UF</Label>
                <Input 
                  id="uf" 
                  maxLength={2}
                  value={editFormData.uf || ""} 
                  onChange={(e) => setEditFormData({...editFormData, uf: e.target.value})}
                  className="col-span-3 h-8 text-xs uppercase" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingError(null)}>Cancelar</Button>
            <Button onClick={() => handleReprocess(editingError, editFormData)}>
              Salvar e Reprocessar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={`animate-spin ${className}`} />;
}
