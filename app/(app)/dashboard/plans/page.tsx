"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Star,
  ChevronDown,
  BookOpen,
  FileText,
  Flame,
  Loader2,
  Lock,
  Users,
  GraduationCap,
  Check,
  X,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  apiGetTierDefinitions,
  apiTierCheckout,
  apiTierVerify,
  type TierDefinition,
  type TierContent,
} from "@/lib/api";

declare const Razorpay: new (opts: object) => { open(): void };

// ── Content type display config ────────────────────────────────────────────────

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TEST_SERIES: { label: "Test Series", icon: <FileText size={13} />, color: "text-blue-500" },
  PYQ: { label: "PYQ Papers", icon: <BookOpen size={13} />, color: "text-purple-500" },
  STUDY_MATERIAL: { label: "Study Material", icon: <GraduationCap size={13} />, color: "text-green-500" },
  MENTORSHIP: { label: "Mentorship", icon: <Users size={13} />, color: "text-orange-500" },
  COURSE: { label: "Courses", icon: <Flame size={13} />, color: "text-pink-500" },
};

// ── Tier color palette ─────────────────────────────────────────────────────────

const TIER_COLORS = [
  { color: "#4F7BF7", colorSoft: "#EEF2FF", highlight: false },
  { color: "#7C3AED", colorSoft: "#F5F3FF", highlight: true },
  { color: "#0D9488", colorSoft: "#F0FDFA", highlight: false },
];

function getTierStyle(idx: number) {
  return TIER_COLORS[idx % TIER_COLORS.length];
}

// ── Product access matrix (static, reflects platform product rules) ────────────

const PRODUCT_MATRIX = [
  {
    product: "Previous Year Papers",
    icon: <BookOpen size={15} />,
    color: "text-purple-500",
    free: "All papers",
    tiers: "All included",
    individual: false,
  },
  {
    product: "Test Series",
    icon: <FileText size={15} />,
    color: "text-blue-500",
    free: "Selected free",
    tiers: "Tier-assigned series",
    individual: true,
  },
  {
    product: "Courses",
    icon: <Flame size={15} />,
    color: "text-pink-500",
    free: "Selected free",
    tiers: "Tier-assigned courses",
    individual: true,
  },
  {
    product: "Mentorship Program",
    icon: <Users size={15} />,
    color: "text-orange-500",
    free: false,
    tiers: false,
    individual: true,
  },
  {
    product: "Study Material",
    icon: <GraduationCap size={15} />,
    color: "text-green-500",
    free: "Selected free",
    tiers: "Tier-assigned materials",
    individual: true,
  },
];

// ── Checkout ─────────────────────────────────────────────────────────────────

