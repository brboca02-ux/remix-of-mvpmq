import { useState, useMemo } from "react";
import { 
  History, Search, Filter, ArrowRight, Clock, 
  User, Database, Globe, Zap, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuditStore, type AuditLog } from "@/hooks/useAuditStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AuditLogPanel() {
  const { auditLogs, clearLogs } = useAuditStore();
  const [filterText, setFilterText] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesText = 
        log.leadId.toLowerCase().includes(filterText.toLowerCase()) ||
        (log.leadName || "").toLowerCase().includes(filterText.toLowerCase());
      const matchesAction = filterAction === "all" || log.action === filterAction;
      return matchesText && matchesAction;
    });
  }, [auditLogs, filterText, filterAction]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedLogs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedLogs(next);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "manual": return <User className="h-3 w-3" />;
      case "import": return <Database className="h-3 w-3" />;
      case "social": return <Globe className="h-3 w-3" />;
      case "system": return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "add": return <Badge variant="default" className="bg-success text-success-foreground text-[10px] font-bold uppercase tracking-widest px-3 border-none shadow-lg shadow-success/20">Add</Badge>;
      case "update": return <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-widest px-3">Update</Badge>;
      case "upsert": return <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 border-none shadow-lg shadow-accent/20">Upsert</Badge>;
      case "delete": return <Badge variant="destructive" className="bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-widest px-3 border-none">Delete</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">{action}</Badge>;
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome ou ID do lead..."
                className="pl-9"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Ações</SelectItem>
                <SelectItem value="add">Adição</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="upsert">Upsert</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={clearLogs} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Limpar Histórico
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-2xl border border-white/5 bg-black overflow-hidden shadow-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[160px]">Data/Hora</TableHead>
                <TableHead className="w-[100px]">Ação</TableHead>
                <TableHead className="w-[100px]">Origem</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead className="text-right">Alterações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum log de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <>
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <TableCell>
                        {expandedLogs.has(log.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {format(log.timestamp, "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase gap-1 px-1">
                          {getSourceIcon(log.source)}
                          {log.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[200px]">
                          {log.leadName || "Lead s/ nome"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {log.leadId.slice(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {log.changes.length}
                      </TableCell>
                    </TableRow>
                    {expandedLogs.has(log.id) && (
                      <TableRow className="bg-muted/10 border-b-2">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                              <History className="h-3 w-3" /> Detalhes das Alterações
                            </h5>
                            <div className="grid gap-2">
                              {log.changes.map((change, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-[120px_1fr_20px_1fr] items-center gap-2 p-2 rounded border bg-background/50 text-xs">
                                  <span className="font-bold text-primary truncate" title={change.field}>
                                    {change.field}
                                  </span>
                                  <div className="bg-rose-500/10 text-rose-700 p-1.5 rounded border border-rose-500/20 truncate" title={String(change.before)}>
                                    {change.before === null ? <span className="italic opacity-50">null</span> : String(change.before)}
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" />
                                  <div className="bg-emerald-500/10 text-emerald-700 p-1.5 rounded border border-emerald-500/20 truncate" title={String(change.after)}>
                                    {String(change.after)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
