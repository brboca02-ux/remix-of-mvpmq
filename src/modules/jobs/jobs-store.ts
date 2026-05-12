/**
 * Jobs Store
 * 
 * Manages background jobs state including active jobs, history, and polling.
 * 
 * Task 19.4 - Phase 4: Store Refactoring
 * 
 * @module modules/jobs/jobs-store
 */

import { create } from 'zustand';
import type { Job, JobPayload, JobStatus } from '@/types/jobs';
import { logger } from '@/lib/logger';

interface JobsState {
  // ============================================================================
  // Jobs State
  // ============================================================================
  
  /** Active jobs (queued, running) */
  activeJobs: Job[];
  
  /** Job history (completed, failed, cancelled) */
  jobHistory: Job[];
  
  /** All jobs (active + history) */
  allJobs: Job[];
  
  /** Loading state */
  isLoading: boolean;
  
  // ============================================================================
  // Polling State
  // ============================================================================
  
  /** Whether polling is active */
  isPolling: boolean;
  
  /** Polling interval in milliseconds */
  pollInterval: number;
  
  /** Polling timer ID */
  pollTimerId: NodeJS.Timeout | null;
  
  // ============================================================================
  // UI State
  // ============================================================================
  
  /** Currently selected job ID */
  selectedJobId: string | null;
  
  /** Filters */
  filters: {
    type?: string[];
    status?: JobStatus[];
    dateRange?: { from: string; to: string };
  };
  
  /** Sort options */
  sortBy: 'createdAt' | 'updatedAt' | 'status';
  sortDirection: 'asc' | 'desc';
  
  // ============================================================================
  // Job Actions
  // ============================================================================
  
  /**
   * Create a new job
   */
  createJob: (payload: JobPayload) => Promise<Job>;
  
  /**
   * Get job by ID
   */
  getJob: (id: string) => Job | null;
  
  /**
   * Cancel a job
   */
  cancelJob: (id: string) => Promise<void>;
  
  /**
   * Retry a failed job
   */
  retryJob: (id: string) => Promise<Job>;
  
  /**
   * Delete a job from history
   */
  deleteJob: (id: string) => Promise<void>;
  
  /**
   * Clear completed jobs
   */
  clearCompletedJobs: () => Promise<void>;
  
  // ============================================================================
  // Loading Actions
  // ============================================================================
  
  /**
   * Load active jobs
   */
  loadActiveJobs: () => Promise<void>;
  
  /**
   * Load job history
   */
  loadHistory: (limit?: number) => Promise<void>;
  
  /**
   * Refresh job status
   */
  refreshJob: (id: string) => Promise<void>;
  
  // ============================================================================
  // Polling Actions
  // ============================================================================
  
  /**
   * Start polling for job updates
   */
  startPolling: (interval?: number) => void;
  
  /**
   * Stop polling
   */
  stopPolling: () => void;
  
  /**
   * Poll once (manual refresh)
   */
  pollOnce: () => Promise<void>;
  
  // ============================================================================
  // UI Actions
  // ============================================================================
  
  /**
   * Set selected job
   */
  setSelectedJob: (jobId: string | null) => void;
  
  /**
   * Set filters
   */
  setFilters: (filters: Partial<JobsState['filters']>) => void;
  
  /**
   * Clear filters
   */
  clearFilters: () => void;
  
  /**
   * Set sort options
   */
  setSortOptions: (sortBy: JobsState['sortBy'], sortDirection: JobsState['sortDirection']) => void;
  
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
  // Jobs
  activeJobs: [],
  jobHistory: [],
  allJobs: [],
  isLoading: false,
  
  // Polling
  isPolling: false,
  pollInterval: 5000, // 5 seconds
  pollTimerId: null,
  
  // UI
  selectedJobId: null,
  filters: {},
  sortBy: 'createdAt' as const,
  sortDirection: 'desc' as const,
};

/**
 * Jobs Store
 */
