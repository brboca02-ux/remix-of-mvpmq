// @ts-nocheck
/**
 * Market Research Store Unit Tests
 * 
 * Tests for the market-research-store module.
 * 
 * Task 25 - Phase 5: Testing Infrastructure
 * 
 * @module modules/market-research/__tests__/market-research-store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketResearchStore, selectFilteredHistory } from '../market-research-store';
import type { MarketResearchReport } from '@/types/market-research';

const createMockReport = (overrides?: Partial<MarketResearchReport>): MarketResearchReport => ({
  id: `report_${Date.now()}_${Math.random()}`,
  input: 'Test market research query',
  synthesis: 'Test synthesis',
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
  ...overrides,
});

describe('Market Research Store', () => {
  beforeEach(() => {
    useMarketResearchStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have no current research', () => {
      const state = useMarketResearchStore.getState();
      expect(state.currentResearch).toBeNull();
    });

    it('should not be loading initially', () => {
      const state = useMarketResearchStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error', () => {
      const state = useMarketResearchStore.getState();
      expect(state.error).toBeNull();
    });

    it('should have empty history', () => {
      const state = useMarketResearchStore.getState();
      expect(state.history).toEqual([]);
    });

    it('should have empty saved reports', () => {
      const state = useMarketResearchStore.getState();
      expect(state.savedReports).toEqual([]);
    });

    it('should have default active tab as research', () => {
      const state = useMarketResearchStore.getState();
      expect(state.activeTab).toBe('research');
    });
  });

  describe('Research Execution', () => {
    it('should perform research and add to history', async () => {
      await useMarketResearchStore.getState().performResearch('Test query');

      const state = useMarketResearchStore.getState();
      expect(state.currentResearch).not.toBeNull();
      expect(state.currentResearch?.input).toBe('Test query');
      expect(state.history).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });

    it('should cancel research', () => {
      useMarketResearchStore.getState().cancelResearch();

      const state = useMarketResearchStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Pesquisa cancelada pelo usuário');
    });

    it('should retry failed research', async () => {
      // First perform a research
      await useMarketResearchStore.getState().performResearch('Test query');
      const firstId = useMarketResearchStore.getState().currentResearch?.id;

      // Then retry
      await useMarketResearchStore.getState().retryResearch();
      const secondId = useMarketResearchStore.getState().currentResearch?.id;

      // Should create a new research with same input
      expect(useMarketResearchStore.getState().currentResearch?.input).toBe('Test query');
    });
  });

  describe('History Management', () => {
    it('should get research by ID', async () => {
      await useMarketResearchStore.getState().performResearch('Test query');
      const research = useMarketResearchStore.getState().currentResearch;

      const retrieved = useMarketResearchStore.getState().getResearchById(research!.id);
      expect(retrieved).toEqual(research);
    });

    it('should return null for non-existent research', () => {
      const retrieved = useMarketResearchStore.getState().getResearchById('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should delete research from history', async () => {
      await useMarketResearchStore.getState().performResearch('Test query');
      const research = useMarketResearchStore.getState().currentResearch!;

      await useMarketResearchStore.getState().deleteResearch(research.id);

      const state = useMarketResearchStore.getState();
      expect(state.history.find((r) => r.id === research.id)).toBeUndefined();
      expect(state.currentResearch).toBeNull();
    });

    it('should clear all history', async () => {
      await useMarketResearchStore.getState().performResearch('Query 1');
      await useMarketResearchStore.getState().performResearch('Query 2');

      await useMarketResearchStore.getState().clearHistory();

      const state = useMarketResearchStore.getState();
      expect(state.history).toEqual([]);
      expect(state.currentResearch).toBeNull();
    });
  });

  describe('Saved Reports', () => {
    it('should save a report', () => {
      const report = createMockReport();
      useMarketResearchStore.getState().saveReport(report);

      const state = useMarketResearchStore.getState();
      expect(state.savedReports).toHaveLength(1);
      expect(state.savedReports[0].id).toBe(report.id);
    });

    it('should not save the same report twice', () => {
      const report = createMockReport();
      useMarketResearchStore.getState().saveReport(report);
      useMarketResearchStore.getState().saveReport(report);

      const state = useMarketResearchStore.getState();
      expect(state.savedReports).toHaveLength(1);
    });

    it('should unsave a report', () => {
      const report = createMockReport();
      useMarketResearchStore.getState().saveReport(report);
      useMarketResearchStore.getState().unsaveReport(report.id);

      const state = useMarketResearchStore.getState();
      expect(state.savedReports).toHaveLength(0);
    });

    it('should check if report is saved', () => {
      const report = createMockReport();
      expect(useMarketResearchStore.getState().isReportSaved(report.id)).toBe(false);

      useMarketResearchStore.getState().saveReport(report);
      expect(useMarketResearchStore.getState().isReportSaved(report.id)).toBe(true);
    });
  });

  describe('Filters', () => {
    it('should set filters', () => {
      useMarketResearchStore.getState().setFilters({
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      });

      const state = useMarketResearchStore.getState();
      expect(state.filters.dateRange).toEqual({ from: '2024-01-01', to: '2024-12-31' });
    });

    it('should merge filters instead of replacing', () => {
      useMarketResearchStore.getState().setFilters({
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      });
      useMarketResearchStore.getState().setFilters({
        topics: ['energia solar'],
      });

      const filters = useMarketResearchStore.getState().filters;
      expect(filters.dateRange).toBeDefined();
      expect(filters.topics).toEqual(['energia solar']);
    });

    it('should clear filters', () => {
      useMarketResearchStore.getState().setFilters({
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
        topics: ['energia solar'],
      });
      useMarketResearchStore.getState().clearFilters();

      expect(useMarketResearchStore.getState().filters).toEqual({});
    });

    it('should set search query', () => {
      useMarketResearchStore.getState().setSearchQuery('energia solar');
      expect(useMarketResearchStore.getState().searchQuery).toBe('energia solar');
    });
  });

  describe('Selectors', () => {
    it('should filter history by search query', async () => {
      await useMarketResearchStore.getState().performResearch('Energia solar');
      await useMarketResearchStore.getState().performResearch('Marketing digital');
      useMarketResearchStore.getState().setSearchQuery('solar');

      const filtered = selectFilteredHistory(useMarketResearchStore.getState());
      expect(filtered).toHaveLength(1);
      expect(filtered[0].input).toContain('solar');
    });

    it('should return all history when no filters', async () => {
      await useMarketResearchStore.getState().performResearch('Query 1');
      await useMarketResearchStore.getState().performResearch('Query 2');

      const filtered = selectFilteredHistory(useMarketResearchStore.getState());
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Active Tab', () => {
    it('should change active tab', () => {
      useMarketResearchStore.getState().setActiveTab('history');
      expect(useMarketResearchStore.getState().activeTab).toBe('history');

      useMarketResearchStore.getState().setActiveTab('saved');
      expect(useMarketResearchStore.getState().activeTab).toBe('saved');
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', async () => {
      // Modify state
      await useMarketResearchStore.getState().performResearch('Test query');
      useMarketResearchStore.getState().saveReport(createMockReport());
      useMarketResearchStore.getState().setSearchQuery('test');
      useMarketResearchStore.getState().setActiveTab('history');

      // Reset
      useMarketResearchStore.getState().reset();

      const state = useMarketResearchStore.getState();
      expect(state.currentResearch).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.savedReports).toEqual([]);
      expect(state.searchQuery).toBe('');
      expect(state.activeTab).toBe('research');
    });
  });
});