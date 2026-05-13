import { useState, useMemo, useEffect } from "react";
import { 
  AlertCircle, RefreshCw, Trash2, Edit, ChevronDown, 
  ChevronUp, Database, FileText, CheckCircle2, X, Search, Calendar, Filter
} from "lucide-react";
import { format, isSameDay } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [editingError, setEditingError] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StandardLead>>({});
  
  // Filtros
  const [searchTerm, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const data = await listImportErrors({ data: { limit: 100 } });
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

  const filteredErrors = useMemo(() => {
    return errors.filter(error => {
      // Filtro de texto (CNPJ/Telefone/Mensagem)
      const rawPayloadStr = JSON.stringify(error.raw_payload || "").toLowerCase();
      const messageStr = (error.error_message || "").toLowerCase();
      const searchStr = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        rawPayloadStr.includes(searchStr) || 
        messageStr.includes(searchStr);

      // Filtro de status de erro
      const matchesStatus = statusFilter === "all" || 
        messageStr.includes(statusFilter.toLowerCase());

      // Filtro de data
      let matchesDate = true;
      if (dateFilter) {
        const errorDate = new Date(error.created_at);
        const filterDate = new Date(dateFilter);
        matchesDate = isSameDay(errorDate, filterDate);
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [errors, searchTerm, statusFilter, dateFilter]);

  const uniqueErrorTypes = useMemo(() => {
    const types = new Set<string>();
    errors.forEach(e => {
      if (e.error_message) {
        // Pega as primeiras 3 palavras para agrupar tipos de erro
        const words = e.error_message.split(' ').slice(0, 3).join(' ');
        types.add(words);
      }
    });
    return Array.from(types);
  }, [errors]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5 text-rose-500" /> Auditoria de Falhas
            </CardTitle>
            <CardDescription>Resgate leads que não puderam ser importados automaticamente.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por CNPJ, Telefone..." 
              className="pl-9 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 opacity-50" />
                <SelectValue placeholder="Tipo de Erro" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Erros</SelectItem>
              {uniqueErrorTypes.map((type, i) => (
                <SelectItem key={i} value={type}>{type}...</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="date" 
              className="pl-9 h-9 text-xs"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 text-xs gap-2 text-muted-foreground"
            onClick={() => {
              setSearchText("");
              setStatusFilter("all");
              setDateFilter("");
            }}
          >
            <X className="h-3.5 w-3.5" /> Limpar Filtros
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 pt-2">
        <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-[180px] text-[11px] uppercase font-bold">Data/Hora</TableHead>
                <TableHead className="text-[11px] uppercase font-bold">Motivo da Falha</TableHead>
                <TableHead className="text-[11px] uppercase font-bold">Dados Identificados</TableHead>
                <TableHead className="text-right text-[11px] uppercase font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredErrors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20 text-emerald-500" />
                    {errors.length > 0 ? "Nenhum erro corresponde aos filtros aplicados." : "Nenhum erro de importação pendente."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredErrors.map((error) => (
                  <TableRow key={error.id} className="group hover:bg-white/5 border-b border-white/5">
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{format(new Date(error.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="opacity-50">{format(new Date(error.created_at), "HH:mm:ss")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-rose-500">{error.error_message}</span>
                        <Badge variant="outline" className="w-fit text-[9px] h-4 border-muted-foreground/20 text-muted-foreground">
                          Job: {error.job_id?.slice(0, 8)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/20 p-2 rounded border border-white/5 group-hover:border-white/10 transition-colors overflow-hidden">
                          <div className="grid grid-cols-1 gap-1">
                            {Object.entries(error.raw_payload || {}).map(([key, val], idx) => (
                              val && typeof val === 'string' && val.length > 0 ? (
                                <div key={idx} className="flex gap-2">
                                  <span className="font-bold uppercase opacity-40">{key}:</span>
                                  <span className="truncate">{String(val)}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
        <div className="mt-4 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2">
          <span>Total: {errors.length} falhas registradas</span>
          <span>Exibindo: {filteredErrors.length} filtradas</span>
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
