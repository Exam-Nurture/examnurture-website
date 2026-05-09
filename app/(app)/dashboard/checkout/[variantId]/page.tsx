"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  apiPreviewPrice,
  apiValidateCoupon,
  apiCreateOrder,
  apiVerifyOrder,
  type PriceBreakdown,
  type CouponValidation,
} from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function paise(p: number) {
  return `₹${(p / 100).toFixed(2)}`;
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

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // variantId format: "TIER:1:MONTHLY" | "TEST_SERIES:abc123" | etc.
  const variantId = decodeURIComponent(params.variantId as string);
  const parts = variantId.split(":");
  const contentType = parts[0];
  const contentId = parts[1];
  const billingCycle = parts[2] as "MONTHLY" | "YEARLY" | undefined;
  const durationDays = parseInt(searchParams.get("days") || "365", 10);

  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchPreview = useCallback(
    async (coupon?: string) => {
      try {
        setLoading(true);
        const { breakdown: b } = await apiPreviewPrice({
          contentType,
          contentId,
          billingCycle,
          couponCode: coupon || undefined,
        });
        setBreakdown(b);
      } catch (e: any) {
        setError(e.message || "Failed to load pricing");
      } finally {
        setLoading(false);
      }
    },
    [contentType, contentId, billingCycle]
  );

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !breakdown) return;
    try {
      const result = await apiValidateCoupon({
        code: couponCode.trim(),
        contentType,
        contentId,
        baseAmountPaise: breakdown.baseAmountPaise,
      });
      setCouponResult(result);
      if (result.valid) {
        await fetchPreview(couponCode.trim());
      }
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
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway");

      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const { orderId, razorpayOrderId, keyId } = await apiCreateOrder({
        contentType,
        contentId,
        billingCycle,
        durationDays,
        couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        idempotencyKey,
      });

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          order_id: razorpayOrderId,
          amount: breakdown.finalAmountPaise,
          currency: "INR",
          name: "ExamNurture",
          description: `${contentType} — ${contentId}`,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await apiVerifyOrder({
                orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setSuccess(true);
              setTimeout(() => router.push("/dashboard/my-purchases"), 2000);
              resolve();
            } catch (e: any) {
              reject(new Error(e.message || "Payment verification failed"));
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
          theme: { color: "#2563eb" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (e: any) {
      if (e.message !== "Payment cancelled") {
        setError(e.message || "Payment failed");
      }
    } finally {
      setPaying(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--green-soft)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--ink-1)" }}>Payment Successful!</h2>
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>Redirecting to your purchases…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--ink-3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ink-1)" }}>Checkout</h1>

        <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-3)" }}>
            {contentType.replace(/_/g, " ")}
          </div>
          <div className="text-sm font-medium mb-4" style={{ color: "var(--ink-2)" }}>
            {billingCycle ? `${billingCycle} Plan` : `${durationDays}-day Access`}
          </div>

          {/* Coupon */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink-2)" }}>
              Coupon Code
            </label>
            {couponResult?.valid ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--green-soft)", border: "1px solid var(--green)" }}>
                <span className="text-xs font-semibold flex-1" style={{ color: "var(--green)" }}>
                  {couponCode.toUpperCase()} applied — saving {paise(couponResult.discountPaise ?? 0)}
                </span>
                <button onClick={handleRemoveCoupon} className="text-xs" style={{ color: "var(--red)" }}>Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                  placeholder="EXAMNURTURE20"
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--ink-1)" }}
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                >
                  Apply
                </button>
              </div>
            )}
            {couponResult && !couponResult.valid && (
              <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{couponResult.reason}</p>
            )}
          </div>

          {/* Price breakdown */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 rounded animate-pulse" style={{ background: "var(--line)" }} />
              ))}
            </div>
          ) : breakdown ? (
            <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <Row label="Price" value={paise(breakdown.baseAmountPaise)} />
              {breakdown.discountPaise > 0 && (
                <Row label="Coupon Discount" value={`−${paise(breakdown.discountPaise)}`} valueStyle={{ color: "var(--green)" }} />
              )}
              <Row label="GST (18%)" value={paise(breakdown.gstPaise)} />
              <div className="flex justify-between font-bold pt-2 border-t" style={{ borderColor: "var(--line)" }}>
                <span style={{ color: "var(--ink-1)" }}>Total</span>
                <span style={{ color: "var(--blue)" }}>{paise(breakdown.finalAmountPaise)}</span>
              </div>
            </div>
          ) : null}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm mb-4" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying || loading || !breakdown}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: "var(--blue)" }}
        >
          {paying ? "Processing…" : breakdown ? `Pay ${paise(breakdown.finalAmountPaise)}` : "Loading…"}
        </button>

        <p className="text-center text-xs mt-3" style={{ color: "var(--ink-3)" }}>
          Secured by Razorpay · GST inclusive
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink-2)", ...valueStyle }}>{value}</span>
    </div>
  );
}
