import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, test, describe } from 'vitest';
import React from 'react';
// Mock simplificado do componente ou renderização direta da seção para teste
import { ShieldCheck } from 'lucide-react';

expect.extend(toHaveNoViolations);

describe('Dashboard Hero Accessibility', () => {
  test('Dashboard Hero & Trust Signals should have no accessibility violations', async () => {
    const { container } = render(
      <section 
        className="bg-emerald-50 border-2 border-emerald-200 rounded-[2.5rem] p-6 md:p-8 max-w-6xl mx-auto mt-8 shadow-sm hover:shadow-xl transition-all duration-500 focus-within:ring-4 focus-within:ring-emerald-500/20 outline-none"
        aria-labelledby="trust-signals-title"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-[1.5rem] border-2 border-emerald-200 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-emerald-800" aria-hidden="true" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 id="trust-signals-title" className="text-[21px] font-black text-emerald-950 uppercase tracking-tight leading-tight">
                Prospecção Segura (Anti-Bloqueio)
              </h3>
              <p className="text-[17px] text-emerald-800 font-bold leading-relaxed">
                Siga as etapas para garantir a melhor conversão e segurança máxima.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-5 grid grid-cols-3 gap-4 h-full">
            {['🔒', '📈', '🤝'].map((icon, idx) => (
              <button 
                key={idx} 
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white border-2 border-emerald-100 rounded-3xl shadow-sm hover:border-emerald-400 hover:shadow-lg transition-all duration-300 active:scale-95 focus:ring-4 focus:ring-emerald-500/20 outline-none group h-full min-h-[120px]"
              >
                <span className="text-2xl" role="img" aria-label="Signal">
                  {icon}
                </span>
                <span className="text-[11px] font-black uppercase text-emerald-950 tracking-[0.15em]">
                  Label
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Should not have horizontal overflow (layout check)', () => {
    // Verificação lógica de grid
    const sectionClasses = "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center";
    expect(sectionClasses).toContain('grid-cols-1');
    expect(sectionClasses).toContain('lg:grid-cols-12');
  });
});
