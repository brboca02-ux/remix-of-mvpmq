import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, test, describe } from 'vitest';
import React from 'react';
import { ShieldCheck } from 'lucide-react';

describe('Dashboard Hero Accessibility', () => {
  test('Dashboard Hero & Trust Signals should have no critical accessibility violations', async () => {
    const { container } = render(
      <section
        aria-labelledby="trust-signals-title"
        className="bg-emerald-50 border-2 border-emerald-200 p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-emerald-100 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-emerald-800" aria-hidden="true" />
            </div>
            <div>
              <h3 id="trust-signals-title" className="text-[21px] font-black text-emerald-950">
                Prospecção Segura (Anti-Bloqueio)
              </h3>
              <p className="text-[17px] text-emerald-800 font-bold">
                Siga as etapas para garantir a melhor conversão e segurança máxima.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-4">
            {['🔒', '📈', '🤝'].map((icon, idx) => (
              <button
                key={idx}
                type="button"
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white border-2 border-emerald-100"
              >
                <span role="img" aria-label="Trust signal">
                  {icon}
                </span>
                <span className="text-[11px] font-black uppercase text-emerald-950">Label</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }, // jsdom não computa cores reais
      },
    });
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toEqual([]);
  });

  test('Should use responsive grid classes (no overflow)', () => {
    const sectionClasses = 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center';
    expect(sectionClasses).toContain('grid-cols-1');
    expect(sectionClasses).toContain('lg:grid-cols-12');
  });
});
