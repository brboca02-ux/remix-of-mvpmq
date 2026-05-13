/**
 * CRM Store Unit Tests
 * 
 * Tests for the crm-store module.
 * 
 * Task 25 - Phase 5: Testing Infrastructure
 * 
 * @module modules/crm/__tests__/crm-store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCRMStore } from '../crm-store';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { status: 'Novo', confidence_score: 80, estimated_value: 1000 },
          { status: 'Lead Fechado', confidence_score: 100, estimated_value: 5000 }
        ],
        error: null
      })
    }))
  }
}));

describe('CRM Store', () => {
  beforeEach(() => {
    useCRMStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have null pipeline stats', () => {
      expect(useCRMStore.getState().pipelineStats).toBeNull();
    });

    it('should not be loading initially', () => {
      expect(useCRMStore.getState().pipelineLoading).toBe(false);
      expect(useCRMStore.getState().tasksLoading).toBe(false);
      expect(useCRMStore.getState().activitiesLoading).toBe(false);
    });

    it('should have empty activities', () => {
      expect(useCRMStore.getState().activities).toEqual([]);
      expect(useCRMStore.getState().recentActivities).toEqual([]);
    });

    it('should have empty tasks', () => {
      expect(useCRMStore.getState().tasks).toEqual([]);
      expect(useCRMStore.getState().tasksByLead).toEqual({});
    });

    it('should have empty notifications', () => {
      expect(useCRMStore.getState().notifications).toEqual([]);
      expect(useCRMStore.getState().unreadCount).toBe(0);
    });

    it('should have default active view as pipeline', () => {
      expect(useCRMStore.getState().activeView).toBe('pipeline');
    });
  });

  describe('Activity Actions', () => {
    it('should create an activity', async () => {
      await useCRMStore.getState().createActivity({
        leadId: 'lead-123',
        type: 'call',
        title: 'Test activity',
        description: 'Test description',
      });

      const state = useCRMStore.getState();
      expect(state.activities).toHaveLength(1);
      expect(state.activities[0].leadId).toBe('lead-123');
      expect(state.activities[0].type).toBe('call');
      expect(state.activities[0].id).toBeDefined();
      expect(state.activities[0].timestamp).toBeDefined();
    });

    it('should add activity to recent activities', async () => {
      await useCRMStore.getState().createActivity({
        leadId: 'lead-123',
        type: 'email',
        title: 'Email sent',
      });

      const state = useCRMStore.getState();
      expect(state.recentActivities).toHaveLength(1);
    });

    it('should limit recent activities to 10', async () => {
      for (let i = 0; i < 15; i++) {
        await useCRMStore.getState().createActivity({
          leadId: `lead-${i}`,
          type: 'call',
          title: `Activity ${i}`,
        });
      }

      const state = useCRMStore.getState();
      expect(state.recentActivities).toHaveLength(10);
      expect(state.activities).toHaveLength(15);
    });
  });

  describe('Task Actions', () => {
    it('should create a task', async () => {
      await useCRMStore.getState().createTask({
        leadId: 'lead-123',
        title: 'Follow up',
        type: 'whatsapp',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      });

      const state = useCRMStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Follow up');
      expect(state.tasksByLead['lead-123']).toHaveLength(1);
    });

    it('should update a task', async () => {
      await useCRMStore.getState().createTask({
        leadId: 'lead-123',
        title: 'Original title',
        type: 'call',
        priority: 'low',
        status: 'pending',
        dueDate: new Date().toISOString(),
      });

      const taskId = useCRMStore.getState().tasks[0].id;
      await useCRMStore.getState().updateTask(taskId, { 
        title: 'Updated title',
        priority: 'high',
      });

      const task = useCRMStore.getState().tasks.find((t) => t.id === taskId);
      expect(task?.title).toBe('Updated title');
      expect(task?.priority).toBe('high');
    });

    it('should complete a task', async () => {
      await useCRMStore.getState().createTask({
        leadId: 'lead-123',
        title: 'Test task',
        type: 'call',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date().toISOString(),
      });

      const taskId = useCRMStore.getState().tasks[0].id;
      await useCRMStore.getState().completeTask(taskId);

      const task = useCRMStore.getState().tasks.find((t) => t.id === taskId);
      expect(task?.status).toBe('completed');
      expect(task?.completedAt).toBeDefined();
    });

    it('should delete a task', async () => {
      await useCRMStore.getState().createTask({
        leadId: 'lead-123',
        title: 'Test task',
        type: 'call',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date().toISOString(),
      });

      const taskId = useCRMStore.getState().tasks[0].id;
      await useCRMStore.getState().deleteTask(taskId);

      expect(useCRMStore.getState().tasks).toHaveLength(0);
    });
  });

  describe('Notification Actions', () => {
    it('should add a notification', () => {
      useCRMStore.getState().addNotification({
        type: 'followup_due',
        title: 'Follow-up due',
        message: 'Follow-up is due now',
        priority: 'high',
      });

      const state = useCRMStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
      expect(state.notifications[0].read).toBe(false);
    });

    it('should mark notification as read', () => {
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert',
        message: 'Alert message',
        priority: 'medium',
      });

      const notificationId = useCRMStore.getState().notifications[0].id;
      useCRMStore.getState().markNotificationRead(notificationId);

      const state = useCRMStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should not decrease unread count when marking already read notification', () => {
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert',
        message: 'Alert message',
        priority: 'medium',
      });

      const notificationId = useCRMStore.getState().notifications[0].id;
      useCRMStore.getState().markNotificationRead(notificationId);
      useCRMStore.getState().markNotificationRead(notificationId);

      expect(useCRMStore.getState().unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert 1',
        message: 'Message 1',
        priority: 'low',
      });
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert 2',
        message: 'Message 2',
        priority: 'low',
      });

      useCRMStore.getState().markAllNotificationsRead();

      const state = useCRMStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications.every((n) => n.read)).toBe(true);
    });

    it('should clear a notification', () => {
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert',
        message: 'Message',
        priority: 'medium',
      });

      const notificationId = useCRMStore.getState().notifications[0].id;
      useCRMStore.getState().clearNotification(notificationId);

      const state = useCRMStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });

    it('should clear all notifications', () => {
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert 1',
        message: 'Message 1',
        priority: 'low',
      });
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert 2',
        message: 'Message 2',
        priority: 'low',
      });

      useCRMStore.getState().clearAllNotifications();

      const state = useCRMStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('UI Actions', () => {
    it('should set selected lead', () => {
      useCRMStore.getState().setSelectedLead('lead-123');
      expect(useCRMStore.getState().selectedLeadId).toBe('lead-123');
    });

    it('should clear selected lead', () => {
      useCRMStore.getState().setSelectedLead('lead-123');
      useCRMStore.getState().setSelectedLead(null);
      expect(useCRMStore.getState().selectedLeadId).toBeNull();
    });

    it('should change active view', () => {
      useCRMStore.getState().setActiveView('calendar');
      expect(useCRMStore.getState().activeView).toBe('calendar');

      useCRMStore.getState().setActiveView('tasks');
      expect(useCRMStore.getState().activeView).toBe('tasks');
    });

    it('should set filters', () => {
      useCRMStore.getState().setFilters({
        pipelineStage: ['novo'],
        city: ['São Paulo'],
      });

      const filters = useCRMStore.getState().filters;
      expect(filters.pipelineStage).toEqual(['novo']);
      expect(filters.city).toEqual(['São Paulo']);
    });

    it('should merge filters', () => {
      useCRMStore.getState().setFilters({ pipelineStage: ['novo'] });
      useCRMStore.getState().setFilters({ city: ['São Paulo'] });

      const filters = useCRMStore.getState().filters;
      expect(filters.pipelineStage).toEqual(['novo']);
      expect(filters.city).toEqual(['São Paulo']);
    });

    it('should clear filters', () => {
      useCRMStore.getState().setFilters({
        pipelineStage: ['novo'],
        city: ['São Paulo'],
      });
      useCRMStore.getState().clearFilters();

      expect(useCRMStore.getState().filters).toEqual({});
    });

    it('should update sort options', () => {
      useCRMStore.getState().setSortOptions({
        field: 'opportunityScore',
        direction: 'desc',
      });

      const sortOptions = useCRMStore.getState().sortOptions;
      expect(sortOptions.field).toBe('opportunityScore');
      expect(sortOptions.direction).toBe('desc');
    });
  });

  describe('Pipeline Stats', () => {
    it('should load pipeline stats', async () => {
      await useCRMStore.getState().loadPipelineStats();

      const state = useCRMStore.getState();
      expect(state.pipelineStats).not.toBeNull();
      expect(state.pipelineStats?.totalLeads).toBeGreaterThan(0);
      expect(state.pipelineLoading).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', async () => {
      // Modify state
      await useCRMStore.getState().createActivity({
        leadId: 'lead-123',
        type: 'call',
        title: 'Test',
      });
      useCRMStore.getState().addNotification({
        type: 'alert',
        title: 'Alert',
        message: 'Message',
        priority: 'low',
      });
      useCRMStore.getState().setSelectedLead('lead-123');
      useCRMStore.getState().setActiveView('calendar');

      // Reset
      useCRMStore.getState().reset();

      const state = useCRMStore.getState();
      expect(state.activities).toEqual([]);
      expect(state.notifications).toEqual([]);
      expect(state.selectedLeadId).toBeNull();
      expect(state.activeView).toBe('pipeline');
      expect(state.unreadCount).toBe(0);
    });
  });
});
