// @ts-nocheck
/**
 * CRM Store
 * 
 * Manages CRM state including pipeline, activities, tasks, and notifications.
 * 
 * Task 19.2 - Phase 4: Store Refactoring
 * 
 * @module modules/crm/crm-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PipelineStage,
  PipelineStatistics,
  CRMActivity,
  CRMTask,
  CRMNotification,
  LeadFilterCriteria,
  LeadSortOptions,
} from './types';
import type { ProspectLead } from '@/modules/prospecting/types';
import { logger } from '@/lib/logger';

interface CRMState {
  // ============================================================================
  // Pipeline State
  // ============================================================================
  
  /** Current pipeline statistics */
  pipelineStats: PipelineStatistics | null;
  
  /** Loading state for pipeline */
  pipelineLoading: boolean;
  
  // ============================================================================
  // Activities State
  // ============================================================================
  
  /** All activities */
  activities: CRMActivity[];
  
  /** Recent activities (last 10) */
  recentActivities: CRMActivity[];
  
  /** Loading state for activities */
  activitiesLoading: boolean;
  
  // ============================================================================
  // Tasks State
  // ============================================================================
  
  /** All tasks */
  tasks: CRMTask[];
  
  /** Tasks grouped by lead ID */
  tasksByLead: Record<string, CRMTask[]>;
  
  /** Loading state for tasks */
  tasksLoading: boolean;
  
  // ============================================================================
  // Notifications State
  // ============================================================================
  
  /** All notifications */
  notifications: CRMNotification[];
  
  /** Unread notification count */
  unreadCount: number;
  
  // ============================================================================
  // UI State
  // ============================================================================
  
  /** Currently selected lead ID */
  selectedLeadId: string | null;
  
  /** Active view */
  activeView: 'pipeline' | 'calendar' | 'tasks' | 'activities';
  
  /** Current filters */
  filters: LeadFilterCriteria;
  
  /** Current sort options */
  sortOptions: LeadSortOptions;
  
  // ============================================================================
  // Pipeline Actions
  // ============================================================================
  
  /**
   * Update lead pipeline stage
   */
  updatePipelineStage: (leadId: string, stage: PipelineStage) => Promise<void>;
  
  /**
   * Load pipeline statistics
   */
  loadPipelineStats: () => Promise<void>;
  
  /**
   * Move lead to next stage
   */
  moveToNextStage: (leadId: string) => Promise<void>;
  
  // ============================================================================
  // Activity Actions
  // ============================================================================
  
  /**
   * Create new activity
   */
  createActivity: (activity: Omit<CRMActivity, 'id' | 'timestamp'>) => Promise<void>;
  
  /**
   * Load activities for a lead
   */
  loadActivities: (leadId?: string) => Promise<void>;
  
  /**
   * Load recent activities
   */
  loadRecentActivities: () => Promise<void>;
  
  // ============================================================================
  // Task Actions
  // ============================================================================
  
  /**
   * Create new task
   */
  createTask: (task: Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  /**
   * Update task
   */
  updateTask: (taskId: string, updates: Partial<CRMTask>) => Promise<void>;
  
  /**
   * Complete task
   */
  completeTask: (taskId: string) => Promise<void>;
  
  /**
   * Delete task
   */
  deleteTask: (taskId: string) => Promise<void>;
  
  /**
   * Load tasks
   */
  loadTasks: (leadId?: string) => Promise<void>;
  
  // ============================================================================
  // Notification Actions
  // ============================================================================
  
  /**
   * Add notification
   */
  addNotification: (notification: Omit<CRMNotification, 'id' | 'createdAt' | 'read'>) => void;
  
  /**
   * Mark notification as read
   */
  markNotificationRead: (notificationId: string) => void;
  
  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: () => void;
  
  /**
   * Clear notification
   */
  clearNotification: (notificationId: string) => void;
  
  /**
   * Clear all notifications
   */
  clearAllNotifications: () => void;
  
  // ============================================================================
  // UI Actions
  // ============================================================================
  
  /**
   * Set selected lead
   */
  setSelectedLead: (leadId: string | null) => void;
  
  /**
   * Set active view
   */
  setActiveView: (view: 'pipeline' | 'calendar' | 'tasks' | 'activities') => void;
  
  /**
   * Set filters
   */
  setFilters: (filters: Partial<LeadFilterCriteria>) => void;
  
  /**
   * Clear filters
   */
  clearFilters: () => void;
  
  /**
   * Set sort options
   */
  setSortOptions: (options: LeadSortOptions) => void;
  
  // ============================================================================
  // Utility Actions
  // ============================================================================
  
  /**
   * Reset store to initial state
   */
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  // Pipeline
  pipelineStats: null,
  pipelineLoading: false,
  
  // Activities
  activities: [],
  recentActivities: [],
  activitiesLoading: false,
  
  // Tasks
  tasks: [],
  tasksByLead: {},
  tasksLoading: false,
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // UI
  selectedLeadId: null,
  activeView: 'pipeline' as const,
  filters: {},
  sortOptions: {
    field: 'updatedAt' as const,
    direction: 'desc' as const,
  },
};

