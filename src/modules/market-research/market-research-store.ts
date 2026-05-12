/**
 * Market Research Store
 * 
 * Manages market research state including current research, history, and saved reports.
 * 
 * Task 19.3 - Phase 4: Store Refactoring
 * 
 * @module modules/market-research/market-research-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketResearchReport } from '@/types/market-research';
import type { ResearchContext } from './types';
import { logger } from '@/lib/logger';

interface MarketResearchState {
  // ============================================================================
  // Research State
  // ============================================================================
  
  /** Current active research */
  currentResearch: MarketResearchReport | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  // ============================================================================
  // History State
  // ============================================================================
  
  /** Research history (all past researches) */
  history: MarketResearchReport[];
  
  /** Saved/bookmarked reports */
  savedReports: MarketResearchReport[];
  
  // ============================================================================
  // UI State
  // ============================================================================
  
  /** Current filters */
  filters: {
    dateRange?: { from: string; to: string };
    topics?: string[];
    confidence?: string[];
  };
  
  /** Search query for history */
  searchQuery: string;
  
  /** Active tab */
  activeTab: 'research' | 'history' | 'saved';
  
  // ============================================================================
  // Research Actions
  // ============================================================================
  
  /**
   * Perform market research
   */
  performResearch: (input: string, context?: ResearchContext) => Promise<void>;
  
  /**
   * Cancel current research
   */
  cancelResearch: () => void;
  
  /**
   * Retry failed research
   */
  retryResearch: () => Promise<void>;
  
  // ============================================================================
  // History Actions
  // ============================================================================
  
  /**
   * Load research history
   */
  loadHistory: () => Promise<void>;
  
  /**
   * Get research by ID
   */
  getResearchById: (id: string) => MarketResearchReport | null;
  
  /**
   * Delete research from history
   */
  deleteResearch: (id: string) => Promise<void>;
  
  /**
   * Clear all history
   */
  clearHistory: () => Promise<void>;
  
  // ============================================================================
  // Saved Reports Actions
  // ============================================================================
  
  /**
   * Save/bookmark a report
   */
  saveReport: (report: MarketResearchReport) => void;
  
  /**
   * Unsave/unbookmark a report
   */
  unsaveReport: (id: string) => void;
  
  /**
   * Check if report is saved
   */
  isReportSaved: (id: string) => boolean;
  
  // ============================================================================
  // Filter Actions
  // ============================================================================
  
  /**
   * Set filters
   */
  setFilters: (filters: Partial<MarketResearchState['filters']>) => void;
  
  /**
   * Clear filters
   */
  clearFilters: () => void;
  
  /**
   * Set search query
   */
  setSearchQuery: (query: string) => void;
  
  // ============================================================================
  // UI Actions
  // ============================================================================
  
  /**
   * Set active tab
   */
  setActiveTab: (tab: 'research' | 'history' | 'saved') => void;
  
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
  // Research
  currentResearch: null,
  isLoading: false,
  error: null,
  
  // History
  history: [],
  savedReports: [],
  
  // UI
  filters: {},
  searchQuery: '',
  activeTab: 'research' as const,
};

/**
 * Market Research Store
 */
