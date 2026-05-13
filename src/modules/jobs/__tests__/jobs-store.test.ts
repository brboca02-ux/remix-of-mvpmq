// @ts-nocheck
/**
 * Jobs Store Unit Tests
 * 
 * Tests for the jobs-store module.
 * 
 * Task 25 - Phase 5: Testing Infrastructure
 * 
 * @module modules/jobs/__tests__/jobs-store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useJobsStore } from '../jobs-store';

describe('Jobs Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useJobsStore.getState().reset();
  });

  afterEach(() => {
    // Stop polling to prevent test leaks
    useJobsStore.getState().stopPolling();
  });

  describe('Initial State', () => {
    it('should have empty active jobs', () => {
      const state = useJobsStore.getState();
      expect(state.activeJobs).toEqual([]);
    });

    it('should have empty job history', () => {
      const state = useJobsStore.getState();
      expect(state.jobHistory).toEqual([]);
    });

    it('should not be polling initially', () => {
      const state = useJobsStore.getState();
      expect(state.isPolling).toBe(false);
    });

    it('should have default poll interval of 5000ms', () => {
      const state = useJobsStore.getState();
      expect(state.pollInterval).toBe(5000);
    });

    it('should have no selected job', () => {
      const state = useJobsStore.getState();
      expect(state.selectedJobId).toBeNull();
    });
  });

  describe('Job Creation', () => {
    it('should create a new job with unique ID', async () => {
      const payload = { type: 'test', data: {} };
      const job = await useJobsStore.getState().createJob(payload);

      expect(job.id).toBeDefined();
      expect(job.id).toContain('job_');
      expect(job.status).toBe('queued');
      expect(job.progress).toBe(0);
      expect(job.payload).toEqual(payload);
    });

    it('should add new job to active jobs list', async () => {
      const payload = { type: 'test', data: {} };
      await useJobsStore.getState().createJob(payload);

      const state = useJobsStore.getState();
      expect(state.activeJobs).toHaveLength(1);
      expect(state.activeJobs[0].status).toBe('queued');
    });

    it('should add new job to all jobs list', async () => {
      const payload = { type: 'test', data: {} };
      await useJobsStore.getState().createJob(payload);

      const state = useJobsStore.getState();
      expect(state.allJobs).toHaveLength(1);
    });

    it('should start polling after creating first job', async () => {
      const payload = { type: 'test', data: {} };
      await useJobsStore.getState().createJob(payload);

      const state = useJobsStore.getState();
      expect(state.isPolling).toBe(true);

      // Cleanup
      state.stopPolling();
    });

    it('should create jobs with different IDs', async () => {
      const job1 = await useJobsStore.getState().createJob({ type: 'test1', data: {} });
      const job2 = await useJobsStore.getState().createJob({ type: 'test2', data: {} });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('Job Cancellation', () => {
    it('should cancel an active job', async () => {
      const job = await useJobsStore.getState().createJob({ type: 'test', data: {} });
      await useJobsStore.getState().cancelJob(job.id);

      const state = useJobsStore.getState();
      const cancelledJob = state.allJobs.find((j) => j.id === job.id);

      expect(cancelledJob?.status).toBe('cancelled');
      expect(cancelledJob?.completedAt).toBeDefined();
    });

    it('should remove cancelled job from active jobs', async () => {
      const job = await useJobsStore.getState().createJob({ type: 'test', data: {} });
      await useJobsStore.getState().cancelJob(job.id);

      const state = useJobsStore.getState();
      expect(state.activeJobs.find((j) => j.id === job.id)).toBeUndefined();
    });
  });

  describe('Job Retrieval', () => {
    it('should return job by ID', async () => {
      const created = await useJobsStore.getState().createJob({ type: 'test', data: {} });
      const retrieved = useJobsStore.getState().getJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent job', () => {
      const retrieved = useJobsStore.getState().getJob('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('Job Retry', () => {
    it('should create new job when retrying', async () => {
      const original = await useJobsStore.getState().createJob({ type: 'test', data: { key: 'value' } });
      const retried = await useJobsStore.getState().retryJob(original.id);

      expect(retried.id).not.toBe(original.id);
      expect(retried.payload).toEqual(original.payload);
      expect(retried.status).toBe('queued');
    });

    it('should throw error when retrying non-existent job', async () => {
      await expect(
        useJobsStore.getState().retryJob('non-existent-id')
      ).rejects.toThrow('Job not found');
    });
  });

  describe('Job Deletion', () => {
    it('should delete job from all lists', async () => {
      const job = await useJobsStore.getState().createJob({ type: 'test', data: {} });
      await useJobsStore.getState().deleteJob(job.id);

      const state = useJobsStore.getState();
      expect(state.activeJobs.find((j) => j.id === job.id)).toBeUndefined();
      expect(state.jobHistory.find((j) => j.id === job.id)).toBeUndefined();
      expect(state.allJobs.find((j) => j.id === job.id)).toBeUndefined();
    });

    it('should clear selectedJobId if deleted job was selected', async () => {
      const job = await useJobsStore.getState().createJob({ type: 'test', data: {} });
      useJobsStore.getState().setSelectedJob(job.id);
      await useJobsStore.getState().deleteJob(job.id);

      const state = useJobsStore.getState();
      expect(state.selectedJobId).toBeNull();
    });
  });

  describe('UI Actions', () => {
    it('should set selected job', () => {
      useJobsStore.getState().setSelectedJob('job-123');
      expect(useJobsStore.getState().selectedJobId).toBe('job-123');
    });

    it('should clear selected job', () => {
      useJobsStore.getState().setSelectedJob('job-123');
      useJobsStore.getState().setSelectedJob(null);
      expect(useJobsStore.getState().selectedJobId).toBeNull();
    });

    it('should update filters', () => {
      useJobsStore.getState().setFilters({ type: ['lead_import'] });
      expect(useJobsStore.getState().filters.type).toEqual(['lead_import']);
    });

    it('should merge filters instead of replacing', () => {
      useJobsStore.getState().setFilters({ type: ['lead_import'] });
      useJobsStore.getState().setFilters({ status: ['running'] });

      const filters = useJobsStore.getState().filters;
      expect(filters.type).toEqual(['lead_import']);
      expect(filters.status).toEqual(['running']);
    });

    it('should clear all filters', () => {
      useJobsStore.getState().setFilters({ type: ['lead_import'], status: ['running'] });
      useJobsStore.getState().clearFilters();

      expect(useJobsStore.getState().filters).toEqual({});
    });

    it('should update sort options', () => {
      useJobsStore.getState().setSortOptions('status', 'asc');

      const state = useJobsStore.getState();
      expect(state.sortBy).toBe('status');
      expect(state.sortDirection).toBe('asc');
    });
  });

  describe('Polling', () => {
    it('should start polling', () => {
      useJobsStore.getState().startPolling(1000);

      const state = useJobsStore.getState();
      expect(state.isPolling).toBe(true);
      expect(state.pollInterval).toBe(1000);
      expect(state.pollTimerId).not.toBeNull();

      // Cleanup
      state.stopPolling();
    });

    it('should stop polling', () => {
      useJobsStore.getState().startPolling(1000);
      useJobsStore.getState().stopPolling();

      const state = useJobsStore.getState();
      expect(state.isPolling).toBe(false);
      expect(state.pollTimerId).toBeNull();
    });

    it('should not start duplicate polling', () => {
      useJobsStore.getState().startPolling(1000);
      const firstTimerId = useJobsStore.getState().pollTimerId;

      useJobsStore.getState().startPolling(1000);
      const secondTimerId = useJobsStore.getState().pollTimerId;

      expect(firstTimerId).toBe(secondTimerId);

      // Cleanup
      useJobsStore.getState().stopPolling();
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', async () => {
      // Modify state
      await useJobsStore.getState().createJob({ type: 'test', data: {} });
      useJobsStore.getState().setSelectedJob('job-123');
      useJobsStore.getState().setFilters({ type: ['lead_import'] });

      // Reset
      useJobsStore.getState().reset();

      const state = useJobsStore.getState();
      expect(state.activeJobs).toEqual([]);
      expect(state.jobHistory).toEqual([]);
      expect(state.allJobs).toEqual([]);
      expect(state.selectedJobId).toBeNull();
      expect(state.filters).toEqual({});
      expect(state.isPolling).toBe(false);
    });
  });
});