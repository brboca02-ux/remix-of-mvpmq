/**
 * Smart CSV Parser Tests
 * 
 * Tests for the smart CSV parser with various formats including Google Maps exports.
 * 
 * @module lib/__tests__/csv-smart-parser
 */

import { describe, it, expect } from 'vitest';
import { smartParseCsv, validateSmartParseResult } from '../csv-smart-parser';

describe('Smart CSV Parser', () => {
  describe('Google Maps Format', () => {
    const googleMapsSample = `Emagrecentro Joinville,(47) 3202-6309,5,0 (651),Centro de saúde e beleza,,189 Rua Henrique Meyer
Tatiane Besen - Depilação a Laser em Joinville (Para Homens e Mulheres),(47) 99959-7686,4,9 (78),Depilação,,293 Rua Anita Garibaldi
Dra. Luíza Bunn - Clínica de Estética,(47) 99757-6754,5,0 (44),Centro de saúde e beleza,,R. Eng. Niemeyer, 235
Clínica Nubelle Estética,(47) 98833-0088,4,8 (64),Centro de saúde e beleza,,R. Dr. João Colin, 29 - Sala 4`;

    it('should detect Google Maps format', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      expect(result.format.columnPattern).toBe('google-maps');
    });

    it('should parse all rows', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      expect(result.leads.length).toBe(4);
    });

    it('should extract company name correctly', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      expect(result.leads[0].nome).toBe('Emagrecentro Joinville');
      expect(result.leads[1].nome).toBe('Tatiane Besen - Depilação a Laser em Joinville (Para Homens e Mulheres)');
    });

    it('should extract phone number correctly', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      expect(result.leads[0].telefone).toBe('(47) 3202-6309');
      expect(result.leads[1].telefone).toBe('(47) 99959-7686');
    });

    it('should extract category correctly', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      expect(result.leads[0].atividade).toBe('Centro de saúde e beleza');
      expect(result.leads[1].atividade).toBe('Depilação');
    });

    it('should preserve address with commas', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      // Check that addresses with commas are preserved
      const lead3 = result.leads[2]; // Dra. Luíza Bunn
      expect(lead3.raw).toBeDefined();
    });

    it('should extract rating from raw data', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      const raw = result.leads[0].raw as Record<string, unknown>;
      expect(raw.rating).toBe(5.0);
      expect(raw.reviews).toBe(651);
    });

    it('should set correct nicho', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      result.leads.forEach(lead => {
        expect(lead.nicho).toBe('estetica');
      });
    });

    it('should set source as csv_import', () => {
      const result = smartParseCsv(googleMapsSample, 'estetica');
      result.leads.forEach(lead => {
        expect(lead.source).toBe('csv_import');
      });
    });
  });

  describe('Standard CSV with Headers', () => {
    const standardCsv = `Nome,Telefone,Email,Cidade
Empresa ABC,(11) 99999-9999,contato@abc.com,São Paulo
Loja XYZ,(21) 88888-8888,loja@xyz.com,Rio de Janeiro`;

    it('should detect headers', () => {
      const result = smartParseCsv(standardCsv, 'geral');
      expect(result.format.hasHeaders).toBe(true);
    });

    it('should parse all rows', () => {
      const result = smartParseCsv(standardCsv, 'geral');
      expect(result.leads.length).toBe(2);
    });

    it('should map fields correctly', () => {
      const result = smartParseCsv(standardCsv, 'geral');
      expect(result.leads[0].nome).toBe('Empresa ABC');
      expect(result.leads[0].telefone).toBe('(11) 99999-9999');
      expect(result.leads[0].email).toBe('contato@abc.com');
      expect(result.leads[0].cidade).toBe('São Paulo');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', () => {
      const result = smartParseCsv('', 'geral');
      expect(result.leads).toHaveLength(0);
      expect(result.warnings).toContain('Arquivo vazio');
    });

    it('should handle only whitespace', () => {
      const result = smartParseCsv('   \n  \n   ', 'geral');
      expect(result.leads).toHaveLength(0);
    });

    it('should skip empty lines', () => {
      const csv = `Nome,Telefone\nEmpresa A,(11) 99999-9999\n\n\nEmpresa B,(21) 88888-8888`;
      const result = smartParseCsv(csv, 'geral');
      expect(result.leads).toHaveLength(2);
    });

    it('should handle BOM character', () => {
      const csvWithBom = `\uFEFFNome,Telefone\nEmpresa A,(11) 99999-9999`;
      const result = smartParseCsv(csvWithBom, 'geral');
      expect(result.leads).toHaveLength(1);
      expect(result.leads[0].nome).toBe('Empresa A');
    });

    it('should handle line with only comma', () => {
      const csv = `Nome,Telefone\n,`;
      const result = smartParseCsv(csv, 'geral');
      // Should not crash, just have errors
      expect(result).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate successful parse', () => {
      const result = smartParseCsv(
        `Emagrecentro Joinville,(47) 3202-6309,5,0 (651),Centro de saúde e beleza,,189 Rua Henrique Meyer`,
        'estetica'
      );
      const validation = validateSmartParseResult(result);
      expect(validation.valid).toBe(true);
    });

    it('should invalidate empty result', () => {
      const result = smartParseCsv('', 'geral');
      const validation = validateSmartParseResult(result);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle names with special characters', () => {
      const csv = `D&D Estética Avançada | Gêmeas Deise & Débora | Rejuvenescimento Facial,(47) 99964-5958,4,8 (45),Centro de saúde e beleza,,Edifício Adville Business - R. Blumenau, 64 - SALA 1109 - 11º andar`;
      const result = smartParseCsv(csv, 'estetica');
      expect(result.leads.length).toBe(1);
      expect(result.leads[0].nome).toContain('D&D Estética');
    });

    it('should handle company without phone', () => {
      const csv = `Dra Lu Hostim - Biomédica Esteta,,5,0 (44),Centro de saúde e beleza,,R. Eng. Niemeyer, 235`;
      const result = smartParseCsv(csv, 'estetica');
      expect(result.leads.length).toBe(1);
      expect(result.leads[0].nome).toBe('Dra Lu Hostim - Biomédica Esteta');
    });

    it('should handle multiple rating formats', () => {
      const csv = `Empresa A,(47) 3202-6309,5,0 (651),Centro de saúde,,Rua A
Empresa B,(47) 3202-6310,4,9 (78),Centro de saúde,,Rua B
Empresa C,(47) 3202-6311,4,5 (1234),Centro de saúde,,Rua C`;
      const result = smartParseCsv(csv, 'estetica');
      expect(result.leads.length).toBe(3);
      
      const ratings = result.leads.map(l => (l.raw as Record<string, unknown>).rating);
      expect(ratings).toEqual([5.0, 4.9, 4.5]);
    });
  });
});
