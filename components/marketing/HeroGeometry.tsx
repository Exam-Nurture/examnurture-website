/**
 * Exam motifs: geometry that means something, drawn from the exam world.
 *
 *   Answer sheet  — OMR bubbles fill one row at a time (answering)
 *   Timer ring    — a marigold arc sweeps round (time; marigold = time)
 *   Score chart   — bars rise and a trend line draws in (improving)
 *
 * Built for the deep indigo hero (.en-hero-deep): white strokes at low
 * opacity, one warm accent. Slow loops (9–16 s). Decorative only:
 * aria-hidden, no pointer events; globals.css stops all motion under
 * prefers-reduced-motion.
 *
 * variant="full"    homepage: all three motifs
 * variant="compact" page headers: timer ring + score chart (chartSide)
 */

const MARIGOLD = "#F2B65A";
const ANSWERS = [1, 3, 0, 2, 1];

function AnswerSheet({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 190" fill="none">
      <rect x="1" y="1" width="148" height="188" rx="14" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.18)" />
      <rect x="16" y="16" width="62" height="6" rx="3" fill="rgba(255,255,255,.28)" />
      <rect x="16" y="28" width="38" height="4" rx="2" fill="rgba(255,255,255,.16)" />
      {ANSWERS.map((ans, row) => {
        const cy = 56 + row * 27;
        return (
          <g key={row}>
            <rect x="16" y={cy - 2} width="10" height="4" rx="2" fill="rgba(255,255,255,.22)" />
            {[0, 1, 2, 3].map((col) => (
              <circle key={col} cx={44 + col * 26} cy={cy} r="8" stroke="rgba(255,255,255,.34)" strokeWidth="1.4" />
            ))}
            <circle
              className="en-m-bubble"
              style={{ animationDelay: `${row * 1.3}s` }}
              cx={44 + ans * 26}
              cy={cy}
              r="5.5"
              fill="rgba(255,255,255,.92)"
            />
          </g>
        );
      })}
    </svg>
  );
}

function TimerRing({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        // round so server and browser render identical numbers (avoids a hydration mismatch)
        const r = (n: number) => Math.round(n * 100) / 100;
        const x1 = r(80 + Math.sin(a) * 70), y1 = r(80 - Math.cos(a) * 70);
        const x2 = r(80 + Math.sin(a) * 76), y2 = r(80 - Math.cos(a) * 76);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.32)" strokeWidth={i % 3 === 0 ? 2 : 1.2} strokeLinecap="round" />;
      })}
      <circle cx="80" cy="80" r="60" stroke="rgba(255,255,255,.14)" strokeWidth="6" />
      <circle
        className="en-m-sweep"
        cx="80"
        cy="80"
        r="60"
        stroke={MARIGOLD}
        strokeWidth="6"
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
      />
      <circle cx="80" cy="80" r="4" fill="rgba(255,255,255,.8)" />
      <circle cx="80" cy="80" r="40" stroke="rgba(255,255,255,.08)" strokeDasharray="2 5" />
    </svg>
  );
}

function ScoreChart({ className = "" }: { className?: string }) {
  const heights = [26, 40, 36, 58, 76];
  const base = 96;
  const pts = heights.map((h, i) => `${19 + i * 32},${base - h - 8}`).join(" ");
  return (
    <svg className={className} viewBox="0 0 170 110" fill="none">
      <line x1="2" y1={base + 0.5} x2="168" y2={base + 0.5} stroke="rgba(255,255,255,.22)" />
      {heights.map((h, i) => (
        <rect
          key={i}
          className="en-m-bar"
          style={{ animationDelay: `${i * 0.18}s` }}
          x={10 + i * 32}
          y={base - h}
          width="18"
          height={h}
          rx="4"
          fill={i === heights.length - 1 ? "rgba(201,203,255,.85)" : "rgba(255,255,255,.2)"}
        />
      ))}
      <polyline className="en-m-draw" points={pts} stroke="rgba(255,255,255,.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={19 + 4 * 32} cy={base - heights[4] - 8} r="3.5" fill="#fff" />
    </svg>
  );
}

export default function HeroGeometry({
  variant = "full",
  chartSide = "right",
}: {
  variant?: "full" | "compact";
  /** compact only: put the score chart on the left for centred headers */
  chartSide?: "left" | "right";
}) {
  if (variant === "compact") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <TimerRing className="en-float-slow absolute -right-10 -top-8 h-44 w-44 opacity-50 sm:opacity-80 md:right-[6%] md:top-6 lg:h-52 lg:w-52" />
        <ScoreChart className={`absolute bottom-6 hidden h-24 w-36 opacity-80 lg:block ${chartSide === "left" ? "left-[7%]" : "right-[30%]"}`} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnswerSheet className="en-float-slow absolute left-[5%] top-[20%] hidden h-[200px] w-[158px] lg:block" />
      <TimerRing className="absolute -right-12 -top-10 h-44 w-44 opacity-40 sm:opacity-70 lg:right-[6%] lg:top-[12%] lg:h-56 lg:w-56 lg:opacity-100" />
      <ScoreChart className="absolute bottom-[12%] right-[8%] hidden h-28 w-44 lg:block" />
      {/* two quiet accents so the space feels alive, not busy */}
      <svg className="en-float absolute bottom-[18%] left-[16%] hidden h-6 w-6 lg:block" viewBox="0 0 24 24">
        <path d="M12 4v16M4 12h16" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <svg className="en-float absolute right-[30%] top-[16%] hidden h-3 w-3 lg:block" viewBox="0 0 10 10" style={{ animationDelay: "-5s" }}>
        <circle cx="5" cy="5" r="4" fill="rgba(255,255,255,.4)" />
      </svg>
    </div>
  );
}
