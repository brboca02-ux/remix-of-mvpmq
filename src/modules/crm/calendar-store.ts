import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventType = 'reunião' | 'tarefa' | 'lembrete';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  description?: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  completed: boolean;
  createdAt: string;
  recurrence?: RecurrenceType;
  notificationMinutes?: number; // minutos antes do evento
}

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleComplete: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (eventData) => set((state) => ({
        events: [
          ...state.events,
          {
            ...eventData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          }
        ]
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      })),
      toggleComplete: (id) => set((state) => ({
        events: state.events.map((e) => 
          e.id === id ? { ...e, completed: !e.completed } : e
        )
      })),
    }),
    {
      name: 'crm-calendar-storage',
    }
  )
);
