// src/modules/prospecting/intel/scoring-engine.ts

/**
 * Lead Intelligence Engine - Scoring Engine
 * 
 * Pure functions for calculating lead scores.
 * All functions are deterministic and return values in [0, 100].
 * 
 * Requirements: 2.8, 3.7, 5.1-5.5, 6.6, 7.2-7.5, 23.11, 24.7
 */

// ============================================
// Input Types
// ============================================

export interface DigitalMaturityInputs {
  hasWebsite: boolean;
  websiteSpeedMs?: number;
  seoQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  hasInstagram: boolean;
  hasFacebook: boolean;
  hasLinkedIn: boolean;
  postFrequencyPerMonth?: number;
  usesPaidAds?: boolean;
}

export interface VulnerabilityInputs {
  vulnerabilities: Array<{
    severity: 'crítica' | 'alta' | 'média' | 'baixa';
  }>;
}

export interface TimingInputs {
  ageMonths?: number;
  followerGrowth3mPct?: number;
  reviewGrowth3mPct?: number;
  recentExpansion?: boolean;
  onlineMentionsTrend?: 'rising' | 'flat' | 'declining';
}

export interface DataConfidenceInputs {
  totalFields: number;
  filledFields: number;
  oldestDataAgeMs: number;
  agreementCount: number;
  totalObservations: number;
  officialSourceCount: number;
  totalSources: number;
}

export interface EngagementInputs {
  rating?: number;
  reviewCount?: number;
  instagramFollowers?: number;
}

export interface ScoreInputs {
  digitalMaturity: DigitalMaturityInputs;
  vulnerability: VulnerabilityInputs;
  timing: TimingInputs;
  engagement: EngagementInputs;
}

