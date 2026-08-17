"use client";

/**
 * Asymmetric bento layout primitive.
 *
 * A 12-column grid on desktop that collapses to 6 columns on tablet and a
 * single column on mobile. Cells declare their desktop span and, optionally,
 * a distinct tablet span so the composition re-flows deliberately instead of
 * stacking into one long list.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Span = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

const DESKTOP: Record<Span, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
};

const TABLET: Record<number, string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  6: "sm:col-span-6",
};

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
      }}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12",
        "gap-3.5 sm:gap-4",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function BentoCell({
  span,
  tablet = 6,
  children,
  className,
}: {
  span: Span;
  /** Column span at the `sm` breakpoint (out of 6). Defaults to full width. */
  tablet?: 2 | 3 | 4 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={cn("min-w-0", TABLET[tablet], DESKTOP[span], className)}
    >
      {children}
    </motion.div>
  );
}
