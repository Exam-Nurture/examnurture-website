import HeroGeometry from "@/components/marketing/HeroGeometry";

/**
 * The one page header for every public page (v2): deep indigo band, exam
 * motifs, eyebrow + title + one-line subtitle, optional slot (search, buttons).
 * Keeps every page visually tied to the homepage hero.
 *
 *   <PageHero eyebrow="Past papers" title="Every year, with solutions." subtitle="…">
 *     <SearchBox />
 *   </PageHero>
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  align = "left",
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  children?: React.ReactNode;
}) {
  const center = align === "center";
  return (
    <section className="en-hero-deep">
      <HeroGeometry variant="compact" chartSide={center ? "left" : "right"} />
      <div
        className={`relative mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pb-24 pt-12 sm:px-6 lg:pb-28 lg:pt-16 ${
          center ? "items-center text-center" : ""
        }`}
      >
        <p className="en-rise text-xs font-semibold uppercase tracking-[0.1em] text-[#C9CBFF]">{eyebrow}</p>
        <h1
          style={{ fontFamily: "var(--font-sora)", animationDelay: "60ms" }}
          className={`en-rise text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl ${center ? "max-w-3xl" : "max-w-2xl"}`}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ animationDelay: "120ms" }} className="en-rise max-w-xl text-lg leading-relaxed text-white/80">
            {subtitle}
          </p>
        )}
        {children && (
          <div style={{ animationDelay: "180ms" }} className={`en-rise mt-2 w-full ${center ? "flex justify-center" : ""}`}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** White search card used inside PageHero (controlled or plain GET form). */
export function HeroSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  action,
  name = "q",
}: {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  action?: string;
  name?: string;
}) {
  const field = (
    <>
      <svg className="h-5 w-5 flex-none text-[var(--ink-3)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        name={name}
        type="search"
        placeholder={placeholder}
        {...(onChange ? { value: value ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
        className="min-h-12 min-w-0 flex-1 bg-transparent py-3 text-base text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
      />
    </>
  );
  const cls =
    "flex w-full max-w-[600px] items-center gap-3 rounded-[16px] bg-[var(--card)] px-4 shadow-[0_20px_50px_-12px_rgba(10,12,60,.55)] ring-1 ring-white/20 focus-within:ring-4 focus-within:ring-white/30";
  return action ? (
    <form action={action} role="search" className={cls}>{field}</form>
  ) : (
    <div role="search" className={cls}>{field}</div>
  );
}

/** Soft section heading with the drawn underline (needs a .reveal ancestor to animate). */
export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>{children}</h2>
        <span className="en-grow" aria-hidden="true" />
      </div>
      {aside}
    </div>
  );
}
