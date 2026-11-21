/**
 * Slow, quiet geometric motion behind the homepage hero.
 *
 * Thin indigo outlines at low opacity plus one small marigold accent. Every
 * movement is slow (14–70 s loops) so it reads as calm, not busy. Decorative
 * only: aria-hidden, no pointer events, and the global reduced-motion rule in
 * globals.css stops it for students who turn motion off.
 */
export default function HeroGeometry() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large dashed ring, top right, turning very slowly */}
      <svg className="en-spin-slow absolute -right-24 -top-28 h-[420px] w-[420px] opacity-60 sm:-right-16 lg:right-[4%]" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="96" fill="none" stroke="var(--brand-line)" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--brand-line)" strokeWidth="1" />
      </svg>

      {/* Orbiting dot on the inner ring */}
      <svg className="en-spin-mid absolute -right-24 -top-28 h-[420px] w-[420px] sm:-right-16 lg:right-[4%]" viewBox="0 0 200 200">
        <circle cx="100" cy="30" r="3" fill="var(--brand)" opacity="0.55" />
      </svg>

      {/* Rounded square, left, slow turn */}
      <svg className="en-spin-rev absolute -left-10 top-[38%] hidden h-40 w-40 opacity-70 sm:block lg:left-[6%]" viewBox="0 0 100 100">
        <rect x="18" y="18" width="64" height="64" rx="14" fill="none" stroke="var(--brand-line)" strokeWidth="1.2" />
      </svg>

      {/* Triangle, lower right, floating */}
      <svg className="en-float absolute bottom-[14%] right-[10%] hidden h-24 w-24 opacity-80 md:block" viewBox="0 0 100 100">
        <path d="M50 14 L88 82 L12 82 Z" fill="none" stroke="var(--brand-line)" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>

      {/* Small marigold square: the single warm accent */}
      <svg className="en-spin-fast absolute left-[16%] top-[18%] hidden h-5 w-5 md:block" viewBox="0 0 20 20">
        <rect x="3" y="3" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.75" />
      </svg>

      {/* Soft filled circle, bottom left */}
      <svg className="en-float-slow absolute bottom-[10%] left-[12%] hidden h-14 w-14 lg:block" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="var(--brand)" opacity="0.08" />
      </svg>

      {/* Plus mark, right middle */}
      <svg className="en-float absolute right-[24%] top-[30%] hidden h-6 w-6 opacity-70 lg:block" viewBox="0 0 24 24" style={{ animationDelay: "-4s" }}>
        <path d="M12 4v16M4 12h16" stroke="var(--brand-line)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
