import React from 'react';
import { GeneratedSite } from '@/modules/prospecting/types';
import { SitePreview } from '@/modules/prospecting/SitePreview';

interface PublicProposalPageProps {
  site: GeneratedSite;
}

export const PublicProposalPage: React.FC<PublicProposalPageProps> = ({ site }) => {
  return (
    <div className="bg-[#0f1115] min-h-screen">
      <SitePreview site={site} mode="public" />
    </div>
  );
};
