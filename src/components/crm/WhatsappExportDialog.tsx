import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ProspectLead } from '@/modules/prospecting/types';
import {
  exportLeadsForWhatsapp,
  downloadCsv,
  type ExportResult,
} from '@/lib/whatsapp-export';
import type { VariationLevel } from '@/lib/whatsapp/message-engine';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leads: ProspectLead[];
}

export const WhatsappExportDialog: React.FC<Props> = ({ open, onOpenChange, leads }) => {
  const [level, setLevel] = useState<VariationLevel>('medium');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));

  const result: ExportResult = useMemo(
    () => exportLeadsForWhatsapp(leads, level, seed),
    [leads, level, seed]
  );

  const regenerate = () => setSeed(Math.floor(Math.random() * 1e9));

  const copyMessages = async () => {
    try {
      await navigator.clipboard.writeText(result.messages.join('\n\n'));
      toast.success('Mensagens copiadas para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleDownload = () => {
    downloadCsv(result.csv);
    toast.success(`CSV gerado com ${result.leads.length} contatos`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Exportar para WhatsApp</DialogTitle>
          <DialogDescription>
            {result.leads.length} contatos prontos · {result.removedNoPhone} sem telefone ·{' '}
            {result.removedDuplicate} duplicados removidos
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Use intervalos entre envios para evitar bloqueios. Esta exportação <b>não envia</b>{' '}
            mensagens automaticamente.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Nível de variação:</span>
          {(['low', 'medium', 'high'] as VariationLevel[]).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={level === l ? 'default' : 'outline'}
              onClick={() => setLevel(l)}
            >
              {l}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={regenerate} className="ml-auto gap-1">
            <RefreshCw className="h-3 w-3" /> Gerar novas variações
          </Button>
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList>
            <TabsTrigger value="contacts">Contatos ({result.leads.length})</TabsTrigger>
            <TabsTrigger value="messages">Mensagens sugeridas</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts">
            <ScrollArea className="h-72 rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="text-left p-2">Empresa</th>
                    <th className="text-left p-2">Telefone</th>
                    <th className="text-left p-2">Cidade</th>
                    <th className="text-left p-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {result.leads.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2">{l.business_name || l.name}</td>
                      <td className="p-2 font-mono text-xs">{l.phone}</td>
                      <td className="p-2">{l.city}</td>
                      <td className="p-2">
                        <a
                          href={l.whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline text-xs"
                        >
                          wa.me
                        </a>
                      </td>
                    </tr>
                  ))}
                  {result.leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        Nenhum lead com telefone válido
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="messages">
            <ScrollArea className="h-72 rounded-md border p-3 space-y-2">
              {result.messages.map((m, i) => (
                <div
                  key={i}
                  className="text-sm border rounded-md p-2 mb-2 bg-card flex items-start gap-2"
                >
                  <Badge variant="outline" className="shrink-0">
                    #{i + 1}
                  </Badge>
                  <span className="flex-1">{m}</span>
                </div>
              ))}
              {result.messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">
                  Sem mensagens para gerar.
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={copyMessages} disabled={!result.messages.length}>
            <Copy className="h-4 w-4" /> Copiar mensagens
          </Button>
          <Button onClick={handleDownload} disabled={!result.leads.length}>
            <Download className="h-4 w-4" /> Baixar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};