export const useJobsStore = create<JobsState>()((set, get) => ({
  ...initialState,
  
  // ==========================================================================
  // Job Actions
  // ==========================================================================
  
  createJob: async (payload: JobPayload) => {
    try {
      logger.info('Creating job', { payload });
      
      // TODO: Integrate with actual job creation API
      const newJob: Job = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: payload.type,
        status: 'queued',
        payload,
        result: null,
        error: null,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      };
      
      set((state) => ({
        activeJobs: [newJob, ...state.activeJobs],
        allJobs: [newJob, ...state.allJobs],
      }));
      
      logger.info('Job created', { jobId: newJob.id });
      
      // Start polling if not already polling
      if (!get().isPolling) {
        get().startPolling();
      }
      
      return newJob;
    } catch (error) {
      logger.error('Failed to create job', error as Error, { payload });
      throw error;
    }
  },
  
  getJob: (id: string) => {
    const job = get().allJobs.find((j) => j.id === id);
    if (!job) {
      logger.warn('Job not found', { id });
    }
    return job || null;
  },
  
  cancelJob: async (id: string) => {
    try {
      logger.info('Cancelling job', { id });
      
      // TODO: Integrate with actual job cancellation API
      
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.id !== id),
        allJobs: state.allJobs.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'cancelled' as JobStatus,
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              }
            : j
        ),
      }));
      
      logger.info('Job cancelled', { id });
    } catch (error) {
      logger.error('Failed to cancel job', error as Error, { id });
      throw error;
    }
  },
  
  retryJob: async (id: string) => {
    try {
      const job = get().getJob(id);
      if (!job) {
        throw new Error('Job not found');
      }
      
      logger.info('Retrying job', { id });
      
      // Create a new job with the same payload
      return await get().createJob(job.payload);
    } catch (error) {
      logger.error('Failed to retry job', error as Error, { id });
      throw error;
    }
  },
  
  deleteJob: async (id: string) => {
    try {
      logger.info('Deleting job', { id });
      
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.id !== id),
        jobHistory: state.jobHistory.filter((j) => j.id !== id),
        allJobs: state.allJobs.filter((j) => j.id !== id),
        selectedJobId: state.selectedJobId === id ? null : state.selectedJobId,
      }));
      
      logger.info('Job deleted', { id });
    } catch (error) {
      logger.error('Failed to delete job', error as Error, { id });
      throw error;
    }
  },
  
  clearCompletedJobs: async () => {
    try {
      logger.info('Clearing completed jobs');
      
      set((state) => ({
        jobHistory: state.jobHistory.filter((j) => j.status !== 'completed'),
        allJobs: state.allJobs.filter((j) => j.status !== 'completed'),
      }));
      
      logger.info('Completed jobs cleared');
    } catch (error) {
      logger.error('Failed to clear completed jobs', error as Error);
      throw error;
    }
  },
  
  // ==========================================================================
  // Loading Actions
  // ==========================================================================
  
  loadActiveJobs: async () => {
    try {
      set({ isLoading: true });
      logger.debug('Loading active jobs');
      
      // TODO: Integrate with actual API
      
      set({ isLoading: false });
      logger.debug('Active jobs loaded', { count: get().activeJobs.length });
    } catch (error) {
      logger.error('Failed to load active jobs', error as Error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  loadHistory: async (limit = 50) => {
    try {
      set({ isLoading: true });
      logger.debug('Loading job history', { limit });
      
      // TODO: Integrate with actual API
      
      set({ isLoading: false });
      logger.debug('Job history loaded', { count: get().jobHistory.length });
    } catch (error) {
      logger.error('Failed to load job history', error as Error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  refreshJob: async (id: string) => {
    try {
      logger.debug('Refreshing job', { id });
      
      // TODO: Integrate with actual API to fetch latest job status
      
      logger.debug('Job refreshed', { id });
    } catch (error) {
      logger.error('Failed to refresh job', error as Error, { id });
      throw error;
    }
  },
  
  // ==========================================================================
  // Polling Actions
  // ==========================================================================
  
  startPolling: (interval?: number) => {
    const { isPolling, pollTimerId } = get();
    
    // Don't start if already polling
    if (isPolling && pollTimerId) {
      logger.debug('Polling already active');
      return;
    }
    
    const pollIntervalMs = interval || get().pollInterval;
    
    logger.info('Starting job polling', { interval: pollIntervalMs });
    
    const timerId = setInterval(() => {
      void get().pollOnce();
    }, pollIntervalMs);
    
    set({
      isPolling: true,
      pollTimerId: timerId,
      pollInterval: pollIntervalMs,
    });
  },
  
  stopPolling: () => {
    const { pollTimerId } = get();
    
    if (pollTimerId) {
      clearInterval(pollTimerId);
      logger.info('Job polling stopped');
    }
    
    set({
      isPolling: false,
      pollTimerId: null,
    });
  },
  
  pollOnce: async () => {
    try {
      const { activeJobs } = get();
      
      if (activeJobs.length === 0) {
        // No active jobs, stop polling
        get().stopPolling();
        return;
      }
      
      logger.debug('Polling for job updates', { activeJobCount: activeJobs.length });
      
      // TODO: Integrate with actual API to fetch job statuses
      
      // For now, simulate job completion
      set((state) => {
        const now = new Date().toISOString();
        const updatedJobs = state.allJobs.map((job) => {
          // Simulate random job completion
          if (job.status === 'running' && Math.random() > 0.7) {
            return {
              ...job,
              status: 'completed' as JobStatus,
              progress: 100,
              updatedAt: now,
              completedAt: now,
            };
          }
          
          // Simulate job starting
          if (job.status === 'queued' && Math.random() > 0.5) {
            return {
              ...job,
              status: 'running' as JobStatus,
              progress: 10,
              updatedAt: now,
              startedAt: now,
            };
          }
          
          return job;
        });
        
        const activeJobs = updatedJobs.filter((j) =>
          ['queued', 'running'].includes(j.status)
        );
        const jobHistory = updatedJobs.filter((j) =>
          ['completed', 'failed', 'cancelled'].includes(j.status)
        );
        
        return {
          allJobs: updatedJobs,
          activeJobs,
          jobHistory,
        };
      });
    } catch (error) {
      logger.error('Polling failed', error as Error);
    }
  },
  
  // ==========================================================================
  // UI Actions
  // ==========================================================================
  
  setSelectedJob: (jobId: string | null) => {
    set({ selectedJobId: jobId });
    logger.debug('Selected job changed', { jobId });
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
  
  setSortOptions: (sortBy, sortDirection) => {
    set({ sortBy, sortDirection });
    logger.debug('Sort options updated', { sortBy, sortDirection });
  },
  
  // ==========================================================================
  // Utility Actions
  // ==========================================================================
  
  reset: () => {
    // Stop polling before reset
    get().stopPolling();
    
    set(initialState);
    logger.info('Jobs store reset to initial state');
  },
}));

/**
 * Selectors for optimized component rendering
 */
export const selectActiveJobs = (state: JobsState): Job[] => state.activeJobs;

export const selectJobHistory = (state: JobsState): Job[] => state.jobHistory;

export const selectIsLoading = (state: JobsState): boolean => state.isLoading;

export const selectIsPolling = (state: JobsState): boolean => state.isPolling;

export const selectFilteredJobs = (state: JobsState): Job[] => {
  let filtered = state.allJobs;
  
  // Apply type filter
  if (state.filters.type && state.filters.type.length > 0) {
    filtered = filtered.filter((j) => state.filters.type!.includes(j.type));
  }
  
  // Apply status filter
  if (state.filters.status && state.filters.status.length > 0) {
    filtered = filtered.filter((j) => state.filters.status!.includes(j.status));
  }
  
  // Apply date range filter
  if (state.filters.dateRange) {
    const { from, to } = state.filters.dateRange;
    filtered = filtered.filter((j) => {
      const date = new Date(j.createdAt);
      return date >= new Date(from) && date <= new Date(to);
    });
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = a[state.sortBy];
    const bValue = b[state.sortBy];
    
    if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  return filtered;
};

/**
 * Cleanup function to stop polling when store is unmounted
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useJobsStore.getState().stopPolling();
  });
}