async function launchTierCheckout(tier: TierDefinition, isYearly: boolean) {
  const billingCycle = isYearly ? "YEARLY" : "MONTHLY";
  const data = await apiTierCheckout(tier.id, billingCycle);

  return new Promise<void>((resolve, reject) => {
    const rz = new Razorpay({
      key: data.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "ExamNurture",
      description: `${tier.name} — ${billingCycle.toLowerCase()}`,
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await apiTierVerify({
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
            tierId: tier.id,
            billingCycle,
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rz.open();
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [tiers, setTiers] = useState<TierDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetTierDefinitions()
      .then(setTiers)
      .catch(() => setTiers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-12 fade-up pb-12" style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div className="text-center max-w-2xl mx-auto pt-4">
        <h1
          className="text-4xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          Choose your plan
        </h1>
        <p className="text-[var(--ink-3)] text-lg mb-8 leading-relaxed">
          Start free. Upgrade for premium content.
          <br />
          Individual purchases survive tier expiry — never lose what you paid for.
        </p>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center justify-center gap-4 text-sm font-medium">
          <span className={!isYearly ? "text-[var(--ink-1)]" : "text-[var(--ink-4)]"}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-14 h-7 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{ background: "var(--line-soft)" }}
            aria-label="Toggle Billing"
          >
            <motion.div
              className="absolute top-1 bottom-1 w-5 rounded-full shadow-sm"
              style={{ background: "var(--blue)" }}
              animate={{ left: isYearly ? "calc(100% - 1.5rem)" : "0.25rem" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={isYearly ? "text-[var(--ink-1)]" : "text-[var(--ink-4)]"}>Yearly</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">
              Save 40%+
            </span>
          </div>
        </div>
      </div>

      {/* ── Plan Cards: Free + Tiers ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--ink-4)]" />
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 items-start ${tiers.length > 0 ? "md:grid-cols-4" : "md:grid-cols-1 max-w-xs mx-auto"}`}>
          {/* Free plan card — always shown first */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <FreePlanCard />
          </motion.div>

          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (i + 1) * 0.1 }}
            >
              <TierCard tier={tier} isYearly={isYearly} style={getTierStyle(i)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Product Access Matrix ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2
          className="text-2xl font-bold tracking-tight mb-2 text-center"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          What&apos;s included at each level?
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "var(--ink-4)" }}>
          All products, all access levels — at a glance
        </p>
        <ProductMatrix tierCount={tiers.length} />
      </motion.div>

      {/* ── What's included breakdown ── */}
      {!loading && tiers.length > 0 && (
        <div>
          <h2
            className="text-2xl font-bold tracking-tight mb-2 text-center"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
          >
            What&apos;s inside each tier?
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: "var(--ink-4)" }}>
            Admin assigns specific test series, PYQs, materials, and mentorships to each tier
          </p>
          <div className="flex flex-col gap-4">
            {tiers.map((tier, i) => (
              <TierBreakdown key={tier.id} tier={tier} style={getTierStyle(i)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Individual Purchase Section ── */}
      <IndividualPurchaseSection />

      {/* ── Enterprise CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-3xl mx-auto w-full glass rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h4 className="text-lg font-bold font-[var(--font-sora)] text-[var(--ink-1)]">
            Need a custom solution for your coaching institute?
          </h4>
          <p className="text-sm text-[var(--ink-3)] mt-1">
            We offer white-labeled portals and bulk student discounts.
          </p>
        </div>
        <Button variant="secondary" className="flex-shrink-0">
          Contact Sales
        </Button>
      </motion.div>
    </div>
  );
}

// ── Free Plan Card ─────────────────────────────────────────────────────────────

function FreePlanCard() {
  const router = useRouter();

  return (
    <div className="relative rounded-3xl p-7 flex flex-col h-full bg-[var(--card)] border border-[var(--line-soft)] shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-5">
        <h3 className="text-xl font-bold font-[var(--font-sora)] text-[var(--ink-1)] mb-1">
          Free
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          No credit card
        </span>
        <p className="text-xs mt-2 leading-relaxed text-[var(--ink-3)]">
          Start immediately. Access all PYQ papers and selected free content with no cost.
        </p>
      </div>

      {/* Price */}
      <div className="mb-5 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold font-[var(--font-sora)] text-[var(--ink-1)]">₹0</span>
        <span className="text-sm text-[var(--ink-4)] font-medium">forever</span>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-500">
          <BookOpen size={13} /> All PYQs
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500">
          <FileText size={13} /> Free tests
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-500">
          <GraduationCap size={13} /> Free material
        </span>
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={() => router.push("/dashboard")}
        className="w-full mb-6 rounded-xl"
      >
        Start Free
      </Button>

      <div className="flex flex-col gap-2.5 mt-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-4)]">
          Always free
        </div>
        {[
          { icon: <BookOpen size={14} />, label: "PYQ Papers", note: "All papers" },
          { icon: <FileText size={14} />, label: "Test Series", note: "Selected free" },
          { icon: <Flame size={14} />, label: "Courses", note: "Selected free" },
          { icon: <GraduationCap size={14} />, label: "Study Material", note: "Selected free" },
        ].map((item) => (
          <div key={item.label} className="flex gap-2.5 items-center">
            <CheckCircle2 size={14} className="flex-shrink-0 text-green-500" />
            <span className="text-[12px] text-[var(--ink-2)] leading-snug">
              <span className="font-medium">{item.label}</span>
              {" "}— {item.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tier Card ─────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isYearly,
  style,
}: {
  tier: TierDefinition;
  isYearly: boolean;
  style: { color: string; colorSoft: string; highlight: boolean };
}) {
  const amountPaise = isYearly ? tier.yearlyPaise : tier.monthlyPaise;
  const price = amountPaise / 100;
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const contentSummary = summarizeContents(tier.contents);

  const handleGetStarted = async () => {
    setPaying(true);
    setPayError("");
    try {
      await launchTierCheckout(tier, isYearly);
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      if (msg !== "Payment cancelled") setPayError(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-7 flex flex-col h-full bg-[var(--card)] ${
        style.highlight
          ? "border-2 shadow-2xl z-10"
          : "border border-[var(--line-soft)] shadow-md hover:shadow-lg transition-shadow"
      }`}
      style={style.highlight ? { borderColor: style.color } : undefined}
    >
      {style.highlight && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <div
            className="text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider"
            style={{ background: style.color }}
          >
            <Star size={12} fill="white" /> Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold font-[var(--font-sora)] text-[var(--ink-1)]">
            {tier.name}
          </h3>
        </div>
        {tier.eligibility && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: style.colorSoft, color: style.color }}
          >
            {tier.eligibility}
          </span>
        )}
        <p className="text-xs mt-2 leading-relaxed text-[var(--ink-3)]">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5 flex items-baseline gap-2">
        {price > 0 ? (
          <>
            <span className="text-3xl font-extrabold font-[var(--font-sora)] text-[var(--ink-1)]">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-[var(--ink-4)] font-medium">
              /{isYearly ? "year" : "month"}
            </span>
          </>
        ) : (
          <span className="text-xl font-bold text-[var(--ink-3)]">Pricing not set</span>
        )}
      </div>

      {/* Content summary */}
      {Object.keys(contentSummary).length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          {Object.entries(contentSummary).map(([type, count]) => {
            const meta = CONTENT_TYPE_META[type];
            if (!meta) return null;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${meta.color}`}
              >
                {meta.icon}
                {count} {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {payError && <p className="text-xs text-red-500 mb-2 text-center">{payError}</p>}

      <Button
        variant={style.highlight ? "default" : "outline"}
        size="lg"
        onClick={handleGetStarted}
        disabled={paying || price === 0}
        className={`w-full mb-6 rounded-xl ${style.highlight ? "shadow-md" : ""}`}
        style={style.highlight ? { background: style.color } : undefined}
      >
        {paying ? <Loader2 size={16} className="animate-spin" /> : "Get Started"}
      </Button>

      {/* Content perks list */}
      {tier.contents.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-auto">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-4)]">
            Included content
          </div>
          {tier.contents.slice(0, 5).map((c) => {
            const meta = CONTENT_TYPE_META[c.contentType];
            return (
              <div key={c.id} className="flex gap-2.5 items-center">
                <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: style.color }} />
                <span className="text-[12px] text-[var(--ink-2)] leading-snug">
                  <span className={`font-medium ${meta?.color ?? ""}`}>{meta?.label ?? c.contentType}</span>
                  {c.contentTitle ? ` — ${c.contentTitle}` : ""}
                </span>
              </div>
            );
          })}
          {tier.contents.length > 5 && (
            <span className="text-[11px] font-medium" style={{ color: style.color }}>
              +{tier.contents.length - 5} more items
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Product Access Matrix ─────────────────────────────────────────────────────

function ProductMatrix({ tierCount }: { tierCount: number }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--line-soft)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-soft)" }}>
            <th className="text-left px-5 py-4 font-semibold text-[var(--ink-1)] w-48">Product</th>
            <th className="px-4 py-4 text-center font-semibold">
              <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-bold uppercase tracking-wider">
                Free
              </span>
            </th>
            {tierCount > 0 && (
              <th className="px-4 py-4 text-center font-semibold text-[var(--ink-2)]">
                Tier Plans
              </th>
            )}
            <th className="px-4 py-4 text-center font-semibold text-[var(--ink-2)]">
              Buy Individually
            </th>
          </tr>
        </thead>
        <tbody>
          {PRODUCT_MATRIX.map((row, i) => (
            <tr
              key={row.product}
              style={{
                background: i % 2 === 0 ? "var(--card)" : "var(--bg)",
                borderBottom: i < PRODUCT_MATRIX.length - 1 ? "1px solid var(--line-soft)" : "none",
              }}
            >
              <td className="px-5 py-4">
                <div className={`flex items-center gap-2 font-medium text-[var(--ink-1)] ${row.color}`}>
                  {row.icon}
                  <span className="text-[var(--ink-1)]">{row.product}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                {row.free ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <Check size={16} className="text-green-500" />
                    <span className="text-[10px] text-[var(--ink-3)]">{row.free}</span>
                  </div>
                ) : (
                  <X size={16} className="text-[var(--ink-4)] mx-auto" />
                )}
              </td>
              {tierCount > 0 && (
                <td className="px-4 py-4 text-center">
                  {row.tiers ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <Check size={16} className="text-blue-500" />
                      <span className="text-[10px] text-[var(--ink-3)]">{row.tiers}</span>
                    </div>
                  ) : (
                    <X size={16} className="text-[var(--ink-4)] mx-auto" />
                  )}
                </td>
              )}
              <td className="px-4 py-4 text-center">
                {row.individual ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <Check size={16} className="text-orange-500" />
                    <span className="text-[10px] text-[var(--ink-3)]">Available</span>
                  </div>
                ) : (
                  <X size={16} className="text-[var(--ink-4)] mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Individual Purchase Section ───────────────────────────────────────────────

function IndividualPurchaseSection() {
  const router = useRouter();

  const INDIVIDUAL_ITEMS = [
    {
      type: "TEST_SERIES",
      label: "Test Series",
      icon: <FileText size={20} />,
      color: "#4F7BF7",
      colorSoft: "#EEF2FF",
      description: "Buy specific test series for your target exam. Lifetime access — not tied to any tier.",
      href: "/test-series",
    },
    {
      type: "COURSE",
      label: "Courses",
      icon: <Flame size={20} />,
      color: "#EC4899",
      colorSoft: "#FDF2F8",
      description: "Purchase individual courses. Access doesn't expire when your tier ends.",
      href: "/dashboard/courses",
    },
    {
      type: "MENTORSHIP",
      label: "Mentorship Program",
      icon: <Users size={20} />,
      color: "#F97316",
      colorSoft: "#FFF7ED",
      description: "One-on-one guidance from expert mentors. Only available as individual purchase.",
      href: "/mentorship",
    },
    {
      type: "STUDY_MATERIAL",
      label: "Study Material",
      icon: <GraduationCap size={20} />,
      color: "#0D9488",
      colorSoft: "#F0FDFA",
      description: "Buy premium study notes, books, and PDFs for your exam preparation.",
      href: "/study-material",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
          <ShoppingCart size={14} className="text-[var(--ink-3)]" />
          <span className="text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider">Individual Purchases</span>
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
      </div>

      <p className="text-sm text-center mb-8 mt-2" style={{ color: "var(--ink-4)" }}>
        Only need one item? Buy individually with Razorpay — your access never expires when a tier ends.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {INDIVIDUAL_ITEMS.map((item) => (
          <div
            key={item.type}
            className="rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line-soft)",
            }}
            onClick={() => router.push(item.href)}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.colorSoft, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--ink-1)] mb-1" style={{ fontFamily: "var(--font-sora)" }}>
                  {item.label}
                </div>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: item.color }}>
              <Lock size={12} />
              <span>Secure checkout via Razorpay</span>
              <ArrowRight size={12} className="ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Tier Breakdown — expandable content list ──────────────────────────────────

function TierBreakdown({
  tier,
  style,
}: {
  tier: TierDefinition;
  style: { color: string; colorSoft: string };
}) {
  const [open, setOpen] = useState(false);
  const contentSummary = summarizeContents(tier.contents);

  const byType: Record<string, TierContent[]> = {};
  for (const c of tier.contents) {
    if (!byType[c.contentType]) byType[c.contentType] = [];
    byType[c.contentType].push(c);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow"
      style={{
        background: "var(--card)",
        border: `1px solid ${open ? style.color : "var(--line-soft)"}`,
        boxShadow: open ? "var(--shadow-md)" : "var(--shadow-xs)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[var(--bg)]"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: style.colorSoft }}
        >
          <Flame size={18} style={{ color: style.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold font-[var(--font-sora)] text-[var(--ink-1)]">
            {tier.name}
          </div>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            {tier.eligibility} ·{" "}
            {Object.entries(contentSummary)
              .map(([t, n]) => `${n} ${CONTENT_TYPE_META[t]?.label ?? t}`)
              .join(", ") || "No content assigned yet"}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="transition-transform flex-shrink-0"
          style={{
            color: "var(--ink-4)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 flex flex-col gap-5">
              {tier.contents.length === 0 ? (
                <p className="text-sm text-[var(--ink-4)]">No content assigned to this tier yet.</p>
              ) : (
                Object.entries(byType).map(([type, items]) => {
                  const meta = CONTENT_TYPE_META[type];
                  return (
                    <div key={type}>
                      <div
                        className={`text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${meta?.color ?? ""}`}
                      >
                        {meta?.icon}
                        {meta?.label ?? type}
                      </div>
                      <div className="flex flex-col gap-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg px-3 py-2 text-[12px] text-[var(--ink-2)]"
                            style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}
                          >
                            {item.contentTitle ?? item.contentId}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function summarizeContents(contents: TierContent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of contents) {
    counts[c.contentType] = (counts[c.contentType] ?? 0) + 1;
  }
  return counts;
}
