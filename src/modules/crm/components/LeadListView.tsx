import React from 'react';
import { ProspectLead } from '../../prospecting/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  MessageSquare, 
  MoreHorizontal, 
  TrendingUp,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";

interface LeadListViewProps {
  leads: ProspectLead[];
  selectedIds: string[];
  onSelectLead: (id: string) => void;
  onSelectAll: () => void;
  onViewDetails: (lead: ProspectLead) => void;
  onStatusChange: (id: string, status: ProspectLead['status']) => void;
}

export const LeadListView: React.FC<LeadListViewProps> = ({
  leads,
  selectedIds,
  onSelectLead,
  onSelectAll,
  onViewDetails,
  onStatusChange
}) => {
  const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;

  const isInactive = (updatedAt: string) => {
    const lastUpdate = new Date(updatedAt).getTime();
    const now = Date.now();
    return now - lastUpdate > 48 * 60 * 60 * 1000;
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={isAllSelected} 
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-tighter">Empresa</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-tighter">Status</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-tighter">Última Interação</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-tighter">Progresso</TableHead>
            <TableHead className="text-right font-bold text-xs uppercase tracking-tighter">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-slate-50/30 transition-colors group">
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(lead.id)} 
                  onCheckedChange={() => onSelectLead(lead.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{lead.companyName}</span>
                    {isInactive(lead.updatedAt) && (
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" title="Inativo > 48h"></span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{lead.niche} • {lead.city}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-bold text-[10px] uppercase">
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true, locale: ptBR })}
                </div>
              </TableCell>
              <TableCell className="w-48">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Score</span>
                    <span className={lead.opportunityScore > 80 ? "text-rose-500" : "text-primary"}>
                      {lead.opportunityScore}%
                    </span>
                  </div>
                  <Progress value={lead.opportunityScore} className="h-1.5" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onViewDetails(lead)}>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                Nenhum lead encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};