import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calculator } from "lucide-react";

interface RevenueSimulatorProps {
  initialTicket?: number;
  initialCustomers?: number;
  initialConversion?: number;
  onUpdate?: (data: any) => void;
  isPublic?: boolean;
}

export const RevenueSimulator: React.FC<RevenueSimulatorProps> = ({
  initialTicket = 500,
  initialCustomers = 10,
  initialConversion = 20,
  onUpdate,
  isPublic = false
}) => {
  const [ticket, setTicket] = useState(initialTicket);
  const [customers, setCustomers] = useState(initialCustomers);
  const [conversion, setConversion] = useState(initialConversion);
  const [investment, setInvestment] = useState(0);

  const monthlyPotential = ticket * customers;
  const threeMonthsPotential = monthlyPotential * 3;
  const yearlyPotential = monthlyPotential * 12;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isPublic) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Potencial de Crescimento</h3>
            <p className="text-sm opacity-60">Projeção estimada com base no ticket médio informado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Potencial Mensal</p>
            <p className="text-3xl font-black text-primary">{formatCurrency(monthlyPotential)}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Potencial 3 Meses</p>
            <p className="text-3xl font-black text-white">{formatCurrency(threeMonthsPotential)}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Potencial 12 Meses</p>
            <p className="text-3xl font-black text-white">{formatCurrency(yearlyPotential)}</p>
          </div>
        </div>
        
        <p className="text-[10px] opacity-30 mt-8 text-center uppercase tracking-widest">
          * Simulação estimada com base nos dados informados. Não representa garantia de resultado.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Simulador de Potencial</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ticket Médio (R$)</Label>
            <Input 
              type="number" 
              value={ticket} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setTicket(val);
                onUpdate?.({ ticket: val, customers, conversion });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Novos Clientes /mês</Label>
            <Input 
              type="number" 
              value={customers} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setCustomers(val);
                onUpdate?.({ ticket, customers: val, conversion });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Mensal</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(monthlyPotential)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">3 Meses</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(threeMonthsPotential)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">12 Meses</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(yearlyPotential)}</p>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 uppercase text-center">
          Aviso: Simulação estimada com base nos dados informados.
        </p>
      </CardContent>
    </Card>
  );
};
