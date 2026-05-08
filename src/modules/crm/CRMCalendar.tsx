import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCalendarStore, CalendarEvent, EventType, RecurrenceType } from './calendar-store';
import { format, isSameDay, parseISO, addMinutes, isBefore, isAfter, subMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Video, 
  CheckCircle2, 
  Circle,
  MoreVertical,
  Trash2,
  Users,
  RefreshCw,
  Bell,
  Repeat
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { useProspectingStore } from '../prospecting/prospecting-store';

interface CRMCalendarProps {
  initialLeadId?: string;
  onEventCreated?: () => void;
}

export const CRMCalendar: React.FC<CRMCalendarProps> = ({ initialLeadId, onEventCreated }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { events, toggleComplete, deleteEvent, addEvent, updateEvent } = useCalendarStore();
  const { leads } = useProspectingStore();
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'reunião' as EventType,
    leadId: initialLeadId || '',
    time: '09:00',
    recurrence: 'none' as RecurrenceType,
    notificationMinutes: 15,
  });

  // Notificações simuladas
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      events.forEach(event => {
        if (event.completed || !event.notificationMinutes) return;
        
        const startTime = parseISO(event.startTime);
        const notifyTime = subMinutes(startTime, event.notificationMinutes);
        
        // Se agora está entre notifyTime e startTime (janela de 1 min para não repetir muito)
        if (isAfter(now, notifyTime) && isBefore(now, startTime)) {
          const key = `notified-${event.id}-${event.startTime}`;
          if (!localStorage.getItem(key)) {
            toast.info(`Lembrete: ${event.title} em ${event.notificationMinutes} min`, {
              icon: <Bell className="h-4 w-4 text-primary" />,
              description: event.leadName ? `Com: ${event.leadName}` : undefined,
            });
            localStorage.setItem(key, 'true');
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 30000); // Checa a cada 30s
    return () => clearInterval(interval);
  }, [events]);

  const selectedLead = leads.find(l => l.id === newEvent.leadId);

  const handleAddEvent = () => {
    if (!date || !newEvent.title) return;
    
    const [hours, minutes] = newEvent.time.split(':');
    const eventDate = new Date(date);
    eventDate.setHours(parseInt(hours), parseInt(minutes));

    addEvent({
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type,
      leadId: newEvent.leadId,
      leadName: selectedLead?.companyName || '',
      startTime: eventDate.toISOString(),
      completed: false,
      recurrence: newEvent.recurrence,
      notificationMinutes: newEvent.notificationMinutes,
    });

    setIsAddOpen(false);
    setNewEvent({
      title: '',
      description: '',
      type: 'reunião',
      leadId: '',
      time: '09:00',
      recurrence: 'none',
      notificationMinutes: 15,
    });
    onEventCreated?.();
    toast.success('Compromisso agendado com sucesso!');
  };

  const handleSyncGoogle = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Sincronizando com Google Calendar...',
        success: 'Sincronização concluída! 5 eventos importados/atualizados.',
        error: 'Erro na sincronização.',
      }
    );
  };
  
  const selectedDateEvents = date 
    ? events.filter(e => isSameDay(parseISO(e.startTime), date))
    : [];

  const sortedEvents = [...selectedDateEvents].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'reunião': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tarefa': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'lembrete': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasEventsOnDay = (day: Date) => {
    return events.some(e => isSameDay(parseISO(e.startTime), day));
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendário
          </CardTitle>
          <CardDescription>
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-0 pb-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            className="rounded-md"
            modifiers={{
              hasEvent: (date) => hasEventsOnDay(date)
            }}
            modifiersStyles={{
              hasEvent: { 
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'var(--primary)',
                textDecorationThickness: '2px'
              }
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Checklist Diário
            </CardTitle>
            <CardDescription>
              {sortedEvents.length} {sortedEvents.length === 1 ? 'evento' : 'eventos'} para este dia
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSyncGoogle}>
              <RefreshCw className="h-4 w-4" /> Sync Google
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[400px]">
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>Nenhum compromisso agendado para hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-4 flex items-start gap-4 transition-colors hover:bg-slate-50 group ${event.completed ? 'opacity-60' : ''}`}
                  >
                    <button 
                      onClick={() => toggleComplete(event.id)}
                      className="mt-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {event.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold truncate ${event.completed ? 'line-through' : ''}`}>
                          {event.title}
                        </h4>
                        <Badge className={`text-[10px] px-1.5 py-0 uppercase border ${getEventBadgeColor(event.type)}`}>
                          {event.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(parseISO(event.startTime), 'HH:mm')}
                        </span>
                        {event.leadName && (
                          <span className="flex items-center gap-1 truncate text-primary font-medium">
                            <Users className="h-3.5 w-3.5" />
                            {event.leadName}
                          </span>
                        )}
                      </p>
                      
                      {event.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 italic">
                          "{event.description}"
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          const nextDay = addMinutes(parseISO(event.startTime), 24 * 60);
                          updateEvent(event.id, { startTime: nextDay.toISOString() });
                          toast.success('Compromisso adiado para amanhã');
                        }}>
                          <Clock className="h-4 w-4 mr-2" /> Adiar (24h)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600 gap-2" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Novo Evento</DialogTitle>
            <DialogDescription>
              {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-xs">Título</Label>
              <Input
                id="title"
                className="col-span-3 h-9"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Ex: Reunião de Apresentação"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-xs">Tipo</Label>
              <Select 
                value={newEvent.type} 
                onValueChange={(v: EventType) => setNewEvent({ ...newEvent, type: v })}
              >
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reunião">Reunião</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lead" className="text-right text-xs">Lead</Label>
              <Select 
                value={newEvent.leadId} 
                onValueChange={(v) => setNewEvent({ ...newEvent, leadId: v })}
              >
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[150px]">
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>{lead.companyName}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right text-xs">Hora</Label>
              <Input
                id="time"
                type="time"
                className="col-span-3 h-9"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurrence" className="text-right text-xs">Repetir</Label>
              <Select 
                value={newEvent.recurrence} 
                onValueChange={(v: RecurrenceType) => setNewEvent({ ...newEvent, recurrence: v })}
              >
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repetir</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notify" className="text-right text-xs">Lembrete</Label>
              <Select 
                value={String(newEvent.notificationMinutes)} 
                onValueChange={(v) => setNewEvent({ ...newEvent, notificationMinutes: Number(v) })}
              >
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min antes</SelectItem>
                  <SelectItem value="15">15 min antes</SelectItem>
                  <SelectItem value="30">30 min antes</SelectItem>
                  <SelectItem value="60">1 hora antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc" className="text-right text-xs">Descrição</Label>
              <Textarea
                id="desc"
                className="col-span-3 min-h-[80px]"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Detalhes opcionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEvent} className="w-full sm:w-auto">Criar Compromisso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
