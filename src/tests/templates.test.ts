import { describe, it, expect } from 'vitest';
import { PREBUILT_TEMPLATES } from '../lib/prebuilt-templates';

describe('Biblioteca de Templates - Integridade de Dados', () => {
  it('Todos os templates devem ter os campos obrigatórios preenchidos', () => {
    PREBUILT_TEMPLATES.forEach(template => {
      expect(template.id, `Template ${template.id} sem ID`).toBeDefined();
      expect(template.companyName, `Template ${template.id} sem nome da empresa`).toBeDefined();
      expect(template.niche, `Template ${template.id} sem nicho`).toBeDefined();
      expect(template.thumbnail, `Template ${template.id} sem thumbnail`).toBeDefined();
      
      // Validação de arrays
      expect(Array.isArray(template.services), `Template ${template.id}: services deve ser um array`).toBe(true);
      expect(template.services.length).toBeGreaterThan(0);
      
      expect(Array.isArray(template.differentials), `Template ${template.id}: differentials deve ser um array`).toBe(true);
      expect(template.differentials.length).toBeGreaterThan(0);
    });
  });

  it('Todos os templates premium devem ter o tom configurado como "Premium"', () => {
    PREBUILT_TEMPLATES.forEach(template => {
      expect(template.tone).toBe('Premium');
    });
  });

  it('As URLs de thumbnail devem ser válidas (Supabase ou Unsplash)', () => {
    PREBUILT_TEMPLATES.forEach(template => {
      const isSupabase = template.thumbnail.includes('supabase.co');
      const isUnsplash = template.thumbnail.includes('unsplash.com');
      expect(isSupabase || isUnsplash, `URL de thumbnail inválida para ${template.id}`).toBe(true);
    });
  });
});
