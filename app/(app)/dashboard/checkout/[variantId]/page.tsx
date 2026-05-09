"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  apiPreviewPrice,
  apiValidateCoupon,
  apiCreateOrder,
  apiVerifyOrder,
  type PriceBreakdown,
  type CouponValidation,
} from "@/lib/api";
import {
  ArrowLeft, Tag, CheckCircle2, ShieldCheck, Users,
  Clock, Star, Zap, X, Loader2, CreditCard, Lock,
  GraduationCap, Calendar,
} from "lucide-react";

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function paise(p: number) {
  return `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span className={highlight ? "font-bold" : ""} style={{ color: highlight ? "var(--green)" : "var(--ink-2)" }}>
        {value}
      </span>
    </div>
  );
}

/* ── Content-type metadata ── */
const CONTENT_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MENTORSHIP:    { label: "Mentorship Program",    icon: Users,          color: "var(--violet, #7c3aed)" },
  TEST_SERIES:   { label: "Test Series",           icon: GraduationCap,  color: "var(--blue)"  },
  TIER:          { label: "Subscription Plan",     icon: Zap,            color: "var(--amber, #d97706)"  },
  PYQ:           { label: "Previous Year Papers",  icon: Clock,          color: "var(--green)"  },
  COURSE:        { label: "Video Course",          icon: Star,           color: "var(--blue)"  },
};

export default function CheckoutPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const variantId    = decodeURIComponent(params.variantId as string);
  const parts        = variantId.split(":");
  const contentType  = parts[0];
  const contentId    = parts[1];
  const billingCycle = parts[2] as "MONTHLY" | "YEARLY" | undefined;
  const durationDays = parseInt(searchParams.get("days") || "365", 10);

  // Rich metadata from query params (passed by product pages)
  const productTitle  = searchParams.get("title")  || "";
  const mentorName    = searchParams.get("mentor") || "";
  const weeks         = searchParams.get("weeks")  || "";

  const meta = CONTENT_LABELS[contentType] ?? { label: contentType.replace(/_/g, " "), icon: CreditCard, color: "var(--blue)" };
  const MetaIcon = meta.icon;

  const [breakdown, setBreakdown]       = useState<PriceBreakdown | null>(null);
  const [couponCode, setCouponCode]     = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [loading, setLoading]           = useState(true);
  const [paying, setPaying]             = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);
  const [devModal, setDevModal]         = useState<{ orderId: string } | null>(null);

  const fetchPreview = useCallback(async (coupon?: string) => {
    try {
      setLoading(true);
      setError("");
      const { breakdown: b } = await apiPreviewPrice({ contentType, contentId, billingCycle, couponCode: coupon });
      setBreakdown(b);
    } catch (e: any) {
      setError(e.message || "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId, billingCycle]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !breakdown) return;
    try {
      const result = await apiValidateCoupon({ code: couponCode.trim(), contentType, contentId, baseAmountPaise: breakdown.baseAmountPaise });
      setCouponResult(result);
      if (result.valid) await fetchPreview(couponCode.trim());
    } catch {
      setCouponResult({ valid: false, reason: "Could not validate coupon" });
    }
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setCouponResult(null);
    fetchPreview();
  }

  async function handlePay() {
    if (!breakdown || paying) return;
    setError("");
    setPaying(true);
    try {
      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const { orderId, razorpayOrderId, keyId } = await apiCreateOrder({
        contentType, contentId, billingCycle, durationDays,
        couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        idempotencyKey,
      });

      // Dev mode: no real Razorpay key configured — show a demo payment modal
      if (!keyId || razorpayOrderId?.startsWith("order_dev_")) {
        setDevModal({ orderId });
        setPaying(false);
        return;
      }

      // Real Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          order_id: razorpayOrderId,
          amount: breakdown.finalAmountPaise,
          currency: "INR",
          name: "ExamNurture",
          description: productTitle || `${contentType} — ${contentId}`,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await apiVerifyOrder({ orderId, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
              setSuccess(true);
              setTimeout(() => router.push("/dashboard/mentorship"), 2500);
              resolve();
            } catch (e: any) {
              reject(new Error(e.message || "Payment verification failed"));
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          theme: { color: "#7C3AED" },
          prefill: {},
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp: any) => reject(new Error(resp.error?.description || "Payment failed")));
        rzp.open();
      });
    } catch (e: any) {
      if (e.message !== "Payment cancelled") setError(e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  async function handleDevConfirm() {
    if (!devModal) return;
    setPaying(true);
    try {
      await apiVerifyOrder({
        orderId: devModal.orderId,
        razorpayPaymentId: `pay_dev_${Date.now()}`,
        razorpaySignature: "dev_signature",
      });
      setDevModal(null);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/mentorship"), 2500);
    } catch (e: any) {
      setError(e.message || "Could not complete payment");
      setDevModal(null);
    } finally {
      setPaying(false);
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="card flex flex-col items-center text-center p-10 max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: "var(--green-soft)" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "var(--green)" }} />
          </motion.div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            Payment Successful!
          </h2>
          <p className="text-sm mb-2" style={{ color: "var(--ink-3)" }}>
            You're now enrolled in{" "}
            <span className="font-semibold" style={{ color: "var(--ink-1)" }}>
              {productTitle || "your program"}
            </span>
          </p>
          <p className="text-xs" style={{ color: "var(--ink-4)" }}>Redirecting to My Mentorships…</p>
          <div className="mt-4 w-32 h-1 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="h-full rounded-full"
              style={{ background: "var(--green)" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Dev payment modal ── */
  if (devModal) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="card max-w-sm w-full p-8 flex flex-col items-center text-center"
        >
          {/* Dev badge */}
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
            style={{ background: "var(--amber-soft, #fef3c7)", color: "var(--amber, #d97706)" }}>
            Test Mode — No real payment
          </div>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--blue-soft)" }}>
            <CreditCard className="w-8 h-8" style={{ color: "var(--blue)" }} />
          </div>

          <h2 className="text-xl font-extrabold mb-1" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            Simulated Razorpay
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--ink-3)" }}>
            Amount: <strong style={{ color: "var(--ink-1)" }}>{breakdown ? paise(breakdown.finalAmountPaise) : "—"}</strong>
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--ink-4)" }}>
            Razorpay keys are not configured. This simulates a successful payment so you can test the complete flow.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDevModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-70"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-2)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDevConfirm}
              disabled={paying}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--blue)" }}
            >
              {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : "Confirm Payment"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Main checkout ── */
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: "var(--ink-3)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-5">

        {/* ── Product summary card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}18` }}>
              <MetaIcon className="w-6 h-6" style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: meta.color }}>{meta.label}</div>
              <h1 className="text-lg font-extrabold leading-snug mb-1"
                style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
                {productTitle || `${contentType} — ${contentId.slice(0, 8)}…`}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {mentorName && (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
                    <Users className="w-3.5 h-3.5" /> {mentorName}
                  </div>
                )}
                {weeks && (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
                    <Clock className="w-3.5 h-3.5" /> {weeks} weeks
                  </div>
                )}
                {billingCycle && (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
                    <Calendar className="w-3.5 h-3.5" /> {billingCycle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* What's included */}
          {contentType === "MENTORSHIP" && (
            <div className="mt-5 pt-5 grid grid-cols-2 gap-2" style={{ borderTop: "1px solid var(--line-soft)" }}>
              {[
                "Weekly 1:1 Sessions",
                "Personalised Study Plan",
                "Doubt Resolution Support",
                "Interview Preparation",
                "Mock Test Analysis",
                "Till Selection Support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--green)" }} />
                  {item}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Pricing card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          className="card p-6"
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--ink-1)" }}>Order Summary</h2>

          {/* Coupon — optional, always visible */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-2" style={{ color: "var(--ink-3)" }}>
              <Tag className="w-3 h-3 inline mr-1" />
              Coupon code <span className="font-normal">(optional)</span>
            </label>
            {couponResult?.valid ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--green-soft)", border: "1px solid var(--green)" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--green)" }} />
                <span className="text-xs font-semibold flex-1" style={{ color: "var(--green)" }}>
                  <span className="font-black">{couponCode.toUpperCase()}</span> applied
                  {couponResult.discountPaise ? ` — saving ${paise(couponResult.discountPaise)}` : ""}
                </span>
                <button onClick={handleRemoveCoupon} className="p-0.5 rounded hover:opacity-70">
                  <X className="w-3.5 h-3.5" style={{ color: "var(--green)" }} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                    onKeyDown={(e) => e.key === "Enter" && couponCode.trim() && handleApplyCoupon()}
                    placeholder="Enter code or leave blank"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 hover:brightness-110"
                    style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                  >
                    Apply
                  </button>
                </div>
                {couponResult && !couponResult.valid && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--red)" }}>{couponResult.reason}</p>
                )}
              </>
            )}
          </div>

          {/* Price breakdown */}
          {loading ? (
            <div className="space-y-2.5">
              {[80, 60, 70, 90].map((w, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 rounded animate-pulse" style={{ width: `${w}px`, background: "var(--line)" }} />
                  <div className="h-4 rounded animate-pulse" style={{ width: "60px", background: "var(--line)" }} />
                </div>
              ))}
            </div>
          ) : breakdown ? (
            <div className="space-y-2.5">
              <Row label="Base price" value={paise(breakdown.baseAmountPaise)} />
              {breakdown.discountPaise > 0 && (
                <Row label="Coupon discount" value={`−${paise(breakdown.discountPaise)}`} highlight />
              )}
              <Row label="GST (18%)" value={paise(breakdown.gstPaise)} />
              <div className="flex justify-between items-center pt-3 mt-1 font-extrabold text-base"
                style={{ borderTop: "2px solid var(--line-soft)" }}>
                <span style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>Total</span>
                <span style={{ color: "var(--blue)" }}>{paise(breakdown.finalAmountPaise)}</span>
              </div>
            </div>
          ) : null}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mt-4"
                style={{ background: "var(--red-soft)", color: "var(--red)" }}
              >
                <X className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pay button */}
          <button
            onClick={!breakdown && !loading ? () => fetchPreview() : handlePay}
            disabled={paying || loading}
            className="w-full mt-5 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
            ) : breakdown ? (
              <><CreditCard className="w-4 h-4" /> Pay {paise(breakdown.finalAmountPaise)} via Razorpay</>
            ) : loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading price…</>
            ) : (
              "Retry"
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-4)" }}>
              <Lock className="w-3 h-3" /> Secured by Razorpay
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-4)" }}>
              <ShieldCheck className="w-3 h-3" /> 7-day refund guarantee
            </div>
          </div>
        </motion.div>

        {/* ── Need help ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-center text-xs"
          style={{ color: "var(--ink-4)" }}
        >
          Questions?{" "}
          <a href="mailto:info@examnurture.com" className="underline hover:opacity-70" style={{ color: "var(--blue)" }}>
            Contact support
          </a>{" "}
          ·{" "}
          <Link href="/mentorship" className="underline hover:opacity-70" style={{ color: "var(--blue)" }}>
            Back to programs
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
