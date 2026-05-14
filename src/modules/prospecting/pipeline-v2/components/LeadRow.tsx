import { cn } from '@/lib/utils';
import { ConfidenceDot } from './ConfidenceDot';
import { ChevronRight } from 'lucide-react';
import type { LeadRowData } from '../types';

interface LeadRowProps {
  lead: LeadRowData;
  isActive: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export function LeadRow({ lead, isActive, onClick, style }: LeadRowProps) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors rounded-lg',
        'hover:bg-zinc-800/50',
        isActive && 'bg-zinc-800/30 border-l-2 border-primary',
        !isActive && 'border-l-2 border-transparent'
      )}
    >
      <ConfidenceDot level={lead.confidence} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-zinc-100 truncate">
          {lead.companyName}
        </p>
        <p className="text-[11px] text-zinc-500 truncate">
          {[lead.niche, lead.city].filter(Boolean).join(' · ')}
        </p>
      </div>
      {lead.suggestedAction && (
        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5 shrink-0">
          {lead.suggestedChannel === 'WhatsApp' && '📱'}
          {lead.suggestedChannel === 'Instagram' && '📷'}
          {lead.suggestedChannel === 'Email' && '✉️'}
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}