/**
 * CRM Store
 */
export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========================================================================
      // Pipeline Actions
      // ========================================================================
      
      updatePipelineStage: async (leadId: string, stage: PipelineStage) => {
        try {
          logger.info('Updating pipeline stage', { leadId, stage });
          
          // TODO: Integrate with Supabase
          // For now, just log the action
          
          // Create activity for stage change
          await get().createActivity({
            leadId,
            type: 'status_change',
            title: `Movido para ${stage}`,
            description: `Lead movido para o estágio ${stage}`,
            outcome: 'positive',
          });
          
          // Reload pipeline stats
          await get().loadPipelineStats();
          
          logger.info('Pipeline stage updated successfully', { leadId, stage });
        } catch (error) {
          logger.error('Failed to update pipeline stage', error as Error, { leadId, stage });
          throw error;
        }
      },
      
      loadPipelineStats: async () => {
        try {
          set({ pipelineLoading: true });
          logger.debug('Loading pipeline statistics');
          
          // Buscar dados reais do Supabase
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: leads, error } = await supabase
            .from('leads_import')
            .select('status, confidence_score')
            .limit(1000);
          
          if (error) {
            logger.warn('Failed to load pipeline stats from Supabase, using local data', { error });
            set({ pipelineLoading: false });
            return;
          }
          
          // Calcular stats reais
          const byStage: Record<string, { count: number; value: number }> = {
            novo: { count: 0, value: 0 },
            contato: { count: 0, value: 0 },
            respondeu: { count: 0, value: 0 },
            proposta: { count: 0, value: 0 },
            fechado: { count: 0, value: 0 },
          };
          
          const statusToStage: Record<string, string> = {
            'Novo': 'novo',
            'Lead Gerado': 'novo',
            'Qualificado': 'contato',
            'Contatado': 'contato',
            'Cold Mail Enviado': 'contato',
            'WhatsApp Enviado': 'contato',
            'Instagram Enviado': 'contato',
            'LinkedIn Enviado': 'contato',
            'Follow-Up': 'respondeu',
            'Interessado': 'respondeu',
            'Em Diagnóstico': 'proposta',
            'Proposta Enviada': 'proposta',
            'Agendado': 'proposta',
            'Lead Fechado': 'fechado',
          };
          
          let totalValue = 0;
          (leads || []).forEach((lead) => {
            const stage = statusToStage[lead.status || 'Novo'] || 'novo';
            if (byStage[stage]) {
              byStage[stage].count++;
              const value = lead.estimated_value || 0;
              byStage[stage].value += value;
              totalValue += value;
            }
          });
          
          const totalLeads = leads?.length || 0;
          const closedCount = byStage.fechado.count;
          
          const realStats: PipelineStatistics = {
            byStage: {
              novo: { count: byStage.novo.count, value: byStage.novo.value, conversionRate: totalLeads > 0 ? byStage.contato.count / totalLeads : 0 },
              contato: { count: byStage.contato.count, value: byStage.contato.value, conversionRate: byStage.contato.count > 0 ? byStage.respondeu.count / byStage.contato.count : 0 },
              respondeu: { count: byStage.respondeu.count, value: byStage.respondeu.value, conversionRate: byStage.respondeu.count > 0 ? byStage.proposta.count / byStage.respondeu.count : 0 },
              proposta: { count: byStage.proposta.count, value: byStage.proposta.value, conversionRate: byStage.proposta.count > 0 ? closedCount / byStage.proposta.count : 0 },
              fechado: { count: closedCount, value: byStage.fechado.value, conversionRate: 1.0 },
            },
            totalLeads,
            totalValue,
            conversionRate: totalLeads > 0 ? closedCount / totalLeads : 0,
            avgDealSize: closedCount > 0 ? byStage.fechado.value / closedCount : 0,
            winRate: totalLeads > 0 ? closedCount / totalLeads : 0,
          };
          
          set({ pipelineStats: realStats, pipelineLoading: false });
          logger.debug('Pipeline statistics loaded from Supabase', { totalLeads });
        } catch (error) {
          logger.error('Failed to load pipeline statistics', error as Error);
          set({ pipelineLoading: false });
        }
      },
      
      moveToNextStage: async (leadId: string) => {
        try {
          logger.info('Moving lead to next stage', { leadId });
          
          // TODO: Implement stage progression logic
          // For now, just log the action
          
          logger.info('Lead moved to next stage', { leadId });
        } catch (error) {
          logger.error('Failed to move lead to next stage', error as Error, { leadId });
          throw error;
        }
      },
      
      // ========================================================================
      // Activity Actions
      // ========================================================================
      
      createActivity: async (activity) => {
        try {
          const newActivity: CRMActivity = {
            ...activity,
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          
          logger.info('Creating activity', { activity: newActivity });
          
          // TODO: Integrate with Supabase
          
          set((state) => ({
            activities: [newActivity, ...state.activities],
            recentActivities: [newActivity, ...state.recentActivities].slice(0, 10),
          }));
          
          logger.info('Activity created successfully', { activityId: newActivity.id });
        } catch (error) {
          logger.error('Failed to create activity', error as Error, { activity });
          throw error;
        }
      },
      
      loadActivities: async (leadId?: string) => {
        try {
          set({ activitiesLoading: true });
          logger.debug('Loading activities', { leadId });
          
          // TODO: Integrate with Supabase
          
          set({ activitiesLoading: false });
          logger.debug('Activities loaded');
        } catch (error) {
          logger.error('Failed to load activities', error as Error, { leadId });
          set({ activitiesLoading: false });
          throw error;
        }
      },
      
      loadRecentActivities: async () => {
        try {
          logger.debug('Loading recent activities');
          
          // TODO: Integrate with Supabase
          
          logger.debug('Recent activities loaded');
        } catch (error) {
          logger.error('Failed to load recent activities', error as Error);
          throw error;
        }
      },
      
      // ========================================================================
      // Task Actions
      // ========================================================================
      
      createTask: async (task) => {
        try {
          const now = new Date().toISOString();
          const newTask: CRMTask = {
            ...task,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now,
          };
          
          logger.info('Creating task', { task: newTask });
          
          // TODO: Integrate with Supabase
          
          set((state) => {
            const tasksByLead = { ...state.tasksByLead };
            if (newTask.leadId) {
              tasksByLead[newTask.leadId] = [
                ...(tasksByLead[newTask.leadId] || []),
                newTask,
              ];
            }
            
            return {
              tasks: [newTask, ...state.tasks],
              tasksByLead,
            };
          });
          
          logger.info('Task created successfully', { taskId: newTask.id });
        } catch (error) {
          logger.error('Failed to create task', error as Error, { task });
          throw error;
        }
      },
      
      updateTask: async (taskId: string, updates: Partial<CRMTask>) => {
        try {
          logger.info('Updating task', { taskId, updates });
          
          // TODO: Integrate with Supabase
          
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
          }));
          
          logger.info('Task updated successfully', { taskId });
        } catch (error) {
          logger.error('Failed to update task', error as Error, { taskId, updates });
          throw error;
        }
      },
      
      completeTask: async (taskId: string) => {
        try {
          await get().updateTask(taskId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
        } catch (error) {
          logger.error('Failed to complete task', error as Error, { taskId });
          throw error;
        }
      },
      
      deleteTask: async (taskId: string) => {
        try {
          logger.info('Deleting task', { taskId });
          
          // TODO: Integrate with Supabase
          
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== taskId),
          }));
          
          logger.info('Task deleted successfully', { taskId });
        } catch (error) {
          logger.error('Failed to delete task', error as Error, { taskId });
          throw error;
        }
      },
      
      loadTasks: async (leadId?: string) => {
        try {
          set({ tasksLoading: true });
          logger.debug('Loading tasks', { leadId });
          
          // TODO: Integrate with Supabase
          
          set({ tasksLoading: false });
          logger.debug('Tasks loaded');
        } catch (error) {
          logger.error('Failed to load tasks', error as Error, { leadId });
          set({ tasksLoading: false });
          throw error;
        }
      },
      
      // ========================================================================
      // Notification Actions
      // ========================================================================
      
      addNotification: (notification) => {
        const newNotification: CRMNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
        
        logger.debug('Notification added', { notificationId: newNotification.id });
      },
      
      markNotificationRead: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          if (!notification || notification.read) return state;
          
          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
        
        logger.debug('Notification marked as read', { notificationId });
      },
      
      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        
        logger.debug('All notifications marked as read');
      },
      
      clearNotification: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
        
        logger.debug('Notification cleared', { notificationId });
      },
      
      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
        logger.debug('All notifications cleared');
      },
      
      // ========================================================================
      // UI Actions
      // ========================================================================
      
      setSelectedLead: (leadId: string | null) => {
        set({ selectedLeadId: leadId });
        logger.debug('Selected lead changed', { leadId });
      },
      
      setActiveView: (view) => {
        set({ activeView: view });
        logger.debug('Active view changed', { view });
      },
      
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
        logger.debug('Filters updated', { filters });
      },
      
      clearFilters: () => {
        set({ filters: {} });
        logger.debug('Filters cleared');
      },
      
      setSortOptions: (options) => {
        set({ sortOptions: options });
        logger.debug('Sort options updated', { options });
      },
      
      // ========================================================================
      // Utility Actions
      // ========================================================================
      
      reset: () => {
        set(initialState);
        logger.info('CRM store reset to initial state');
      },
    }),
    {
      name: 'crm-store',
      partialize: (state) => ({
        // Only persist UI state
        selectedLeadId: state.selectedLeadId,
        activeView: state.activeView,
        filters: state.filters,
        sortOptions: state.sortOptions,
      }),
    }
  )
);