export const useMarketResearchStore = create<MarketResearchState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========================================================================
      // Research Actions
      // ========================================================================
      
      performResearch: async (input: string, context?: ResearchContext) => {
        try {
          set({ isLoading: true, error: null });
          logger.info('Starting market research', { input, context });
          
          // TODO: Integrate with actual research API
          // For now, create a mock report
          const mockReport: MarketResearchReport = {
            id: `research_${Date.now()}`,
            input,
            synthesis: `Análise de mercado para: ${input}`,
            insights: {
              competitors: [],
              opportunities: [],
              risks: [],
              marketHypothesis: [],
              audienceQuestions: [],
            },
            trendSignal: 'stable',
            confidence: 'medium',
            sources: [],
            charts: [],
            createdAt: new Date().toISOString(),
          };
          
          set((state) => ({
            currentResearch: mockReport,
            history: [mockReport, ...state.history],
            isLoading: false,
          }));
          
          logger.info('Market research completed', { reportId: mockReport.id });
        } catch (error) {
          logger.error('Market research failed', error as Error, { input });
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          throw error;
        }
      },
      
      cancelResearch: () => {
        set({ isLoading: false, error: 'Pesquisa cancelada pelo usuário' });
        logger.info('Market research cancelled');
      },
      
      retryResearch: async () => {
        const { currentResearch } = get();
        if (!currentResearch) {
          logger.warn('No research to retry');
          return;
        }
        
        await get().performResearch(currentResearch.input);
      },
      
      // ========================================================================
      // History Actions
      // ========================================================================
      
      loadHistory: async () => {
        try {
          logger.debug('Loading research history');
          
          // TODO: Integrate with Supabase or localStorage
          // For now, history is already in state from persistence
          
          logger.debug('Research history loaded', { count: get().history.length });
        } catch (error) {
          logger.error('Failed to load research history', error as Error);
          throw error;
        }
      },
      
      getResearchById: (id: string) => {
        const research = get().history.find((r) => r.id === id);
        if (!research) {
          logger.warn('Research not found', { id });
        }
        return research || null;
      },
      
      deleteResearch: async (id: string) => {
        try {
          logger.info('Deleting research', { id });
          
          set((state) => ({
            history: state.history.filter((r) => r.id !== id),
            savedReports: state.savedReports.filter((r) => r.id !== id),
            currentResearch: state.currentResearch?.id === id ? null : state.currentResearch,
          }));
          
          logger.info('Research deleted', { id });
        } catch (error) {
          logger.error('Failed to delete research', error as Error, { id });
          throw error;
        }
      },
      
      clearHistory: async () => {
        try {
          logger.info('Clearing research history');
          
          set({
            history: [],
            currentResearch: null,
          });
          
          logger.info('Research history cleared');
        } catch (error) {
          logger.error('Failed to clear research history', error as Error);
          throw error;
        }
      },
      
      // ========================================================================
      // Saved Reports Actions
      // ========================================================================
      
      saveReport: (report: MarketResearchReport) => {
        set((state) => {
          // Check if already saved
          if (state.savedReports.some((r) => r.id === report.id)) {
            logger.debug('Report already saved', { reportId: report.id });
            return state;
          }
          
          return {
            savedReports: [report, ...state.savedReports],
          };
        });
        
        logger.info('Report saved', { reportId: report.id });
      },
      
      unsaveReport: (id: string) => {
        set((state) => ({
          savedReports: state.savedReports.filter((r) => r.id !== id),
        }));
        
        logger.info('Report unsaved', { reportId: id });
      },
      
      isReportSaved: (id: string) => {
        return get().savedReports.some((r) => r.id === id);
      },
      
      // ========================================================================
      // Filter Actions
      // ========================================================================
      
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
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        logger.debug('Search query updated', { query });
      },
      
      // ========================================================================
      // UI Actions
      // ========================================================================
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
        logger.debug('Active tab changed', { tab });
      },
      
      // ========================================================================
      // Utility Actions
      // ========================================================================
      
      reset: () => {
        set(initialState);
        logger.info('Market research store reset to initial state');
      },
    }),
    {
      name: 'market-research-store',
      partialize: (state) => ({
        // Persist everything except loading/error states
        history: state.history,
        savedReports: state.savedReports,
        filters: state.filters,
        searchQuery: state.searchQuery,
        activeTab: state.activeTab,
      }),
    }
  )
);

/**
 * Selectors for optimized component rendering
 */
export const selectCurrentResearch = (state: MarketResearchState): MarketResearchReport | null =>
  state.currentResearch;

export const selectIsLoading = (state: MarketResearchState): boolean => state.isLoading;

export const selectError = (state: MarketResearchState): string | null => state.error;

export const selectHistory = (state: MarketResearchState): MarketResearchReport[] => state.history;

export const selectSavedReports = (state: MarketResearchState): MarketResearchReport[] =>
  state.savedReports;

export const selectFilteredHistory = (state: MarketResearchState): MarketResearchReport[] => {
  let filtered = state.history;
  
  // Apply search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.input.toLowerCase().includes(query) ||
        r.synthesis.toLowerCase().includes(query)
    );
  }
  
  // Apply date range filter
  if (state.filters.dateRange) {
    const { from, to } = state.filters.dateRange;
    filtered = filtered.filter((r) => {
      const date = new Date(r.createdAt);
      return date >= new Date(from) && date <= new Date(to);
    });
  }
  
  // Apply topics filter
  if (state.filters.topics && state.filters.topics.length > 0) {
    filtered = filtered.filter((r) =>
      state.filters.topics!.some((topic) =>
        r.input.toLowerCase().includes(topic.toLowerCase())
      )
    );
  }
  
  // Apply confidence filter
  if (state.filters.confidence && state.filters.confidence.length > 0) {
    filtered = filtered.filter((r) => state.filters.confidence!.includes(r.confidence));
  }
  
  return filtered;
};
