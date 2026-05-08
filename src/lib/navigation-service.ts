import { supabase } from "@/integrations/supabase/client";

export interface PageVisit {
  url: string;
  path: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const navigationService = {
  /**
   * Tracks a page visit in localStorage and optionally via API
   */
  async trackVisit(path: string, metadata?: Record<string, any>) {
    const visit: PageVisit = {
      url: window.location.href,
      path,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Persistence in localStorage
    try {
      const history = JSON.parse(localStorage.getItem('nav_history') || '[]');
      history.unshift(visit);
      localStorage.setItem('nav_history', JSON.stringify(history.slice(0, 50))); // Keep last 50
    } catch (e) {
      console.warn('Failed to save nav history to localStorage', e);
    }

    // Optional API call (non-blocking)
    try {
      // In a real scenario, this would be a table in Supabase or an Edge Function
      // For now we log it and attempt a fetch to a hypothetical endpoint
      console.log('[Navigation Tracking]:', visit);
      
    } catch (e) {
      // Ignore errors in tracking to not block navigation
    }
  },

  /**
   * Safe external link opener
   */
  openExternal(url: string) {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) win.focus();
  },

  /**
   * Centralized CTA handler with tracking
   */
  async handleCTA(actionName: string, data: Record<string, any>, callback?: () => void | Promise<void>) {
    try {
      console.log(`[CTA Clicked]: ${actionName}`, data);
      
      // Persist CTA event
      const events = JSON.parse(localStorage.getItem('cta_events') || '[]');
      events.unshift({
        action: actionName,
        data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('cta_events', JSON.stringify(events.slice(0, 100)));

      if (callback) {
        await callback();
      }
    } catch (error) {
      console.error(`Error handling CTA ${actionName}:`, error);
      // Fallback or generic error handling could go here
    }
  }
};
