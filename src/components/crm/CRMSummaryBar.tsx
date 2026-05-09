import React from 'react';
import { Card } from '@/components/ui/card';
import { Flame, Zap, Sparkles, Snowflake } from 'lucide-react';
import type { ProspectLead } from '@/modules/prospecting/types';
import { isOverdue, isCooling } from '@/lib/crm-sla';
import { pickScore } from '@/lib/crm-temperature';

interface Props {
  leads: ProspectLead[];
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const CRMSummaryBar: React.FC<Props> = ({ leads }) => {
  const todayMs = startOfTodayMs();

  const needsAction = leads.filter((l) => isOverdue(l)).length;
  const hot = leads.filter((l) => pickScore(l) > 70).length;
  const newToday = leads.filter((l) => {
    if (!l.createdAt) return false;
    return new Date(l.createdAt).getTime() >= todayMs;
  }).length;
  const cooling = leads.filter((l) => l.coolingFlag || isCooling(l)).length;

  const items = [
    {
      icon: Flame,
      label: 'Precisam de ação',
      value: needsAction,
      className: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
    {
      icon: Zap,
      label: 'Quentes (>70)',
      value: hot,
      className: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Sparkles,
      label: 'Novos hoje',
      value: newToday,
      className: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Snowflake,
      label: 'Esfriando',
      value: cooling,
      className: 'text-sky-600',
      bg: 'bg-sky-500/10',
    },
  ];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ icon: Icon, label, value, className, bg }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-lg ${bg} px-3 py-2.5`}
          >
            <div className={`p-2 rounded-md bg-background/60 ${className}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className={`text-xl font-black leading-none ${className}`}>{value}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};