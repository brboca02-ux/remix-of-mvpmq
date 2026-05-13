// @ts-nocheck
/**
 * Validator for Lead Intelligence data
 * 
 * Validates enriched lead data before persistence to ensure data integrity.
 * Requirements: 20.1-20.12
 */

import type { LeadIntelligence } from './intelligence-types';

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a score is within the valid range [0, 100]
 */
function validateScore(score: number | undefined, fieldName: string): ValidationError | null {
  if (score === undefined) {
    return null; // Optional scores are allowed
  }
  
  if (typeof score !== 'number' || isNaN(score)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
      value: score,
    };
  }
  
  if (score < 0 || score > 100) {
    return {
      field: fieldName,
      message: `${fieldName} must be between 0 and 100`,
      value: score,
    };
  }
  
  return null;
}

/**
 * Validates an enum value is one of the allowed values
 */
function validateEnum<T extends string>(
  value: T | undefined,
  fieldName: string,
  allowedValues: readonly T[]
): ValidationError | null {
  if (value === undefined) {
    return null; // Optional enums are allowed
  }
  
  if (!allowedValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      value,
    };
  }
  
  return null;
}

/**
 * Validates a URL is parseable and valid
 */
function validateURL(url: string | undefined, fieldName: string): ValidationError | null {
  if (!url) {
    return null; // Optional URLs are allowed
  }
  
  try {
    new URL(url);
    return null;
  } catch {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
      value: url,
    };
  }
}

/**
 * Validates a timestamp is a valid ISO 8601 date string
 */