export interface AnalyzedReview {
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface Competitor {
  maturityScore: number;
}

// ============================================
// Score Calculation Functions
// ============================================

/**
 * Calculates Digital Maturity Score (0-100)
 * 
 * Weights:
 * - Website presence: 25%
 * - SEO quality: 20%
 * - Social media presence: 25%
 * - Post frequency: 15%
 * - Paid ads: 15%
 * 
 * Requirements: 2.8
 */
export function calculateDigitalMaturityScore(inputs: DigitalMaturityInputs): number {
  let score = 0;

  // Website presence (25 points)
  if (inputs.hasWebsite) {
    score += 25;
  }

  // SEO quality (20 points)
  if (inputs.seoQuality) {
    const seoScores = {
      poor: 5,
      fair: 10,
      good: 15,
      excellent: 20,
    };
    score += seoScores[inputs.seoQuality];
  }

  // Social media presence (25 points total)
  const socialCount = [
    inputs.hasInstagram,
    inputs.hasFacebook,
    inputs.hasLinkedIn,
  ].filter(Boolean).length;
  score += (socialCount / 3) * 25;

  // Post frequency (15 points)
  if (inputs.postFrequencyPerMonth !== undefined) {
    // 0-4 posts = 0-5 points, 5-12 posts = 6-10 points, 13+ posts = 11-15 points
    if (inputs.postFrequencyPerMonth >= 13) {
      score += 15;
    } else if (inputs.postFrequencyPerMonth >= 5) {
      score += 10;
    } else if (inputs.postFrequencyPerMonth > 0) {
      score += 5;
    }
  }

  // Paid ads (15 points)
  if (inputs.usesPaidAds) {
    score += 15;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Vulnerability Score (0-100)
 * 
 * Higher score = more vulnerabilities
 * 
 * Weights by severity:
 * - Crítica: 40 points each
 * - Alta: 25 points each
 * - Média: 15 points each
 * - Baixa: 10 points each
 * 
 * Requirements: 3.7
 */
export function calculateVulnerabilityScore(inputs: VulnerabilityInputs): number {
  const severityWeights = {
    crítica: 40,
    alta: 25,
    média: 15,
    baixa: 10,
  };

  let score = 0;
  for (const vuln of inputs.vulnerabilities) {
    score += severityWeights[vuln.severity];
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Timing Score (0-100)
 * 
 * Weights:
 * - Company age (< 12 months): 30%
 * - Follower growth: 25%
 * - Review growth: 20%
 * - Recent expansion: 15%
 * - Online mentions trend: 10%
 * 
 * Requirements: 6.6
 */
export function calculateTimingScore(inputs: TimingInputs): number {
  let score = 0;

  // Company age (30 points) - younger is better for timing
  if (inputs.ageMonths !== undefined) {
    if (inputs.ageMonths <= 12) {
      score += 30;
    } else if (inputs.ageMonths <= 24) {
      score += 20;
    } else if (inputs.ageMonths <= 36) {
      score += 10;
    }
  }

  // Follower growth (25 points)
  if (inputs.followerGrowth3mPct !== undefined) {
    if (inputs.followerGrowth3mPct >= 20) {
      score += 25;
    } else if (inputs.followerGrowth3mPct >= 10) {
      score += 15;
    } else if (inputs.followerGrowth3mPct > 0) {
      score += 5;
    }
  }

  // Review growth (20 points)
  if (inputs.reviewGrowth3mPct !== undefined) {
    if (inputs.reviewGrowth3mPct >= 20) {
      score += 20;
    } else if (inputs.reviewGrowth3mPct >= 10) {
      score += 12;
    } else if (inputs.reviewGrowth3mPct > 0) {
      score += 5;
    }
  }

  // Recent expansion (15 points)
  if (inputs.recentExpansion) {
    score += 15;
  }

  // Online mentions trend (10 points)
  if (inputs.onlineMentionsTrend === 'rising') {
    score += 10;
  } else if (inputs.onlineMentionsTrend === 'flat') {
    score += 5;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Data Confidence Score (0-100)
 * 
 * Weights:
 * - Completeness (filled fields / total fields): 30%
 * - Recency (age of oldest data): 25%
 * - Agreement (sources that agree): 25%
 * - Source quality (official sources): 20%
 * 
 * Requirements: 5.1-5.5
 */
export function calculateDataConfidenceScore(inputs: DataConfidenceInputs): number {
  let score = 0;

  // Completeness (30 points)
  if (inputs.totalFields > 0) {
    const completeness = inputs.filledFields / inputs.totalFields;
    score += completeness * 30;
  }

  // Recency (25 points) - data older than 90 days loses points
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  if (inputs.oldestDataAgeMs <= ninetyDaysMs) {
    score += 25;
  } else if (inputs.oldestDataAgeMs <= 180 * 24 * 60 * 60 * 1000) {
    score += 15;
  } else if (inputs.oldestDataAgeMs <= 365 * 24 * 60 * 60 * 1000) {
    score += 5;
  }

  // Agreement (25 points)
  if (inputs.totalObservations > 0) {
    const agreementRate = inputs.agreementCount / inputs.totalObservations;
    score += agreementRate * 25;
  }

  // Source quality (20 points)
  if (inputs.totalSources > 0) {
    const officialRate = inputs.officialSourceCount / inputs.totalSources;
    score += officialRate * 20;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Sentiment Score (0-100)
 * 
 * Simple percentage of positive reviews
 * 
 * Requirements: 24.7
 */
export function calculateSentimentScore(reviews: AnalyzedReview[]): number {
  if (reviews.length === 0) {
    return 0;
  }

  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const score = (positiveCount / reviews.length) * 100;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Competitive Pressure Score (0-100)
 * 
 * Based on average maturity of competitors
 * Higher score = more competitive pressure
 * 
 * Requirements: 23.11
 */
export function calculateCompetitivePressureScore(competitors: Competitor[]): number {
  if (competitors.length === 0) {
    return 0;
  }

  const avgMaturity = competitors.reduce((sum, c) => sum + c.maturityScore, 0) / competitors.length;
  
  return Math.round(Math.min(100, Math.max(0, avgMaturity)));
}

/**
 * Calculates unified Lead Score (0-100)
 * 
 * Weights:
 * - Digital Maturity: 25%
 * - Vulnerability: 30%
 * - Timing: 25%
 * - Engagement: 20%
 * 
 * Requirements: 7.1
 */
export function calculateLeadScore(inputs: ScoreInputs): number {
  const maturityScore = calculateDigitalMaturityScore(inputs.digitalMaturity);
  const vulnerabilityScore = calculateVulnerabilityScore(inputs.vulnerability);
  const timingScore = calculateTimingScore(inputs.timing);
  const engagementScore = calculateEngagementScore(inputs.engagement);

  const score = 
    maturityScore * 0.25 +
    vulnerabilityScore * 0.30 +
    timingScore * 0.25 +
    engagementScore * 0.20;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculates Engagement Score (0-100)
 * 
 * Based on rating, review count, and social followers
 * 
 * Internal helper for calculateLeadScore
 */
function calculateEngagementScore(inputs: EngagementInputs): number {
  let score = 0;

  // Rating (40 points) - normalized from 0-5 scale
  if (inputs.rating !== undefined) {
    score += (inputs.rating / 5) * 40;
  }

  // Review count (30 points)
  if (inputs.reviewCount !== undefined) {
    if (inputs.reviewCount >= 100) {
      score += 30;
    } else if (inputs.reviewCount >= 50) {
      score += 20;
    } else if (inputs.reviewCount >= 10) {
      score += 10;
    } else if (inputs.reviewCount > 0) {
      score += 5;
    }
  }

  // Instagram followers (30 points)
  if (inputs.instagramFollowers !== undefined) {
    if (inputs.instagramFollowers >= 10000) {
      score += 30;
    } else if (inputs.instagramFollowers >= 5000) {
      score += 20;
    } else if (inputs.instagramFollowers >= 1000) {
      score += 10;
    } else if (inputs.instagramFollowers > 0) {
      score += 5;
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Categorizes a score (0-100) into human-readable labels
 * 
 * Requirements: 2.9, 5.6, 6.7, 7.6
 */
export function categorizeScore(
  score: number,
  scheme: 'opportunity' | 'maturity' | 'timing' | 'confidence'
): string {
  // Ensure score is in valid range
  const normalizedScore = Math.min(100, Math.max(0, score));

  switch (scheme) {
    case 'opportunity':
      if (normalizedScore >= 75) return 'Muito Alta';
      if (normalizedScore >= 50) return 'Alta';
      if (normalizedScore >= 25) return 'Média';
      return 'Baixa';

    case 'maturity':
      if (normalizedScore >= 75) return 'Avançada';
      if (normalizedScore >= 50) return 'Intermediária';
      if (normalizedScore >= 25) return 'Básica';
      return 'Inexistente';

    case 'timing':
      if (normalizedScore >= 75) return 'Urgente';
      if (normalizedScore >= 50) return 'Quente';
      if (normalizedScore >= 25) return 'Morno';
      return 'Frio';

    case 'confidence':
      if (normalizedScore >= 80) return 'high';
      if (normalizedScore >= 50) return 'medium';
      if (normalizedScore >= 20) return 'low';
      return 'unknown';

    default:
      return 'unknown';
  }
}
