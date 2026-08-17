import Link from "next/link";

interface BrandLogoProps {
  /** "sm" = 32px image + 15px text (sidebar/topbar), "md" = 36px image + 17px text (header) */
  size?: "sm" | "md";
  className?: string;
}

export default function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const imgCls  = size === "sm" ? "w-8 h-8"   : "w-9 h-9";
  const textCls = size === "sm" ? "text-[15px]" : "text-[17px]";

  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/examnurture-logo.jpg"
        alt="ExamNurture"
        className={`${imgCls} rounded-xl object-cover shadow-sm shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:-rotate-2`}
      />
      <span
        className={`font-bold ${textCls} tracking-tight whitespace-nowrap`}
        style={{ fontFamily: "var(--font-sora, sans-serif)" }}
      >
        <span style={{ color: "var(--ink-1)" }}>Exam</span>
        <span style={{ color: "var(--blue)" }}>Nurture</span>
      </span>
    </Link>
  );
}
