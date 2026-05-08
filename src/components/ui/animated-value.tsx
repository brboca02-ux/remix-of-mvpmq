import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format?: "currency" | "number" | "percent";
  duration?: number;
  className?: string;
  /** When value increases, show a brief +delta floating bubble. */
  showDelta?: boolean;
  /** Pulse glow color when value changes. Defaults to success. */
  pulseColor?: "success" | "primary" | "accent" | "destructive";
}

const formatNumber = (n: number, format: AnimatedValueProps["format"], decimals = 0) => {
  if (format === "currency") {
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (format === "percent") return `${n.toFixed(decimals)}`;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export function AnimatedValue({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  format = "number",
  duration = 0.9,
  className,
  showDelta = true,
  pulseColor = "success",
}: AnimatedValueProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    formatNumber(latest, format, decimals),
  );
  const [delta, setDelta] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    if (value !== from) {
      const diff = value - from;
      if (showDelta && Math.abs(diff) > 0.01 && from !== 0) {
        setDelta(diff);
        const t = setTimeout(() => setDelta(null), 1600);
        prev.current = value;
        setPulseKey((k) => k + 1);
        return () => {
          controls.stop();
          clearTimeout(t);
        };
      }
      setPulseKey((k) => k + 1);
    }
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, motionValue, showDelta]);

  const pulseColorMap: Record<string, string> = {
    success: "text-success",
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
  };

  return (
    <span className={cn("relative inline-flex items-baseline tabular-nums", className)}>
      {prefix}
      <motion.span key={pulseKey} className="relative inline-block">
        <motion.span>{rounded}</motion.span>
        <motion.span
          aria-hidden
          initial={{ opacity: 0.45, scale: 1 }}
          animate={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 -z-10 blur-md"
          style={{
            background:
              pulseColor === "success"
                ? "color-mix(in oklab, var(--success) 35%, transparent)"
                : pulseColor === "primary"
                  ? "color-mix(in oklab, var(--primary) 35%, transparent)"
                  : pulseColor === "accent"
                    ? "color-mix(in oklab, var(--accent) 35%, transparent)"
                    : "color-mix(in oklab, var(--destructive) 35%, transparent)",
          }}
        />
      </motion.span>
      {suffix}
      {delta !== null && (
        <motion.span
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: [-2, -22, -28, -36], scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
          className={cn(
            "pointer-events-none absolute -right-1 -top-2 text-xs font-bold tracking-tight",
            delta > 0 ? pulseColorMap[pulseColor] : "text-destructive",
          )}
        >
          {delta > 0 ? "+" : "−"}
          {format === "currency" ? "R$ " : ""}
          {formatNumber(Math.abs(delta), format, decimals)}
          {format === "percent" ? "%" : ""}
        </motion.span>
      )}
    </span>
  );
}

interface AnimatedCurrencyProps extends Omit<AnimatedValueProps, "format" | "prefix"> {
  /** Currency code symbol; defaults to R$ */
  symbol?: string;
}

export function AnimatedCurrency({ symbol = "R$ ", ...rest }: AnimatedCurrencyProps) {
  return <AnimatedValue {...rest} prefix={symbol} format="currency" />;
}

export function AnimatedPercent(props: Omit<AnimatedValueProps, "format" | "suffix">) {
  return <AnimatedValue {...props} format="percent" suffix="%" />;
}
