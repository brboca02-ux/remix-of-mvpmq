import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Star, History, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CRMFiltersProps {
  onFilterChange: (type: string, value: any) => void;
  activeFilters: {
    niche?: string;
    hotOnly?: boolean;
    inactiveOnly?: boolean;
  };
  availableNiches: string[];
}

export const CRMFilters: React.FC<CRMFiltersProps> = ({ 
  onFilterChange, 
  activeFilters,
  availableNiches 
}) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 mr-2">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Filtros Rápidos:</span>
      </div>

      <Button 
        variant={activeFilters.hotOnly ? "default" : "outline"} 
        size="sm" 
        onClick={() => onFilterChange('hotOnly', !activeFilters.hotOnly)}
        className={`rounded-full gap-2 h-9 text-xs font-bold transition-all duration-300 ${activeFilters.hotOnly ? 'bg-rose-500 hover:bg-rose-600 border-none shadow-lg shadow-rose-200' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        <Star className={`h-3.5 w-3.5 ${activeFilters.hotOnly ? 'fill-current' : ''}`} />
        Leads Quentes {'>'}80%
      </Button>

      <Button 
        variant={activeFilters.inactiveOnly ? "default" : "outline"} 
        size="sm" 
        onClick={() => onFilterChange('inactiveOnly', !activeFilters.inactiveOnly)}
        className={`rounded-full gap-2 h-9 text-xs font-bold transition-all duration-300 ${activeFilters.inactiveOnly ? 'bg-orange-500 hover:bg-orange-600 border-none shadow-lg shadow-orange-200' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        <History className="h-3.5 w-3.5" />
        Inativos {'>'}48h
      </Button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {availableNiches.slice(0, 3).map(niche => (
        <Button 
          key={niche}
          variant={activeFilters.niche === niche ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => onFilterChange('niche', activeFilters.niche === niche ? undefined : niche)}
          className="rounded-full gap-2 h-8 text-xs font-bold border-dashed border-slate-200"
        >
          <Hash className="h-3.5 w-3.5" />
          {niche}
        </Button>
      ))}
      
      {(activeFilters.niche || activeFilters.hotOnly || activeFilters.inactiveOnly) && (
        <Button 
          variant="link" 
          size="sm" 
          onClick={() => {
            onFilterChange('niche', undefined);
            onFilterChange('hotOnly', false);
            onFilterChange('inactiveOnly', false);
          }}
          className="text-xs text-rose-500 font-bold"
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );
};
