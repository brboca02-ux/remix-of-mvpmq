import { cn } from '@/lib/utils';
import { CONFIDENCE_COLORS } from '../constants';
import type { ConfidenceLevel } from '../types';

interface ConfidenceDotProps {
  level: ConfidenceLevel;
  size?: number;
}

export function ConfidenceDot({ level, size = 8 }: ConfidenceDotProps) {
  return (
    <span
      className={cn('rounded-full inline-block shrink-0', CONFIDENCE_COLORS[level])}
      style={{ width: size, height: size }}
      aria-label={`Confiança: ${level}`}
    />
  );
}