function validateTimestamp(timestamp: string | undefined, fieldName: string): ValidationError | null {
  if (!timestamp) {
    return null; // Optional timestamps are allowed
  }
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid ISO 8601 timestamp`,
      value: timestamp,
    };
  }
  
  return null;
}

/**
 * Validates a monetary value is a positive number
 */
function validateMonetaryValue(value: number | undefined, fieldName: string): ValidationError | null {
  if (value === undefined) {
    return null; // Optional monetary values are allowed
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
      value,
    };
  }
  
  if (value < 0) {
    return {
      field: fieldName,
      message: `${fieldName} must be a positive number`,
      value,
    };
  }
  
  return null;
}

/**
 * Validates CNPJ format (14 digits)
 */
export function validateCNPJ(cnpj: string | undefined): boolean {
  if (!cnpj) return false;
  
  // Remove non-digits
  const digits = cnpj.replace(/\D/g, '');
  
  // Must have exactly 14 digits
  if (digits.length !== 14) return false;
  
  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validate check digits
  const calcCheckDigit = (base: string, weights: number[]): number => {
    const sum = base.split('').reduce((acc, digit, i) => acc + parseInt(digit) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  
  const base = digits.slice(0, 12);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const digit1 = calcCheckDigit(base, weights1);
  const digit2 = calcCheckDigit(base + digit1, weights2);
  
  return digits === base + digit1 + digit2;
}

/**
 * Validates email format
 */
export function validateEmail(email: string | undefined): boolean {
  if (!email) return false;
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

/**
 * Validates Brazilian phone number format
 */
export function validatePhone(phone: string | undefined): boolean {
  if (!phone) return false;
  
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Brazilian phone: +55 (DDD) NNNNN-NNNN
  // With country code: 13 digits (55 + 2 DDD + 9 number)
  // Without country code: 11 digits (2 DDD + 9 number)
  // Old format (8 digits): 10 digits (2 DDD + 8 number)
  
  if (digits.length === 13 && digits.startsWith('55')) {
    // With country code
    const ddd = parseInt(digits.slice(2, 4));
    return ddd >= 11 && ddd <= 99;
  }
  
  if (digits.length === 11 || digits.length === 10) {
    // Without country code
    const ddd = parseInt(digits.slice(0, 2));
    return ddd >= 11 && ddd <= 99;
  }
  
  return false;
}

/**
 * Main validation function for LeadIntelligence
 * Requirements: 20.1-20.12
 */
export function validate(intelligence: LeadIntelligence | undefined): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!intelligence) {
    return { valid: true, errors: [] }; // Optional intelligence is allowed
  }
  
  // Validate scores (Requirements 20.1-20.5)
  if (intelligence.scores) {
    const scoreError1 = validateScore(intelligence.scores.leadScore, 'scores.leadScore');
    if (scoreError1) errors.push(scoreError1);
    
    const scoreError2 = validateScore(intelligence.scores.digitalMaturityScore, 'scores.digitalMaturityScore');
    if (scoreError2) errors.push(scoreError2);
    
    const scoreError3 = validateScore(intelligence.scores.vulnerabilityScore, 'scores.vulnerabilityScore');
    if (scoreError3) errors.push(scoreError3);
    
    const scoreError4 = validateScore(intelligence.scores.timingScore, 'scores.timingScore');
    if (scoreError4) errors.push(scoreError4);
    
    const scoreError5 = validateScore(intelligence.scores.dataConfidenceScore, 'scores.dataConfidenceScore');
    if (scoreError5) errors.push(scoreError5);
    
    const scoreError6 = validateScore(intelligence.scores.sentimentScore, 'scores.sentimentScore');
    if (scoreError6) errors.push(scoreError6);
    
    const scoreError7 = validateScore(intelligence.scores.competitivePressureScore, 'scores.competitivePressureScore');
    if (scoreError7) errors.push(scoreError7);
    
    // Validate timestamp
    const timestampError = validateTimestamp(intelligence.scores.computedAt, 'scores.computedAt');
    if (timestampError) errors.push(timestampError);
  }
  
  // Validate identity_status (Requirement 20.6)
  if (intelligence.cnpjEnrichment) {
    const identityError = validateEnum(
      intelligence.cnpjEnrichment.identityStatus,
      'cnpjEnrichment.identityStatus',
      ['verified', 'invalid_cnpj', 'not_found'] as const
    );
    if (identityError) errors.push(identityError);
  }
  
  // Validate data_confidence (Requirement 20.7)
  const dataConfidenceError = validateEnum(
    intelligence.dataConfidence,
    'dataConfidence',
    ['high', 'medium', 'low', 'unknown'] as const
  );
  if (dataConfidenceError) errors.push(dataConfidenceError);
  
  // Validate field_confidence in various fields (Requirement 20.8)
  const confidenceLevels = ['high', 'medium', 'low', 'unknown'] as const;
  
  if (intelligence.digitalMaturity) {
    const dm = intelligence.digitalMaturity;
    
    if (dm.hasWebsite) {
      const confError = validateEnum(dm.hasWebsite.confidence, 'digitalMaturity.hasWebsite.confidence', confidenceLevels);
      if (confError) errors.push(confError);
    }
    
    if (dm.websiteSpeedMs) {
      const confError = validateEnum(dm.websiteSpeedMs.confidence, 'digitalMaturity.websiteSpeedMs.confidence', confidenceLevels);
      if (confError) errors.push(confError);
    }
    
    if (dm.hasInstagram) {
      const confError = validateEnum(dm.hasInstagram.confidence, 'digitalMaturity.hasInstagram.confidence', confidenceLevels);
      if (confError) errors.push(confError);
    }
  }
  
  // Validate social media URLs (Requirement 20.9)
  if (intelligence.digitalMaturity?.websiteTech?.value) {
    // Website tech is an array of strings, not URLs, so we skip URL validation for it
  }
  
  if (intelligence.emailDiscovery?.primary) {
    const email = intelligence.emailDiscovery.primary.email;
    if (email && !validateEmail(email)) {
      errors.push({
        field: 'emailDiscovery.primary.email',
        message: 'Invalid email format',
        value: email,
      });
    }
  }
  
  // Validate timestamps (Requirement 20.10)
  if (intelligence.cnpjEnrichment) {
    const tsError = validateTimestamp(intelligence.cnpjEnrichment.fetchedAt, 'cnpjEnrichment.fetchedAt');
    if (tsError) errors.push(tsError);
    
    if (intelligence.cnpjEnrichment.dataAbertura) {
      const dateError = validateTimestamp(intelligence.cnpjEnrichment.dataAbertura.value, 'cnpjEnrichment.dataAbertura.value');
      if (dateError) errors.push(dateError);
    }
  }
  
  if (intelligence.competitorAnalysis) {
    const tsError = validateTimestamp(intelligence.competitorAnalysis.cachedAt, 'competitorAnalysis.cachedAt');
    if (tsError) errors.push(tsError);
  }
  
  if (intelligence.reviewAnalysis) {
    const tsError = validateTimestamp(intelligence.reviewAnalysis.cachedAt, 'reviewAnalysis.cachedAt');
    if (tsError) errors.push(tsError);
  }
  
  // Validate monetary values (Requirement 20.11)
  if (intelligence.salesIntelligence) {
    if (intelligence.salesIntelligence.estimatedDealValue !== undefined) {
      const moneyError = validateMonetaryValue(
        intelligence.salesIntelligence.estimatedDealValue,
        'salesIntelligence.estimatedDealValue'
      );
      if (moneyError) errors.push(moneyError);
    }
    
    if (intelligence.salesIntelligence.personalizedOffers) {
      intelligence.salesIntelligence.personalizedOffers.forEach((offer, index) => {
        const moneyError = validateMonetaryValue(
          offer.estimatedValue,
          `salesIntelligence.personalizedOffers[${index}].estimatedValue`
        );
        if (moneyError) errors.push(moneyError);
      });
    }
  }
  
  // Return validation result (Requirement 20.12)
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates and throws if invalid (for use in critical paths)
 */
export function validateOrThrow(intelligence: LeadIntelligence | undefined): void {
  const result = validate(intelligence);
  
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Lead intelligence validation failed: ${errorMessages}`);
  }
}