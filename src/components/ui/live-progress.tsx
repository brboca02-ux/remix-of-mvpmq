import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveProgressProps {
  value: number; // 0..100
  className?: string;
  height?: "sm" | "md" | "lg";
  tone?: "primary" | "success" | "accent" | "warning" | "destructive";
  /** Adds a moving shimmer overlay to convey "live". */
  pulse?: boolean;
  showShimmer?: boolean;
}

const heightMap = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };

const toneMap: Record<NonNullable<LiveProgressProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  accent: "bg-accent",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const glowMap: Record<NonNullable<LiveProgressProps["tone"]>, string> = {
  primary: "shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--primary)_60%,transparent)]",
  success: "shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--success)_60%,transparent)]",
  accent: "shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--accent)_60%,transparent)]",
  warning: "shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--warning)_60%,transparent)]",
  destructive:
    "shadow-[0_0_12px_-2px_color-mix(in_oklab,var(--destructive)_60%,transparent)]",
};

export function LiveProgress({
  value,
  className,
  height = "md",
  tone = "primary",
  pulse = true,
  showShimmer = true,
}: LiveProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.04]",
        heightMap[height],
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative h-full rounded-full",
          toneMap[tone],
          glowMap[tone],
        )}
      >
        {showShimmer && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ left: ["-33%", "120%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
          />
        )}
      </motion.div>
      {pulse && clamped > 0 && (
        <motion.span
          aria-hidden
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full",
            toneMap[tone],
          )}
          style={{ left: `calc(${clamped}% - 4px)` }}
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
