import { GeneratedSite } from "@/modules/prospecting/types";

export const proposalStorage = {
  saveProposalDraft(data: GeneratedSite & { leadId?: string }): string {
    if (typeof window === 'undefined') return '';
    
    const proposalId = data.leadId || Math.random().toString(36).substring(2, 9);
    const key = `proposal_site_${proposalId}`;
    localStorage.setItem(key, JSON.stringify({
      ...data,
      id: proposalId,
      savedAt: new Date().toISOString()
    }));
    
    // Update index
    try {
      const index = JSON.parse(localStorage.getItem('proposal_site_index') || '[]');
      if (!index.includes(proposalId)) {
        index.push(proposalId);
        localStorage.setItem('proposal_site_index', JSON.stringify(index));
      }
    } catch (e) {
      localStorage.setItem('proposal_site_index', JSON.stringify([proposalId]));
    }
    
    return proposalId;
  },

  getProposalById(proposalId: string): (GeneratedSite & { savedAt: string }) | null {
    if (typeof window === 'undefined') return null;
    
    const key = `proposal_site_${proposalId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};
